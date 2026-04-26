# Research

[← yamd manual](docs/index.md) · [Philosophy](docs/philosophy.md) / [Patterns](patterns.md)

The pipeline is a **string in, DOM out** contract: `compile` then `render`, with theming in host CSS. That keeps content delivery (static files, API, CMS) separate from the view.

Compare with heavy MDX or framework bundles: here the browser loads **ES modules** and `marked` / `yaml` from a CDN, with no build step in the repo for the app shell.
