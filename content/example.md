---
title: "Minimal demo: frontmatter + Markdown + UI"
description: " Served as static text; parsed in the browser."
---

# Hello

This page is **`content/example.md`** — also linked as **Demo** in the site nav (`pages.yml`). The **first markdown heading** is the on-page title; the tab title comes from frontmatter `title` above.

This file is `content/example.md`. The block below is a **fenced** ` ```ui ` **segment**; the consumer turns it into native form controls. Styling is **only** in the host app (`app.css` / your theme) — the YAML can use `class` and `variant` for hooks, not inline styles.

> Try editing `content/example.md` and refresh.

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
      title: I agree to the terms
      value: "yes"
      mandatory: true
    - type: submit
      label: Send
      name: go
```

## Object example

```ui
type: form
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
      de: German
      en: English
  - type: checkbox
    name: accept
    title: I agree to the terms
    value: "yes"
    mandatory: true
  - type: submit
    label: Send
    name: go
```

After the form, normal **Markdown** continues. Code for reference:

```js
import { compile } from "./document.js";
```
