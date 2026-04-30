---
title: "Get started"
description: "From clone to running site in five minutes."
---

# Get started

[← Back to Start](#start)

You will be looking at your own running site before this page finishes loading.

## The five-minute path

```bash
git clone https://github.com/eSlider/yamd.git
cd yamd
npm run dev
```

Open `http://127.0.0.1:3456/` in any browser. **Done.**

That is the whole setup. No `npm install` of UI libraries. No build step. The browser pulls [marked](https://github.com/markedjs/marked) and [yaml](https://github.com/eemeli/yaml) from a CDN through the `importmap` in `index.html`.

## What just happened

1. The browser loaded `index.html`, `src/app.css`, and the ES module entry `src/main.js`.
2. The app shell mounted: responsive menu header (`#menubar`), backdrop (`#backdrop`), theme toggle (`#theme-btn`), nav container (`#nav`), and content outlet (`#content`).
3. The engine fetched `pages.yml` and the page named in `default_path`, then compiled Markdown to HTML in `#content`.

There is nothing else. If something breaks, only those three steps can be wrong.

## Edit something. Confirm the loop works.

1. Open any file under `content/` and change a line.
2. Save.
3. Refresh the browser.

If your change shows up, your authoring loop is working. That loop is the whole product.

Internal links use a hash and the path under `content/` — no `content/` segment, no `.md` extension:

| In the address bar | Loaded file |
| --- | --- |
| `#docs/get-started` | `content/docs/get-started.md` |
| `#examples/cookbook` | `content/examples/cookbook.md` |
| `#example` | `content/example.md` |

## The sidebar filter (the one feature worth knowing on day one)

- Press **`/`** to focus the filter field.
- Type to narrow the nav tree in place.
- Matching text is highlighted inside rendered page content too.
- The first match scrolls into view automatically.
- Press **`Alt+N`** to jump to the next highlighted match.
- Press **`Esc`** to clear and restore.

The index loads only when you focus the field. You pay nothing until you use it.

## You do need a real HTTP server

Opening `index.html` from disk through `file://` will not work. The engine uses ES modules and `fetch`, which require an HTTP origin. Pick any of these:

| Tool | One-liner |
| --- | --- |
| **This repo (Node)** | `npm run dev` (serves on `:3456`) |
| **Node (npx)** | `npx --yes serve@latest -l 8080` |
| **Python 3** | `python3 -m http.server 8080` |
| **PHP 5.4+** | `php -S 127.0.0.1:8080 -t .` |
| **Caddy** | `caddy file-server --root . --listen :8080` |
| **Bun** | `bunx --bun serve@latest -p 8080` |
| **nginx (Docker)** | `docker run --rm -p 8080:80 -v "$PWD":/usr/share/nginx/html:ro nginx:alpine` |
| **BusyBox** | `busybox httpd -f -p 8080 -h .` |

These are local dev patterns. **Do not** expose an unhardened static server to the public internet.

## Run the published image (no clone required)

The image is published to the **GitHub Container Registry** (not Docker Hub) by [`docker-publish.yml`](https://github.com/eSlider/yamd/blob/main/.github/workflows/docker-publish.yml) on every push to `main`.

| What | Value |
| --- | --- |
| **Registry** | `ghcr.io` |
| **Upstream image** | `ghcr.io/eslider/yamd:latest` |
| **Your fork** | `ghcr.io/<your-username>/yamd:latest` (after your Actions run pushes once) |

Run it against your local `content/`:

```bash
docker run --rm \
  -p 8080:3456 \
  -v "$PWD/content:/app/content" \
  ghcr.io/eslider/yamd:latest
```

Open `http://127.0.0.1:8080/`. If `content/pages.yml` is missing and your `content/` has more than one `.md` file, the container auto-generates `content/pages.yml` before serving.

**Tuning:**

- `PORT` inside the container defaults to `3456`. With `-e PORT=3000`, map `-p 8080:3000`.
- `HOST=0.0.0.0` is set so the publish works; the log may still print a loopback URL for copy-paste.

## Deploy

The shipped site is static files: `index.html`, `src/`, `content/`, `pages.yml`. That means **any** static host: GitHub Pages, Netlify, Cloudflare Pages, S3, your own nginx.

For GitHub Pages specifically:

- Enable **Settings → Pages → Source: GitHub Actions** so [`deploy-gh-pages.yml`](https://github.com/eSlider/yamd/blob/main/.github/workflows/deploy-gh-pages.yml) is the one that publishes.
- Push to `main`. Your site URL is `https://<user>.github.io/<repo>/`.
- First visit after a deploy may briefly 404 — refresh once.
- Deep links use the hash, e.g. `#examples/cookbook` → `content/examples/cookbook.md`. Subpath hosting works without rewrites.

## Print output

Printed pages use a clean layout: nav and top controls are hidden, content expands to full width, and a footer is rendered on every page.

- Bottom-left: current date
- Bottom-center: current document title
- Bottom-right: page counter (`current / total`)

This is designed for PDF export and hardcopy readability without editing your Markdown.

## Where to go next

- **You want to write a page.** Open [Features and authoring model](#docs/features).
- **You want to understand routing.** Open [Information architecture](#docs/site-map).
- **You want to look under the hood.** Open [Architecture](#docs/architecture).
- **You are about to publish public content.** Open [Security model](#docs/security) first.
