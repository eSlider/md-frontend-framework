# yamd

**Yet another markdown** — a small, **in-browser** documentation site for projects that already speak **Markdown** and **YAML**. You write and organize pages under `content/`, list them in `pages.yml`, and host the result as static files. No app server required for readers.

<p>
  <a href="https://github.com/eSlider/yamd/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://eSlider.github.io/yamd/"><img src="https://img.shields.io/badge/site-GitHub%20Pages-222?logo=github" alt="Live site" /></a>
  <a href="https://eSlider.github.io/yamd/#docs/index"><img src="https://img.shields.io/badge/manual-in%20app-6366f1" alt="Manual in the app" /></a>
  <a href="https://github.com/eSlider/yamd/pkgs/container/yamd"><img src="https://img.shields.io/badge/GHCR-ghcr.io%2Feslider%2Fyamd-1f6feb?logo=github" alt="Container image on GitHub" /></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guides/Modules"><img src="https://img.shields.io/badge/ES%20modules-browser-f7df1e?logo=javascript&logoColor=000" alt="ES modules" /></a>
</p>

[Repository](https://github.com/eSlider/yamd) ·
[Live site](https://eSlider.github.io/yamd/) ·
[Manual in the app](https://eSlider.github.io/yamd/#docs/index)

## Why this exists

- **You stay in content**, not a framework. Pages are **GitHub-Flavored Markdown** (plus optional frontmatter and fenced ` ```ui` blocks for forms). The shell loads once; you refresh when files change.
- **Ships like any static site** — drop the folder on GitHub Pages, Netlify, S3, or your own host. The engine in `src/*.js` runs in the reader’s browser; there is no server-side render step for the app.
- **The manual lives beside your docs** — philosophy, features, how routing works, local run, deploy, and security expectations are all in [`content/docs/`](content/docs/) and linked from the left nav. Start at [`content/docs/index.md`](content/docs/index.md).

## Try it in a minute

You need a **local HTTP server** (ES modules and `fetch` do not work from `file://` the way yamd needs).

```bash
git clone https://github.com/eSlider/yamd.git
cd yamd
npm run dev
```

Open `http://127.0.0.1:3456/` (or the port printed in the terminal). Edit files under `content/`, save, and refresh. Change the sidebar by editing [`pages.yml`](pages.yml).

**More options** (other tools, ports, and GitHub Pages): [Get started](https://eSlider.github.io/yamd/#docs/get-started) in the in-app manual.

### Run from the published container (GHCR)

The image is **built on GitHub** and stored in the **GitHub Container Registry** for this repository — not Docker Hub. After each push to `main`, the workflow [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) builds and pushes it.

| What | Value |
|------|--------|
| **Registry** | `ghcr.io` ([About GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)) |
| **Image (upstream repo)** | `ghcr.io/eslider/yamd:latest` — [package page](https://github.com/eSlider/yamd/pkgs/container/yamd) |
| **Forks** | `ghcr.io/<your-github-username>/yamd:latest` (same path pattern; your fork must run the publish workflow) |

**Quick start** (from a clone of this repo, so `content/` and `pages.yml` exist):

```bash
docker pull ghcr.io/eslider/yamd:latest
docker run --rm \
  -p 8080:3456 \
  -v "$PWD/content:/app/content" \
  -v "$PWD/pages.yml:/app/pages.yml" \
  ghcr.io/eslider/yamd:latest
```

Open **http://127.0.0.1:8080/** (host `8080` → container `3456`). No `docker pull` is required if the image is already local.

**Details** (Bun, optional mounts, `PORT`, private packages): in-app [Get started — Docker (GHCR / Bun)](https://eSlider.github.io/yamd/#docs/get-started) (section of the same name).

## Where everything lives

| In the repo | Role |
|-------------|------|
| [`content/`](content/) | Your Markdown and the bundled manual |
| [`pages.yml`](pages.yml) | Nav tree and default landing page |
| [`src/`](src/) | Small ESM “engine”: compile → render |
| [`index.html`](index.html) | App shell, `importmap` for [marked](https://github.com/markedjs/marked) and [yaml](https://github.com/eemeli/yaml) from a CDN (no `npm install` required for the browser) |

> **For GitHub’s “About” field:** *yamd — yet another markdown: YAML + Markdown, humanized docs, zero backend. GFM, frontmatter, fenced `ui` blocks, compile → render, vanilla ESM, static deploy.*

## License

[MIT](LICENSE)

## Topics (for GitHub search)

`yamd`, `markdown`, `yaml`, `es-modules`, `static-site`, `github-pages`, `github-actions`, `form`, `documentation`, `no-build`, `declarative`, `documentation-generator`
