---
title: "Features and authoring model"
description: "What yamd does, what it refuses to do, and the contract you can rely on."
---

# Features and authoring model

[← Back to Start](#start)

The headline is short: **you write Markdown, you list it in YAML, the browser renders it.** Everything below is the small print that makes that promise true.

## The four zeros

| Promise | What it actually means |
| --- | --- |
| **Zero backend** | The shipped site is static files. No app server, no API, no database in the delivery path. Any static host works. |
| **Zero build** | No bundler. No `npm run build`. The browser runs ES modules through an `importmap`. `npm run dev` is a tiny static server, nothing else. |
| **Zero author code** | To ship a page you write **Markdown**, **YAML** frontmatter, and edit **`pages.yml`**. The engine in `src/*.js` is shared and prewritten. |
| **Zero migration** | If you delete yamd tomorrow, your `content/` is still readable Markdown. Your investment survives the tool. |

These are design intent, not marketing absolutes. The repo contains JavaScript. Untrusted Markdown is not safe by default. We are explicit about that in [Security model](#docs/security).

## The authoring contract

You touch three things, in this order of frequency:

1. **Markdown body** under `content/` — your prose, tables, code, diagrams.
2. **YAML frontmatter** at the top of each `.md` — `title`, `description`, optional metadata.
3. **`pages.yml`** at the project root — the navigation tree and `default_path`.

That is the whole authoring surface. There is no fourth thing. If you find yourself reaching for a fourth thing, stop and check [Architecture](#docs/architecture) — you may be solving a problem the engine already solves.

## Declarative-first, by default

The source of truth is **data**, not code:

- UI blocks are declared in fenced YAML.
- The site tree is declared in `pages.yml`.
- Forms describe `type`, `items`, `action`, `method` — the runtime maps that to the DOM.

**Why it matters:** declarative content is greppable, diffable, reviewable, and survives the next framework cycle. Imperative authoring does not.

## The sidebar filter

When `pages.yml` defines a non-empty nav, a filter field appears at the top of the sidebar.

- **It narrows the same tree.** No second list of results to scan.
- **Index builds on focus.** Nothing downloaded until you actually use it.
- **Multi-word queries are AND-ed.** Every word must match.
- **Page content is highlighted too.** Matches are wrapped in `.filter-value`.
- **First match is auto-focused.** No manual scroll to locate context.
- **Press `/` to focus, `Esc` to clear, `Alt+N` for next match.** Keyboard-first, always.

The index covers nav titles, frontmatter `title`, and the plain-text body of each page. Code blocks are stripped from the body before indexing.

## What yamd is not

- It is not a CMS. There is no editor, no roles, no approval flow.
- It is not an SSR framework. SEO-critical marketing pages should use one.
- It is not a plugin platform. Extensions are forks, not loadable modules.

We pick this trade on purpose. **Boring is the feature.**

## Related

- [Philosophy and constraints](#docs/philosophy) — why we drew the lines here
- [Architecture](#docs/architecture) — how the contract is wired in code
- [Security model](#docs/security) — the rules before you publish untrusted input
