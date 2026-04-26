---
title: "Cookbook"
description: "Small patterns for pages.yml and forms."
---

# Cookbook

[← yamd manual](#docs/index) · [Site map](#docs/site-map) · [Forms](#examples/forms) · [Live demo](#example)

- **Navigation** — tree lives in `pages.yml`; paths are relative to the app base (e.g. `content/examples/cookbook.md` → hash `#examples/cookbook`).
- **Default page** — set `default_path: content/docs/index.md` (or your landing file) in `pages.yml`.
- **Forms** — use `type: form` with `action` / `method` and nested `items` (see [Forms](#examples/forms) and the full [Live demo](#example)).

## Nested group

```ui
- type: form
  title: Group
  items:
    - type: input
      name: x
      title: Field
```
