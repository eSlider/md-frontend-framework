import yaml from "https://esm.sh/yaml@2.8.0?bundle";
import { parse } from "https://esm.sh/marked@16.0.0";
import { rewriteRelativeMarkdownLinksInHtml } from "./md-rewrite-links.js";

const FENCE = /^```(\w*)\r?\n([\s\S]*?)\r?\n```/gm;
const MD = { gfm: true, breaks: false, async: false };

// part: { type:'md', html } | { type:'ui', data: { fields, formAttrs? } }.
// UI: root may be a form object { type:form, action, method, items:[...] } or legacy form/children.
// Fields may nest items recursively; normalizeField copies the tree.
/**
 * @param {string} raw
 * @param {{ sourcePath?: string }} [options] — `sourcePath` is app-relative, e.g. `content/docs/index.md`, for `*.md` link rewriting
 */
export async function compile(raw, options) {
  const { sourcePath } = options && typeof options === "object" ? options : {};
  const t = raw.replace(/^\uFEFF/, "");
  const { frontmatter, body } = splitFrontmatter(t);
  const meta = frontmatter == null ? {} : (yaml.parse(frontmatter) ?? {});

  const segs = segmentBody(body);
  const parts = [];
  for (const s of segs) {
    if (s.type === "ui") {
      parts.push(s);
      continue;
    }
    let html = String(parse(s.md, MD));
    if (sourcePath) {
      html = rewriteRelativeMarkdownLinksInHtml(html, String(sourcePath));
    }
    parts.push({ type: "md", html });
  }
  return { meta, parts };
}

function splitFrontmatter(text) {
  if (!text.startsWith("---")) {
    return { frontmatter: null, body: text };
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: null, body: text };
  }
  const n = text.indexOf("\n", 0);
  const fm = text.slice(n + 1, end).replace(/\r\n/g, "\n");
  let b = text.slice(end + 4);
  b = b.startsWith("\r\n") ? b.slice(2) : b.startsWith("\n") ? b.slice(1) : b;
  return { frontmatter: fm, body: b.replace(/\r\n/g, "\n") };
}

function segmentBody(body) {
  const out = [];
  let i = 0;
  FENCE.lastIndex = 0;
  let m;
  while ((m = FENCE.exec(body)) !== null) {
    const before = body.slice(i, m.index);
    if (before) {
      out.push({ type: "md", md: before });
    }
    const lang = (m[1] || "").toLowerCase();
    if (lang === "ui" || lang === "yaml" || lang === "yml") {
      out.push({ type: "ui", data: normalizeUiModel(yaml.parse(m[2].replace(/\r\n/g, "\n"))) });
    } else {
      out.push({ type: "md", md: m[0] });
    }
    i = m.index + m[0].length;
  }
  if (i < body.length) {
    const r = body.slice(i);
    if (r) {
      out.push({ type: "md", md: r });
    }
  }
  return out;
}

function normalizeUiModel(root) {
  if (Array.isArray(root)) {
    if (root.length === 1 && isFormNode(root[0])) {
      return extractForm(root[0]);
    }
    return { fields: root.map(normalizeField) };
  }
  if (root && typeof root === "object") {
    if (isFormNode(root)) {
      return extractForm(/** @type {Record<string, unknown>} */ (root));
    }
    const list = arrayish(root, ["items", "form", "children"]);
    if (list) {
      return { fields: list.map(normalizeField), formAttrs: root };
    }
  }
  return { fields: [] };
}

function isFormNode(o) {
  return o && typeof o === "object" && o.type === "form";
}

function arrayish(node, keys) {
  for (const k of keys) {
    const a = node[k];
    if (Array.isArray(a)) {
      return a;
    }
  }
  return null;
}

function extractForm(node) {
  const list = arrayish(node, ["items", "form", "children"]);
  const fields = list ? list.map(normalizeField) : [];
  const n = node;
  return {
    fields,
    formAttrs: {
      type: "form",
      action: n.action,
      method: n.method,
      class: n.class,
      name: n.name,
      id: n.id,
      enctype: n.enctype,
      target: n.target,
      novalidate: n.novalidate,
      autocomplete: n.autocomplete,
    },
  };
}

function normalizeField(f) {
  if (!f || typeof f !== "object") {
    return f;
  }
  const o = { ...f };
  if (o.type === "form") {
    const raw = o.items ?? o.form ?? o.children;
    const list = Array.isArray(raw) ? raw : [];
    o.items = list.map(normalizeField);
  } else {
    if (Array.isArray(o.items)) {
      o.items = o.items.map(normalizeField);
    }
    if (Array.isArray(o.children)) {
      o.children = o.children.map(normalizeField);
    }
  }
  return o;
}
