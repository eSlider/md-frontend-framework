# Research

[← yamd manual](docs/index.md) · [Philosophy](docs/philosophy.md) / [Patterns](patterns.md)

The pipeline is a **string in, DOM out** contract: `compile` then `render`, with theming in host CSS. That keeps content delivery (static files, API, CMS) separate from the view.

Compare with heavy MDX or framework bundles: here the browser loads **ES modules** and `marked` / `yaml` from a CDN, with no build step in the repo for the app shell.

**Note:** The in-app **nav filter** (see [Get started](#docs/get-started)) loads the text index on **focus**, **hides non-matching items** in the same sidebar tree, highlights matching text in page content, and supports `Alt+N` to jump to the next occurrence.
