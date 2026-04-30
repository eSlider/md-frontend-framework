---
title: "Architecture"
description: "compile → parts → render; modules in src/."
---

# Architecture

[← yamd manual](#docs/index)

## Data flow

```mermaid
flowchart BT
  A["Content delivery\n(string)"] --> B["compile(raw)\n(document.js)"]
  B --> C["{ meta, parts }"]
  C --> D["render(root, doc)\n(render-article.js)"]
  D --> E[DOM]
  C --> F["ui blocks\n(render-ui.js)"]
  F --> E
```

- **`parts`:** either Markdown as HTML (`{ type: 'md', html }`) or a **UI model** (`{ type: 'ui', data }`) from fenced ` ```ui` / yaml fences.
- **Theming** lives in **host CSS** (e.g. `src/app.css`), not author inline `style` in YAML.

## Main modules (under `src/`)

| File                  | Role                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `document.js`         | Frontmatter, fence split, `marked` for body, `compile` output                                                         |
| `render-article.js`   | Puts `parts` into the article: sections + `render-ui.js` for UI                                                       |
| `render-ui.js`        | Declarative YAML form → DOM (inputs, `type: form`, nested `items`)                                                    |
| `render-mermaid.js`   | Lazy Mermaid renderer for ` ```mermaid` fences (loaded only if such blocks exist)                                     |
| `render-prism.js`     | Lazy Prism syntax highlighter for other code fences                                                                   |
| `render-enrich.js`    | Orchestrates lazy renderers (Mermaid first, then Prism)                                                               |
| `site-nav.js`         | `pages.yml`, hash ↔ path, left nav, `collectPageEntriesForSearch`; used from `main.js`                                |
| `nav-search.js`       | Filter field + index on **focus**; passes a `Set` of matching paths to `renderNavTree` to hide non-matching nav items |
| `mobile-nav.js`       | Mobile drawer behavior: hamburger toggle, scrim, body scroll lock                                                     |
| `md-rewrite-links.js` | Rewrites repo-relative `*.md` links in HTML to the app’s deep-link hash                                               |
| `main.js`             | Fetch `pages.yml` + markdown, routing, nav + search + mobile drawer                                                   |

Source: repo [`src/`](https://github.com/eSlider/yamd/tree/main/src) (not served as a directory index on the static site).

**Related:** [Site map & routing](#docs/site-map) · [Get started](#docs/get-started) · [Specs](#specs)
