---
title: "Cookbook"
description: "Small patterns for pages.yml and forms."
---

# Cookbook

- **Navigation** — tree lives in `pages.yml`; paths are relative to the app base (`content/...`).
- **Default page** — set `default_path: content/example.md` or put the file you want first in the nav.
- **Forms** — use `type: form` with `action` / `method` and nested `items` (see [example](?path=content%2Fexample.md)).

## Nested group

```ui
- type: form
  title: Group
  items:
    - type: input
      name: x
      title: Field
```
