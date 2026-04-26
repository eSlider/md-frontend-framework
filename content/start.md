---
title: "Get started (redirect)"
description: "Use the yamd section of the nav for the up-to-date guide."
---

# Get started

The maintained guide is **[Get started (yamd)](#docs/get-started)** in the **yamd** section of the nav.

See also: [yamd manual](#docs/index) · [Site map & routing](#docs/site-map)

## Minimal `index.html` (shell)

The app is a static shell: one `index.html` that loads **`./src/main.js`** as `type="module"`. The engine fetches `pages.yml` and your Markdown under `content/`.

Example structure (simplified; match your local paths):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>yamd</title>
    <link rel="stylesheet" href="./src/app.css" />
  </head>
  <body>
    <div class="yamd-shell">
      <aside id="yamd-nav-wrap" class="yamd-shell__nav" hidden aria-label="Table of contents"></aside>
      <div id="yamd-content" class="yamd-app yamd-shell__main" role="main">
        <p class="yamd-loading">Loading…</p>
      </div>
    </div>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
```

Fenced ` ```html` blocks in this page are only **documentation**; you still need the real `index.html` in the project root to run the app.

## Lazy Mermaid and Prism (pure JS, no build)

After Markdown is turned into HTML, the runtime can **optionally** enhance fences — **only if** matching blocks exist (lazy `import` from a CDN; nothing runs on pages with plain prose only).

| Fences | What runs | Loaded when |
|--------|------------|-------------|
| ` ```mermaid` | Mermaid → SVG (diagrams) | a `pre > code.language-mermaid` is present |
| ` ```html`, ` ```js`, ` ```yaml`, … | [Prism](https://prismjs.com/) (syntax highlight) | a `pre > code.language-*` is present (except `mermaid` — handled first) |

Order: **Mermaid** runs first, then **Prism**, so ` ```mermaid` never goes through the highlighter. The implementation lives in `src/mermaid-lazy.js`, `src/prism-lazy.js`, and `src/lazy-enrichers.js` (all plain ES modules, no bundler required).

**JavaScript** example the highlighter can colour:

```javascript
// Entry is ./src/main.js
import { compile } from "./document.js";
// fetch pages.yml + content/*.md, then compile → render
```

**YAML** in a fence for illustration:

```yaml
default_path: content/docs/index.md
```
