# Galaxyrio's Personal Website

A static personal website built with Astro 7 and styled with Material 3 Expressive.

## Local Development

```powershell
npm.cmd install
npm.cmd run dev
```

Keep the terminal running, then open `http://localhost:4321/`. Press `Ctrl+C` to stop the server.

## Validation and Build

```powershell
npm.cmd run check
npm.cmd test
```

Production files are written to `dist/`. The test command reruns type checking and the static build, then verifies the Chinese and English pages, profile data, content model, and design system.

## Blog Comments

Every published blog article includes Twikoo at the bottom. Chinese and English
views of the same article share a language-neutral comment path. The client is
served from the site's own build and loads when the reader approaches the comments.

The comment API is `https://comments.galaxyrio.top`. Override it locally with
`PUBLIC_TWIKOO_ENV_ID` in `.env` (see `.env.example`). This is a public API address;
never put administrator passwords or Cloudflare tokens in `PUBLIC_*` variables.

The separate Cloudflare Workers and D1 backend lives in `services/comments`.
It is adapted from [twikoo-cloudflare](https://github.com/twikoojs/twikoo-cloudflare/tree/64c0048671e1a483d6a056968f08f08407b5bf8a),
with the upstream MIT license retained in `services/comments/LICENSE`.
The Astro website continues to deploy to GitHub Pages through the existing workflow.
