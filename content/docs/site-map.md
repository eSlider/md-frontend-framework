---
title: "Site map & routing"
description: "pages.yml, #... deep links, default_path."
---

# Site map & routing

[← yamd manual](#docs/index)

## `pages.yml` (next to `index.html`)

- Describes the **left nav** (titles, optional `path` to a `.md` under `content/`, nested `items`).
- The app **fetches** `../pages.yml` (relative to the app root). If the fetch fails or the list is empty, the sidebar hides and the app can still open a file via hash.

**Root shapes** the parser accepts: a **top-level array**, or an object with **`nav` / `items` / `pages`** and optional `default_path` (see [site-nav.js `parsePagesYmlText`](https://github.com/eSlider/yamd/blob/main/src/site-nav.js)).

## Deep links: path under `content/` (no `content` in the bar, no `.md`)

| In the address bar | Loaded file (relative to app root) |
|--------------------|------------------------------------|
| `#docs/philosophy` | `content/docs/philosophy.md` |
| `#example` | `content/example.md` |
| `#examples/cookbook` | `content/examples/cookbook.md` |

- Internal Markdown links: `[text](#examples/cookbook)` (same as the nav; hash-only, works on [GitHub Pages under a subpath](https://eSlider.github.io/yamd/) without domain-root `/?…`).
- **Legacy** `?path=content%2F…` is **one-off** rewritten to the hash (see `main.js`).

## `default_path`

In `pages.yml`, `default_path` is the file used when the URL has **no hash** (or unknown hash, then the tree is consulted). This site’s default is [yamd manual](#docs/index) (`content/docs/index.md` on disk).

**Related:** [Get started](#docs/get-started) · [yamd manual](#docs/index)
