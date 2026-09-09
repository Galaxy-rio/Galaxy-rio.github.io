import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { Miniflare } from 'miniflare';
import { siteConfig } from '../scripts/site-config.mjs';

const md5 = (value) => createHash('md5').update(value).digest('hex');
const adminToken = md5('local-test-password-only');
const origin = 'https://www.galaxyrio.top';
let runtime;
let db;

const call = async (event, accessToken = 'test-visitor') => {
  const response = await runtime.dispatchFetch('https://comments.galaxyrio.top/', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.10' },
    body: JSON.stringify({ ...event, accessToken }),
  });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return response.json();
};

before(async () => {
  runtime = new Miniflare({
    modules: true,
    scriptPath: fileURLToPath(new URL('../dist/index.js', import.meta.url)),
    compatibilityDate: '2026-03-02',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: 'test-comments' },
  });
  db = await runtime.getD1Database('DB');
  const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  for (const statement of schema.replace(/^--.*$/gm, '').split(';').map((sql) => sql.trim()).filter(Boolean)) {
    await db.prepare(statement).run();
  }
  await db.prepare('UPDATE config SET value = ?').bind(JSON.stringify({
    ...siteConfig,
    ADMIN_PASS: md5(adminToken),
  })).run();
});

after(async () => { await runtime?.dispose(); });

test('serves public settings and rejects unauthorized management', async () => {
  const config = await call({ event: 'GET_CONFIG' });
  assert.equal(config.config.REQUIRED_FIELDS, 'nick');
  assert.equal(config.config.SHOW_IMAGE, 'false');
  assert.equal(config.config.ADMIN_PASS, undefined);
  const guest = await call({ event: 'GET_CONFIG_FOR_ADMIN' });
  assert.equal(guest.config, undefined);
  const admin = await call({ event: 'GET_CONFIG_FOR_ADMIN' }, adminToken);
  assert.equal(admin.config.SITE_NAME, 'galaxyrio');
});

test('stores comments in D1, isolates articles, and sanitizes submitted HTML', async () => {
  const submitted = await call({
    event: 'COMMENT_SUBMIT',
    url: '/blog/test-article/',
    href: `${origin}/zh/blog/test-article/`,
    nick: 'Test visitor',
    mail: 'private@example.test',
    link: '',
    ua: 'Mozilla/5.0',
    comment: '<p>Hello from the test.</p><script>alert(1)</script><img src=x onerror="alert(2)">',
  });
  assert.ok(submitted.id, JSON.stringify(submitted));
  const saved = await db.prepare('SELECT * FROM comment WHERE _id = ?').bind(submitted.id).first();
  assert.equal(saved.url, '/blog/test-article/');
  assert.doesNotMatch(saved.comment, /<script|onerror=/i);
  const comments = await call({ event: 'COMMENT_GET', url: '/blog/test-article/' });
  assert.equal(comments.count, 1);
  assert.doesNotMatch(JSON.stringify(comments), /private@example\.test|203\.0\.113\.10/);
  const otherArticle = await call({ event: 'COMMENT_GET', url: '/blog/other-article/' });
  assert.equal(otherArticle.count, 0);
  const reply = await call({
    event: 'COMMENT_SUBMIT', url: '/blog/test-article/', href: `${origin}/en/blog/test-article/`,
    nick: 'Another visitor', mail: '', link: '', ua: 'Mozilla/5.0',
    comment: '<p>A reply.</p>', pid: submitted.id, rid: submitted.id,
  }, 'another-visitor');
  assert.ok(reply.id, JSON.stringify(reply));
});

test('keeps simultaneous administrator and visitor requests separate', async () => {
  await Promise.all(Array.from({ length: 12 }, async (_, index) => {
    const [admin, guest] = await Promise.all([
      call({ event: 'GET_CONFIG_FOR_ADMIN' }, adminToken),
      call({ event: 'GET_CONFIG_FOR_ADMIN' }, `guest-${index}`),
    ]);
    assert.ok(admin.config);
    assert.equal(guest.config, undefined);
  }));
});

test('blocks unapproved origins and image uploads', async () => {
  const rejected = await runtime.dispatchFetch('https://comments.galaxyrio.top/', {
    headers: { Origin: 'https://unrelated.example' },
  });
  assert.equal(rejected.status, 403);
  const upload = await call({ event: 'UPLOAD_IMAGE', photo: 'data:image/png;base64,AAAA' });
  assert.notEqual(upload.code, 0);
  const reinitialize = await call({ event: 'SET_PASSWORD', password: 'replacement' });
  assert.notEqual(reinitialize.code, 0);
});
