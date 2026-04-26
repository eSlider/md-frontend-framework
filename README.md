# yamd

**Yet another markdown** — *YAML + Markdown* — a **humanized documentation engine** with **zero backend** for every project with `.md` files. Drop in `index.html` + `src/`, add your `content/`, list pages in `pages.yml`, and ship on any static host (this repo includes **GitHub Pages** via Actions).

[License: MIT](https://github.com/eSlider/yamd/blob/main/LICENSE)
[Pages](https://eSlider.github.io/yamd/)
[ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guides/Modules)
[no build](package.json)
[zero backend](https://github.com/eSlider/yamd#features)
[declarative](https://github.com/eSlider/yamd#features)

**[Repository](https://github.com/eSlider/yamd)** ·
**[Live site (GitHub Pages)](https://eSlider.github.io/yamd/)** ·
**[Manual in the app](https://eSlider.github.io/yamd/#docs/index)**

The browser compiles each document (frontmatter + GFM + optional fenced  ````ui` forms) to a small view model and renders the DOM. **Styling** stays in host CSS; authors don’t ship a build or a second framework to document and extend a project.

**What to read in-repo:** philosophy, architecture, and routing live in `[content/docs/](https://github.com/eSlider/yamd/tree/main/content/docs)` and appear in the left **yamd** section of the nav (from `[pages.yml](pages.yml)`).

> **Repository “About” (copy-paste):** *yamd — yet another markdown: YAML + Markdown, humanized docs, zero backend. GFM, frontmatter, fenced `ui` blocks, compile → render, vanilla ESM, static deploy.*

## Features (short)


| Label                  | Meaning here                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Zero backend**       | Shipped site is static files; no app server in the path.                                                      |
| **Zero build**         | No bundler/CI compile for the app; the engine loads ESM (e.g. `marked` / `yaml` from a CDN) and uses `fetch`. |
| **Zero [author] code** | Authors use Markdown, YAML, and `pages.yml` — not per-page app UI code.                                       |
| **Declarative-first**  | Fences and the nav tree are data; the small engine in `src/*.js` maps to the DOM.                             |


**What this is *not*:** a claim the repo has no JavaScript (the engine is JS) or that untrusted markdown is safe by default—see [Security note](#security-note). Details: [Philosophy](https://eSlider.github.io/yamd/#docs/philosophy) · [Features (full)](https://eSlider.github.io/yamd/#docs/features).

## Get the code

```bash
git clone https://github.com/eSlider/yamd.git
cd yamd
```

No `npm install` is required to **run the site in a browser** (the engine loads `[marked](https://github.com/markedjs/marked)` and `[yaml](https://github.com/eemeli/yaml)` from a CDN; see `src/document.js`).

## Run locally

`file://` is **not** enough: the app uses ES modules, `import()`, and `fetch` for `content/*` and `pages.yml`, so you need a real **HTTP** root that serves the repo folder.

From the project root (where `index.html` is), any of these is enough. Replace `8080` with any free port where the command takes a port, then open the matching URL (e.g. `**http://127.0.0.1:8080/`**). `**npm run dev`** in this repo uses port **3456** by default (see [dev-server.js](dev-server.js) and the console line it prints). **Deno**’s `file-server` often defaults to **8000** unless you pass a flag.


| Tool                                                                                                        | One command (static file server)                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **This repo (Node)**                                                                                        | `npm run dev` — `http://127.0.0.1:3456/` (see [dev-server.js](dev-server.js))                                                                                                                                                                                                                                                                                                                                                |
| **Node (npx, no `package.json` needed)**                                                                    | `npx --yes serve@latest -l 8080` · or: `npx --yes http-server@latest -p 8080 -c-1`                                                                                                                                                                                                                                                                                                                                           |
| **Python 3**                                                                                                | `python3 -m http.server 8080`                                                                                                                                                                                                                                                                                                                                                                                                |
| **Ruby**                                                                                                    | `ruby -run -ehttpd . -p 8080`                                                                                                                                                                                                                                                                                                                                                                                                |
| **PHP** (built-in [dev server](https://www.php.net/manual/en/features.commandline.webserver.php), PHP 5.4+) | `php -S 127.0.0.1:8080 -t .` — `**-t .`** is the **document root** (use the yamd project folder). Same: `cd /path/to/yamd && php -S 127.0.0.1:8080 -t .`                                                                                                                                                                                                                                                                     |
| **PHP (Docker)** (no local `php` binary)                                                                    | `docker run --rm -p 8080:8080 -v "$PWD":/app -w /app php:8.3-cli php -S 0.0.0.0:8080 -t /app` — then open `http://127.0.0.1:8080/`                                                                                                                                                                                                                                                                                           |
| **Caddy** (if [installed](https://caddyserver.com/docs/install))                                            | `caddy file-server --root . --listen :8080`                                                                                                                                                                                                                                                                                                                                                                                  |
| **Deno** (if [installed](https://deno.com))                                                                 | `deno run --allow-net --allow-read jsr:@std/http/file-server` — default port is often **8000** (see [std/http](https://docs.deno.com/runtime/reference/std/http/))                                                                                                                                                                                                                                                           |
| **Bun** (if [installed](https://bun.sh))                                                                    | `bunx --bun serve@latest -p 8080`                                                                                                                                                                                                                                                                                                                                                                                            |
| **nginx (Docker, no local nginx config)**                                                                   | `docker run --rm -p 8080:80 -v "$PWD":/usr/share/nginx/html:ro nginx:alpine` — then open `http://127.0.0.1:8080/` (host path as published root; fine for dev)                                                                                                                                                                                                                                                                |
| **BusyBox** (Alpine, some embeds)                                                                           | `busybox httpd -f -p 8080 -h .`                                                                                                                                                                                                                                                                                                                                                                                              |
| **Go**                                                                                                      | The standard library has no single built-in *command*; use the Python, Ruby, **PHP**, Node, Caddy, or Docker row above, or a tiny `net/http` `FileServer` program. Alternatively install a static binary (e.g. [miniserve](https://github.com/svenstaro/miniserve), [darkhttpd](https://github.com/ryanmjacobs/darkhttpd), [static-web-server](https://github.com/static-web-server/static-web-server)) and point it at `.`. |


*Security:* these are **local dev** examples; do not expose them to the public internet without hardening, authentication, and TLS.

## Site map and deploy

- **Nav + default page:** `pages.yml` (next to `index.html`); default route: **yamd** manual home. **Deep links:** the hash is the path **under** `content/` (no `content` segment), e.g. `[#examples/cookbook](https://eSlider.github.io/yamd/#examples/cookbook)` → `content/examples/cookbook.md` (older `#content/...` forms still work and are rewritten in the address bar). In-app: [Site map & routing](https://eSlider.github.io/yamd/#docs/site-map).
- **GitHub Pages** uses `[.github/workflows/deploy-gh-pages.yml](.github/workflows/deploy-gh-pages.yml)`: push to `main` → upload static `index.html`, `src/`, `content/`, `pages.yml`. **Settings** → **Pages** → **Source: GitHub Actions** so this workflow runs (not a competing “branch” deploy). After renaming the repository, the project URL is `**https://<user>.github.io/<repo>/`** (e.g. `**[https://eSlider.github.io/yamd/](https://eSlider.github.io/yamd/)`**).

**First visit after a deploy** can briefly show 404; refresh. Custom domain: [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Security note

`marked` output is set with `innerHTML`. For **untrusted** markdown, sanitize (e.g. DOMPurify) before insert. This repo is a **prototype**; it does not ship that hardening.

## License

[MIT](LICENSE)

## Topics (for GitHub search)

`yamd`, `markdown`, `yaml`, `es-modules`, `static-site`, `github-pages`, `github-actions`, `form`, `documentation`, `no-build`, `declarative`, `fr`