import { contentPathToHash, norm } from "./site-nav.js";

/**
 * Rewrites `a[href]` for repo-relative `*.md` links to the app’s deep-link hash.
 *
 * - `docs/philosophy.md`, `examples/cookbook.md` (any path with `/` and no leading `./` or `../`) → **content-root** under `content/…`
 * - A single path segment, e.g. `patterns.md` (no `/`) → same directory as the current file
 * - `./x.md` and `../x.md` → file-relative to the current doc’s directory
 * - `content/…/x.md` and `/content/…/x.md` → explicit
 * - Same file + fragment → `#fragment` only; cross-file → `contentPathToHash` (fragment to another page is not represented in a single hash)
 * - `http:`, `mailto:`, `data:`, and plain in-app or in-page `#` links are left unchanged
 */

const ABS_RE = /^(https?:|\/\/|mailto:|tel:|data:)/i;

/**
 * @param {string} sourcePath app-relative, e.g. "content/docs/index.md"
 * @returns {string}
 */
function contentDir(/** @type {string} */ sourcePath) {
  const s = String(sourcePath).replace(/^\//, "");
  const i = s.lastIndexOf("/");
  if (i <= 0) {
    return "";
  }
  return s.slice(0, i + 1);
}

/**
 * Path under `content/…` from a relative `*.md` ref (same as directory as current file, or with `./` / `../`).
 * @param {string} rel e.g. "../index.md" or "patterns.md"
 * @param {string} sourcePath
 * @returns {string}
 */
function resolveRelativeToFile(/** @type {string} */ rel, /** @type {string} */ sourcePath) {
  const d = contentDir(sourcePath);
  const base = d ? "https://y.local/" + d : "https://y.local/content/";
  const u = new URL(rel, base.endsWith("/") ? base : base + "/");
  let p = u.pathname;
  if (p.startsWith("/")) {
    p = p.slice(1);
  }
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

/**
 * @param {string} filePart
 * @param {string} sourcePath
 * @param {string} [fragment]
 * @returns {string | null}
 */
function toAppHash(/** @type {string} */ filePart, /** @type {string} */ sourcePath, /** @type {string|undefined} */ fragment) {
  const raw = filePart.replace(/^\s+|\s+$/g, "");
  if (!/\.(md|markdown)$/i.test(raw)) {
    return null;
  }

  let relToContent;
  if (raw.toLowerCase().startsWith("content/") || raw.toLowerCase() === "content") {
    relToContent = norm(raw);
  } else if (raw.startsWith("/")) {
    const rest = norm(raw.replace(/^\/+/, ""));
    relToContent = rest.toLowerCase().startsWith("content/") ? rest : "content/" + rest;
  } else if (raw.startsWith("./") || raw.startsWith("../")) {
    relToContent = resolveRelativeToFile(raw, sourcePath);
  } else if (raw.includes("/")) {
    relToContent = norm("content/" + raw);
  } else {
    // Single segment, e.g. "patterns.md" from content/examples/research.md → same directory
    relToContent = resolveRelativeToFile(raw, sourcePath);
  }

  if (!relToContent) {
    return null;
  }
  if (!relToContent.toLowerCase().endsWith(".md")) {
    relToContent = relToContent + ".md";
  }
  if (!relToContent.toLowerCase().startsWith("content/")) {
    return null;
  }
  if (relToContent.toLowerCase() === "content") {
    return null;
  }

  const wantFull = relToContent;
  const hereFull = norm(String(sourcePath));
  if (fragment && wantFull === hereFull) {
    return "#" + fragment;
  }
  return contentPathToHash(wantFull);
}

/**
 * @param {string} href
 * @param {string} sourcePath
 * @returns {string | null} new href or null to keep
 */
function mapHref(/** @type {string} */ href, /** @type {string} */ sourcePath) {
  if (!sourcePath) {
    return null;
  }
  const t = (href || "").trim();
  if (!t) {
    return null;
  }
  if (ABS_RE.test(t)) {
    return null;
  }
  if (/^javascript:/i.test(t) || /^vbscript:/i.test(t)) {
    return null;
  }
  if (t.startsWith("#") && (t.length === 1 || !/\.(md|markdown)($|#|\/)/i.test(t))) {
    return null;
  }

  let pathPart;
  let frag;
  if (t.startsWith("#") && t.includes(".md", 1)) {
    const rest = t.slice(1);
    const f = rest.indexOf("#", 0);
    if (f < 0) {
      pathPart = rest;
      frag = "";
    } else {
      pathPart = rest.slice(0, f);
      frag = rest.slice(f + 1);
    }
  } else {
    const f = t.indexOf("#", t.startsWith("#") ? 1 : 0);
    if (f < 0) {
      pathPart = t;
      frag = "";
    } else {
      pathPart = t.slice(0, f);
      frag = t.slice(f + 1);
    }
  }

  if (!/\.(md|markdown)$/i.test(pathPart) || !pathPart) {
    return null;
  }
  return toAppHash(pathPart, sourcePath, frag || undefined);
}

/**
 * @param {string} html
 * @param {string} sourcePath
 * @returns {string}
 */
export function rewriteRelativeMarkdownLinksInHtml(/** @type {string} */ html, /** @type {string} */ sourcePath) {
  if (!sourcePath || !html) {
    return html;
  }
  if (typeof document === "undefined") {
    return html;
  }
  const node = document.createElement("div");
  node.innerHTML = html;
  for (const a of node.querySelectorAll("a[href]")) {
    const h = a.getAttribute("href");
    if (h == null) {
      continue;
    }
    const next = mapHref(h, sourcePath);
    if (next != null) {
      a.setAttribute("href", next);
    }
  }
  return node.innerHTML;
}
