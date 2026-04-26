---
title: "Get started"
description: "Clone, dev server, edit content and tree."
---

# Get started

[← yamd manual](#docs/index)

1. **Clone and run a static server** (ES modules and `fetch` will not work from `file://` the way you need):
   ```bash
   git clone https://github.com/eSlider/yamd.git
   cd yamd
   npm run dev
   ```
2. **Open** `http://127.0.0.1:3456/` (or the port in the log). The default view is set by `default_path` in `pages.yml` (here: [yamd manual](#docs/index)) unless the URL has a hash.
3. **Change content** under [`content/`](https://github.com/eSlider/yamd/tree/main/content); refresh. Deep links: `#docs/philosophy`, `#example`, `#examples/cookbook`, etc. (no `.md` in the bar).
4. **Change the nav** by editing [`pages.yml`](https://github.com/eSlider/yamd/blob/main/pages.yml) (paths are app-root-relative, e.g. `content/docs/index.md`).

`importmap` in `index.html` loads [marked](https://github.com/markedjs/marked) and [yaml](https://github.com/eemeli/yaml) from a CDN; no `npm install` of those is required for the **browser** path.

**Read next:** [Site map & routing](#docs/site-map) · [Live demo](#example) · [Architecture](#docs/architecture)
