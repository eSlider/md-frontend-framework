---
title: "yamd — home"
description: "Yet another markdown: humanized in-app manual (content/ + pages.yml)."
---

# yamd documentation

**yamd** (*yet another markdown* — YAML + Markdown) is a **zero-backend documentation engine** for your `.md` files. This in-app **manual** is just Markdown in [`content/`](https://github.com/eSlider/yamd/tree/main/content) and the [nav tree in `pages.yml`](https://github.com/eSlider/yamd/blob/main/pages.yml); **the app is the documentation.**

## Read next

| Topic | What you get |
|-------|----------------|
| [Philosophy](#docs/philosophy) | Why a **string → compile → render** contract, and what we avoid |
| [Features](#docs/features) | **Zero backend**, **zero build**, **declarative-first**, **zero [author] code** (explained precisely) |
| [Architecture](#docs/architecture) | `compile` / `render` flow, module roles |
| [Site map & routing](#docs/site-map) | `pages.yml`, deep links (e.g. `#examples/cookbook`), `default_path` |
| [Get started](#docs/get-started) | Local run, static servers, **Docker (GHCR)**, deploy, first edits |
| [Security](#docs/security) | Trust, `innerHTML`, untrusted markdown |

## Examples (outside this section)

- [Live demo (forms)](#example) — ` ```ui` blocks in one file
- [Forms](#examples/forms) · [Cookbook](#examples/cookbook) · [Form patterns](#examples/patterns) · [Research](#examples/research)
- [Specs](#specs) · [Idea (contract)](#idea)

The [repository README](https://github.com/eSlider/yamd#readme) is the short on-ramp: **what yamd is**, **clone and run in one minute**, and links into this manual. Deeper how-it-works and ops detail live **here** so you can link between pages like a normal static manual.
