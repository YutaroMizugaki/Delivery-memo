# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **static, no-build PWA** (`配達メモ` / delivery-memo). There is no bundler or framework — plain HTML, CSS, and ES-module JS served as static files. Property data is seeded from `js/seed.js` and persisted in the browser's `localStorage` (no backend/database).

### Run the app (dev server)
Serve the repo root over HTTP (ES modules require HTTP, not `file://`):

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/ . `index.html` is the entry point (`delivery-memo.html` just redirects to it).

### Tests
The only automated test is a Puppeteer smoke test that drives the running dev server and fails only on uncaught page JS errors:

```bash
node scripts/test-improvements.mjs   # requires the dev server on :8080
```

- `scripts/gen-icons.mjs` regenerates the PNG app icons and is not part of routine testing.
- Both scripts use `puppeteer-core` and launch headless Chrome at `/usr/local/bin/google-chrome` with `--no-sandbox` (already present in the VM). `puppeteer-core` is installed by the startup update script (it is intentionally not saved to `package.json`, which is committed with no dependencies).

### Lint / build
There is no linter and no build step. Deployment is handled by GitHub Actions (`.github/workflows/deploy-pages.yml`) which just copies static files to GitHub Pages.

### Notes
- State lives in `localStorage`; use the in-app "初期データに戻す" (reset) button or clear site data to get back to the 19 seeded properties.
- The service worker (`sw.js`) uses network-first caching; when iterating locally you may need to hard-reload to avoid stale cached assets.
