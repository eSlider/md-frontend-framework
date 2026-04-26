# Changelog

All notable changes to this project are documented in this file.  
This project is pre-1.0; breaking changes are possible between releases.

## [0.1.0-alpha.1] — 2026-04-26

First public **alpha** of **yamd** (YAML + Markdown, zero build for the app shell, static deploy).

### Highlights

- **Routing:** deep links with hash for paths under `content/`; optional `pages.yml` nav
- **Authoring:** GFM, YAML frontmatter, fenced ````ui` forms; `compile` → `render` in the browser
- **Markdown links:** `*.md` `href`s resolved from the current page and rewritten to in-app deep links; content-root vs same-directory resolution for multi-segment vs single-filename links
- **UI:** menubar, mobile drawer, lazy Mermaid and Prism; host-driven styling in `app.css`
- **Examples:** `content/examples/*` and cookbook-style pages; GitHub Pages deploy via Actions

[0.1.0-alpha.1]: https://github.com/eSlider/yamd/releases/tag/v0.1.0-alpha.1
