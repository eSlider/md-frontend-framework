---
title: "Features"
description: "Zero backend, zero build, declarative-first, author vs engine."
---

# Features

[← yamd manual](#docs/index)

These labels describe **design intent**, not marketing absolutes.

| Label | Meaning in this project |
|-------|-------------------------|
| **Zero backend** | The **published** site is **static files** only. No app server, API, or database in the delivery path. The browser loads `index.html`, `src/`, `content/`, `pages.yml` from any static host. |
| **Zero build** | **No** bundler, no `npm run build` for the app. The browser runs **ES modules** with an **`importmap`**. `npm run dev` is a tiny static server, not a compile pipeline. |
| **Zero [author] code** | **You** (author) do not add application code to ship a page: only **Markdown**, **YAML** (frontmatter + ` ```ui` blocks), and **`pages.yml`**. The **engine** in `src/*.js` is shared and prewritten. |
| **Declarative-first** | The **source of truth** is **data**: UI in fenced blocks; the **site tree** in `pages.yml`; forms use `type`, `items`, `action` / `method`—**declare** what you need, the runtime maps to the DOM. |
| **Filter (nav)** | With a nav from `pages.yml`, a **filter** field at the top of the sidebar **narrows the same nav tree** (no separate result list). The text index is built when the field is **focused** (refetched on each focus); matching uses **nav titles**, **frontmatter `title`**, and **body** text. Multi-word queries require **all** words to match. Press **`/`** to focus the field when not typing elsewhere. |

**Not claimed:** that the repo contains *no* JavaScript (it does), or that **untrusted** markdown is safe without a sanitizer—see [Security](#docs/security).

**Related:** [Philosophy](#docs/philosophy) · [Architecture](#docs/architecture)
