import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished portfolio shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>你的名字 — 设计与前端作品集<\/title>/i);
  assert.match(html, /把想法做成/);
  assert.match(html, /Lumen 个人工作台/);
  assert.match(html, /我喜欢站在设计与开发之间/);
  assert.match(html, /有一个值得认真做的小想法/);
  assert.match(html, /跳到主要内容/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|SkeletonPreview/);
});

test("removes starter-only code and keeps the design system explicit", async () => {
  const [page, layout, css, packageJson, previewFiles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(previewRoot),
  ]);

  assert.deepEqual(previewFiles, []);
  assert.match(page, /aria-label="主要导航"/);
  assert.match(page, /IntersectionObserver/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /portfolio-theme/);
  assert.match(layout, /prefers-color-scheme/);
  assert.match(css, /--md-sys-color-primary:/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
});
