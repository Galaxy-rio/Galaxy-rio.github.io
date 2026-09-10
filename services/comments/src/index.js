import { createTwikooHandler } from './twikoo.js';

const allowedOrigins = new Set([
  'https://www.galaxyrio.top',
  'https://galaxyrio.top',
  'https://galaxy-rio.github.io',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin',
    };
    if (origin && !allowedOrigins.has(origin)) {
      return Response.json({ message: 'Origin not allowed.' }, { status: 403, headers });
    }
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      headers['Access-Control-Max-Age'] = '600';
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!['GET', 'POST'].includes(request.method)) {
      return Response.json({ message: 'Method not allowed.' }, { status: 405, headers });
    }
    try {
      if (request.method === 'POST') {
        const body = await request.clone().text();
        if (new TextEncoder().encode(body).length > 131072) {
          return Response.json({ message: 'Request too large.' }, { status: 413, headers });
        }
        let event;
        try { event = JSON.parse(body); } catch {
          return Response.json({ message: 'Invalid JSON.' }, { status: 400, headers });
        }
        if (!event || typeof event !== 'object' || Array.isArray(event)) {
          return Response.json({ message: 'Invalid request.' }, { status: 400, headers });
        }
        // This deployment uses only Workers and D1; no image hosting is enabled.
        if (event.event === 'UPLOAD_IMAGE') {
          return Response.json({ code: 1000, message: '图片上传未启用 / Image uploads are disabled.' }, { headers });
        }
        if (event.event === 'COMMENT_SUBMIT' && (
          typeof event.nick !== 'string' || !event.nick.trim() || event.nick.length > 80 ||
          typeof event.comment !== 'string' || event.comment.length > 10000 ||
          typeof event.url !== 'string' || !event.url.startsWith('/blog/') || event.url.length > 1500 ||
          typeof event.href !== 'string' || event.href.length > 2000
        )) {
          return Response.json({ code: 1000, message: '请检查昵称和评论内容 / Check your name and comment.' }, { headers });
        }
      }
      const result = await createTwikooHandler({ qmsgQQ: env.QMSG_QQ }).fetch(request, env);
      const response = new Response(result.body, result);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      return response;
    } catch {
      return Response.json({ code: 1000, message: '评论服务暂时不可用 / Comments are temporarily unavailable.' }, { status: 503, headers });
    }
  },
};
