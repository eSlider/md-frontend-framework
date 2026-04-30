# yamd

**Markdown in. Static site out. Zero backend. Zero build step.**

Most doc tools want you to learn them. **yamd** wants you to forget it exists.

A folder of `.md` files. One `pages.yml`. That is the whole stack. If you delete yamd tomorrow, your `content/` is still readable Markdown — your investment survives the tool.

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

- **You stay in content, not a framework.** Pages are GitHub-Flavored Markdown. The shell loads once; you refresh when files change.
- **Ships like any static site.** Drop the folder on GitHub Pages, Netlify, S3, or your own host. The engine in `src/*.js` runs in the reader’s browser. No server-side render.
- **The manual is the product.** Philosophy, features, routing, local run, deploy, and security all live in [`content/`](content/) and link from the left nav. Start at [`content/start.md`](content/start.md).
- **Sidebar filter that respects you.** With a `pages.yml` nav, the filter narrows the same tree as you type — no second list of results, no surprise downloads. Matches are highlighted in nav and page content, first match is auto-focused, and you can jump to the next one with `Alt+N`. The text index loads only when you focus the field. Press `/` to focus, `Esc` to clear.

## Try it in a minute

You need a **local HTTP server** (ES modules and `fetch` do not work from `file://` the way yamd needs).

```bash
git clone https://github.com/eSlider/yamd.git
cd yamd
npm run dev
```

Open `http://127.0.0.1:3456/` (or the port printed in the terminal). Edit files under `content/`, save, and refresh. 
Change the sidebar with [`content/pages.yml`](content/pages.yml). After the first **focus** on the filter field, you can type to filter the tree and see highlights in both nav labels and page content. The first hit scrolls into view, and **`Alt+N`** jumps to the next highlighted occurrence. Press **`/`** to focus the field (when not typing in another input).

**More options** (other tools, ports, and GitHub Pages): [Get started](https://eSlider.github.io/yamd/#docs/get-started) in the in-app manual. Or jump straight to the [Start here](https://eSlider.github.io/yamd/#start) page for the full reading map.

### Run from the published container (GHCR)

The image is **built on GitHub** and stored in the **GitHub Container Registry** for this repository — not Docker Hub. After each push to `main`, the workflow [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) builds and pushes it.

| What                      | Value                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Registry**              | `ghcr.io` ([About GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)) |
| **Image (upstream repo)** | `ghcr.io/eslider/yamd:latest` — [package page](https://github.com/eSlider/yamd/pkgs/container/yamd)                                       |
| **Forks**                 | `ghcr.io/<your-github-username>/yamd:latest` (same path pattern; your fork must run the publish workflow)                                 |

**Quick start** (from a clone of this repo, with your local `content/` mounted):

```bash
docker pull ghcr.io/eslider/yamd:latest
docker run --rm \
  -p 8080:3456 \
  -v "$PWD/content:/app/content" \
  ghcr.io/eslider/yamd:latest
```

Open **http://127.0.0.1:8080/** (host `8080` → container `3456`). If `content/pages.yml` is missing and there is more than one `.md` file under `content/`, the container generates `content/pages.yml` before serving. No `docker pull` is required if the image is already local.

**Details** (Bun, optional mounts, `PORT`, private packages): in-app [Get started — Docker (GHCR / Bun)](https://eSlider.github.io/yamd/#docs/get-started) (section of the same name).

## Where everything lives

| In the repo                | Role                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`content/`](content/)     | Your Markdown and the bundled manual                                                                                                                                      |
| [`pages.yml`](pages.yml)   | Nav tree and default landing page                                                                                                                                         |
| [`src/`](src/)             | ESM engine: `document.js` / `render*`, `site-nav.js` (nav + path ↔ hash), `nav-search.js` (filter index on focus), `filter-highlight.js` (in-article match highlight)     |
| [`index.html`](index.html) | App shell, `importmap` for [marked](https://github.com/markedjs/marked) and [yaml](https://github.com/eemeli/yaml) from a CDN (no `npm install` required for the browser) |

> **For GitHub’s “About” field:** _yamd — yet another markdown: YAML + Markdown, humanized docs, zero backend. GFM, frontmatter, fenced `ui` blocks, compile → render, vanilla ESM, static deploy._

## Author

**Andriy Oblivantsev** — software engineer, building tools that survive their own framework.

- GitHub: [@eSlider](https://github.com/eSlider)
- Email: [eslider@gmail.com](mailto:eslider@gmail.com)
- Origin of the project: a personal frustration with doc tools that age faster than the docs themselves. yamd is the answer — a folder of `.md` you can still open in ten years, with or without this engine.

If yamd helps you, the most useful thing you can do is **star the [repository](https://github.com/eSlider/yamd)** and tell one person who suffers under heavier doc stacks. That is the only growth loop the project has, and it works.

### Credits

**yamd** uses [Inter](https://rsms.me/inter/) (Rasmus Andersson) and [Iosevka](https://github.com/be5invis/Iosevka) (Belleve Invis).

## License

[MIT](LICENSE)
