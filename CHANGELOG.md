# Changelog

All notable changes to this project are documented in this file.  
This project is pre-1.0; breaking changes are possible between releases.

## [0.1.4-alpha.2] — 2026-04-30

Pre-release **alpha** focused on filter UX polish in navigation and rendered content.

### Highlights

- **In-article highlight:** Active filter value is now highlighted in rendered HTML blocks (including headings) via `.filter-value`
- **First-hit focus + next-hit shortcut:** First content match auto-scrolls into view, and **`Alt+N`** jumps to the next highlighted match
- **Smoother focus behavior:** Focusing the filter with an existing value no longer flashes the full nav tree while the index loads
- **Docs refresh:** README and in-app manual pages updated for the new filter behavior and keyboard flow

[0.1.4-alpha.2]: https://github.com/eSlider/yamd/releases/tag/v0.1.4-alpha.2

## [0.1.4-alpha.1] — 2026-04-26

Pre-release **alpha** after 0.1.3, focused on **nav filter / search** and **container** publishing.

### Highlights

- **Nav filter:** Focus the field to index listed `pages.yml` pages; the tree **filters in place** (no separate result list) with **`<mark>`** on matching label text and per-page **match counts** `Title (N)` plus status `N pages · M matches`
- **GHCR image:** [Publish Docker image](.github/workflows/docker-publish.yml) → `ghcr.io/eslider/yamd` (Bun static server; mount `content/` and `pages.yml` as documented in README and Get started)
- **Security / docs:** In-app Security page under `content/docs/`; Get started covers local servers, deploy, and filter behavior
- **Chore:** README, architecture notes for `nav-search.js` and `site-nav.js`

[0.1.4-alpha.1]: https://github.com/eSlider/yamd/releases/tag/v0.1.4-alpha.1

## [0.1.0-alpha.1] — 2026-04-26

First public **alpha** of **yamd** (YAML + Markdown, zero build for the app shell, static deploy).

### Highlights

- **Routing:** deep links with hash for paths under `content/`; optional `pages.yml` nav
- **Authoring:** GFM, YAML frontmatter, fenced ````ui` forms; `compile` → `render` in the browser
- **Markdown links:** `*.md` `href`s resolved from the current page and rewritten to in-app deep links; content-root vs same-directory resolution for multi-segment vs single-filename links
- **UI:** menubar, mobile drawer, lazy Mermaid and Prism; host-driven styling in `app.css`
- **Examples:** `content/examples/*` and cookbook-style pages; GitHub Pages deploy via Actions

[0.1.0-alpha.1]: https://github.com/eSlider/yamd/releases/tag/v0.1.0-alpha.1
