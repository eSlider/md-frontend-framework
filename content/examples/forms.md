---
title: "Forms"
description: "Fenced ```ui forms: YAML → DOM, host CSS only."
---

# Forms

[← yamd manual](#docs/index) · [Form patterns](#examples/patterns) · [Live demo](#example)

Fenced ` ```ui` blocks describe **one form** (or a list of field roots). The runtime turns them into native controls; use **`class` / `variant`** for hooks—**no** author inline `style` in YAML (theme lives in `src/app.css`).

## Simple GET form

```ui
- type: form
  action: "#"
  method: "get"
  items:
    - type: input
      name: name
      title: Name
      placeholder: Your name
      mandatory: true
    - type: textArea
      name: message
      title: Message
      placeholder: A short message
    - type: select
      name: lang
      title: Language
      value: en
      options:
        en: English
        de: German
    - type: checkbox
      name: accept
      title: I agree
      value: "yes"
    - type: submit
      label: Send
      name: go
```

## Object form (single root)

Same as above, with a **single** YAML object and `items:` (see [Cookbook](#examples/cookbook)):

```ui
type: form
action: "#"
method: "get"
items:
  - type: input
    name: q
    title: Search
    placeholder: term
  - type: button
    label: Go
    name: search
```

**Read next:** [Form patterns](#examples/patterns) (field `type` table) · [Architecture](#docs/architecture)
