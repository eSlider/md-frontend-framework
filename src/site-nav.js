import yaml from "https://esm.sh/yaml@2.8.0?bundle";

/**
 * @typedef {{ title: string, path?: string, items?: import("./site-nav.js").NavItem[] }} NavItem
 */

/**
 * @param {string} text
 * @returns {{ defaultPath: string | null, items: NavItem[] }}
 */
export function parsePagesYmlText(text) {
  const raw = yaml.parse(text);
  return normalizePagesRoot(raw);
}

function normalizePagesRoot(/** @type {unknown} */ raw) {
  if (raw == null) {
    return { defaultPath: null, items: [] };
  }
  if (Array.isArray(raw)) {
    return { defaultPath: null, items: raw.map(sanitizeItem).filter(Boolean) };
  }
  if (typeof raw === "object") {
    const o = /** @type {Record<string, unknown>} */ (raw);
    const d =
      typeof o.default_path === "string" ? o.default_path :
      typeof o.defaultPath === "string" ? o.defaultPath : null;
    const list = o.nav ?? o.items ?? o.pages;
    if (Array.isArray(list)) {
      return { defaultPath: d, items: list.map(sanitizeItem).filter(Boolean) };
    }
  }
  return { defaultPath: null, items: [] };
}

function sanitizeItem(/** @type {Record<string, unknown> | null} */ x) {
  if (!x || typeof x !== "object") {
    return null;
  }
  const title = typeof x.title === "string" ? x.title : "Untitled";
  const p = x.path;
  const path = p == null || p === "" ? undefined : String(p);
  const it = x.items;
  const items = Array.isArray(it) ? it.map(sanitizeItem).filter(Boolean) : undefined;
  return { title, path, items: items && items.length ? items : undefined };
}

/**
 * @param {NavItem[]} items
 * @param {string | null} [ymlDefault]
 * @param {string} [fallback] — when a tree has no paths, e.g. "content/docs/index.md"
 */
export function pickInitialPath(items, ymlDefault, fallback) {
  if (ymlDefault && String(ymlDefault).trim()) {
    return String(ymlDefault).trim();
  }
  return firstPathInTree(items) || fallback || "content/docs/index.md";
}

/**
 * @param {NavItem[]} items
 * @param {string} p
 * @param {string} ymlDefault
 * @param {string} [fallback]
 * @returns {string}
 * If the tree has any paths and `p` is not in the set, return first in tree, else `p` or a safe default
 */
export function coalescePath(/** @type {NavItem[]} */ items, /** @type {string|undefined} */ p, ymlDefault, fallback) {
  const want = p && p.trim() ? p.trim() : pickInitialPath(items, ymlDefault, fallback);
  const known = collectPaths(items);
  if (known.size === 0) {
    return want;
  }
  return known.has(norm(want)) ? want : pickInitialPath(items, ymlDefault, fallback);
}

/**
 * @param {NavItem[]} items
 * @returns {Set<string>} normalized path keys
 */
function collectPaths(items) {
  const out = new Set();
  (function w(/** @type {NavItem[]} */ a) {
    for (const n of a) {
      if (n.path) {
        out.add(norm(n.path));
      }
      if (n.items) {
        w(n.items);
      }
    }
  })(items);
  return out;
}

/**
 * All pages that appear in `pages.yml` (with path), plus `default_path` if it is not already listed.
 * @param {NavItem[]} items
 * @param {string | null} defaultPath
 * @returns {{ path: string, label: string }[]}
 */
export function collectPageEntriesForSearch(/** @type {NavItem[]} */ items, /** @type {string | null} */ defaultPath) {
  /** @type {{ path: string, label: string }[]} */
  const out = [];
  const seen = new Set();
  (function w(/** @type {NavItem[]} */ a) {
    for (const n of a) {
      if (n.path) {
        const p = String(n.path).replace(/^\s+|\s+$/g, "");
        if (!p || p.includes("..") || p.includes("\\")) {
          if (n.items) {
            w(n.items);
          }
          continue;
        }
        const k = norm(p);
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ path: p, label: n.title || "Page" });
        }
      }
      if (n.items) {
        w(n.items);
      }
    }
  })(items);
  if (defaultPath && String(defaultPath).trim()) {
    const p = String(defaultPath).trim();
    if (!p.includes("..") && !/\\/.test(p)) {
      const k = norm(p);
      if (!seen.has(k)) {
        const base = p.split("/").pop() || p;
        const short = base.toLowerCase().endsWith(".md") ? base.slice(0, -3) : base;
        out.push({ path: p, label: short || "Page" });
      }
    }
  }
  return out;
}

export function firstPathInTree(/** @type {NavItem[]} */ items) {
  for (const n of items) {
    if (n.path) {
      return n.path;
    }
    if (n.items) {
      const s = firstPathInTree(n.items);
      if (s) {
        return s;
      }
    }
  }
  return undefined;
}

export function norm(/** @type {string} */ s) {
  return s.replace(/^\/+/, "").split("/").filter(Boolean).join("/");
}

/**
 * Hash is **path under `content/`** (no `content` segment in the bar):
 * `#cookbook` → fetches `content/cookbook.md` · `#docs/philosophy` → `content/docs/philosophy.md`.
 * Legacy `#content/...` still resolves; use {@link rewriteLegacyContentHash} once on load to normalize the address bar.
 * @param {string} [locHash] e.g. "#cookbook" (optional; default `location.hash`)
 */
export function getContentPathFromHash(locHash) {
  const h = (locHash == null && typeof location !== "undefined" ? location.hash : locHash) || "";
  if (!h || h === "#") {
    return undefined;
  }
  return hashToContentPath(h);
}

/**
 * @param {string} h — e.g. "#cookbook", "#docs/index", or legacy "#content/cookbook"
 * @returns {string|undefined} repo-relative `content/...md` or undefined
 */
function hashToContentPath(h) {
  const raw = String(h)
    .replace(/^#+/, "")
    .replace(/^\//, "")
    .trim();
  if (!raw || raw.includes("..") || /\\/.test(raw)) {
    return undefined;
  }
  const base = raw.toLowerCase().endsWith(".md") ? raw.slice(0, -3) : raw;
  const legacy = base.toLowerCase() === "content" || base.toLowerCase().startsWith("content/");
  const under = legacy ? (base.toLowerCase() === "content" ? "" : base.slice(8) /* "content/".length */) : base;
  if (legacy && under === "") {
    return undefined;
  }
  const withDir = (under && norm(under) ? "content/" + norm(under) : "").replace(/\/+$/, "");
  if (!withDir) {
    return undefined;
  }
  return withDir + ".md";
}

/**
 * @param {string} contentPath — e.g. `content/cookbook.md`
 * @returns {string} e.g. `#cookbook` (no `content/` in the bar)
 */
export function contentPathToHash(contentPath) {
  const s = String(contentPath)
    .replace(/\.md$/, "")
    .replace(/^\s+|\s+$/g, "");
  if (!s) {
    return "#";
  }
  const n = norm(s);
  if (!n.toLowerCase().startsWith("content/") && n !== "content") {
    return "#" + n;
  }
  const rest = n.toLowerCase() === "content" ? "" : n.slice(8);
  return rest ? "#" + rest : "#";
}

/**
 * Replaces `location` hash `#content/...` with `#...` (new canonical form). No-op if already new or no hash.
 */
export function rewriteLegacyContentHash() {
  if (typeof location === "undefined" || !location.hash || location.hash === "#") {
    return;
  }
  const raw = location.hash.replace(/^#+/, "").replace(/^\//, "");
  const rl = raw.toLowerCase();
  if (rl !== "content" && !rl.startsWith("content/")) {
    return;
  }
  const inner = rl === "content" ? "" : raw.slice(8);
  if (inner && (inner.includes("..") || /\\/.test(inner))) {
    return;
  }
  const p = new URLSearchParams(location.search);
  p.delete("path");
  const q = p.toString();
  const newHash = inner && norm(inner) ? "#" + norm(inner) : "#";
  if (newHash === location.hash) {
    return;
  }
  const base = location.pathname + (q ? "?" + q : "") + newHash;
  history.replaceState(null, "", base);
}

/**
 * `pathname` + `search` + deep hash (for `history.pushState` / `replaceState`).
 * @param {string} contentPath
 */
export function getHistoryUrlForContent(contentPath) {
  if (typeof location === "undefined") {
    return contentPathToHash(contentPath);
  }
  return location.pathname + searchWithoutLegacyPath() + contentPathToHash(contentPath);
}

/** Preserves non-`path` query params; drops legacy `?path=`. */
function searchWithoutLegacyPath() {
  if (typeof location === "undefined") {
    return "";
  }
  const p = new URLSearchParams(location.search);
  p.delete("path");
  const s = p.toString();
  return s ? "?" + s : "";
}

/**
 * @param {string} text
 * @param {string[]} terms — lowercased, non-empty
 * @returns {[number, number][] | null} merged [start, end) byte pairs in `text` (code unit indices)
 */
function mergeMatchRanges(/** @type {string} */ text, /** @type {string[]} */ terms) {
  if (!terms.length) {
    return null;
  }
  const low = text.toLowerCase();
  /** @type {[number, number][]} */
  const ranges = [];
  for (const term of terms) {
    if (!term) {
      continue;
    }
    let i = 0;
    while (i < low.length) {
      const j = low.indexOf(term, i);
      if (j < 0) {
        break;
      }
      ranges.push([j, j + term.length]);
      i = j + 1;
    }
  }
  if (ranges.length === 0) {
    return null;
  }
  ranges.sort((a, b) => a[0] - b[0]);
  /** @type {[number, number][]} */
  const merged = [];
  let cur = ranges[0];
  for (let k = 1; k < ranges.length; k++) {
    const r = ranges[k];
    if (r[0] < cur[1]) {
      cur[1] = Math.max(cur[1], r[1]);
    } else {
      merged.push(cur);
      cur = r;
    }
  }
  merged.push(cur);
  return merged;
}

/**
 * Replaces `el` content with `text`, wrapping each character range that matches a search term in `<mark>`.
 * @param {HTMLElement} el
 * @param {string} text
 * @param {string[]} highlightTerms — lowercased, non-empty
 * @param {number|undefined} matchCount — if set, appends " (N)" for total query matches in that page
 */
function setNavTitleWithHighlights(/** @type {HTMLElement} */ el, /** @type {string} */ text, /** @type {string[]} */ highlightTerms, /** @type {number|undefined} */ matchCount) {
  el.textContent = "";
  if (!highlightTerms.length) {
    el.appendChild(document.createTextNode(text));
  } else {
    const merged = mergeMatchRanges(text, highlightTerms);
    if (!merged || merged.length === 0) {
      el.appendChild(document.createTextNode(text));
    } else {
      let pos = 0;
      for (const [a, b] of merged) {
        if (pos < a) {
          el.appendChild(document.createTextNode(text.slice(pos, a)));
        }
        const mark = document.createElement("mark");
        mark.appendChild(document.createTextNode(text.slice(a, b)));
        el.appendChild(mark);
        pos = b;
      }
      if (pos < text.length) {
        el.appendChild(document.createTextNode(text.slice(pos)));
      }
    }
  }
  if (typeof matchCount === "number") {
    el.appendChild(document.createTextNode(" ("));
    const c = document.createElement("span");
    c.className = "count";
    c.textContent = String(matchCount);
    el.appendChild(c);
    el.appendChild(document.createTextNode(")"));
  }
}

/**
 * @param {Set<string> | null | undefined} pathFilter
 *   When set, only show items whose `path` is in the set, or a branch that
 *   contains a matching path under it (so section headers stay as ancestors).
 *   `null`/`undefined` = show the full tree.
 * @param {string} cNorm
 * @param {(p: string) => void} onNavigate
 */
function hasNavMatch(/** @type {NavItem} */ n, /** @type {Set<string>} */ pathFilter) {
  if (n.path && pathFilter.has(norm(n.path))) {
    return true;
  }
  if (n.items) {
    for (const c of n.items) {
      if (hasNavMatch(c, pathFilter)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param {HTMLElement} el
 * @param {NavItem[]} items
 * @param {string} currentPath
 * @param {(p: string) => void} onNavigate
 * @param {Set<string> | null} [pathFilter] — if set, filter nav to matching paths
 * @param {string} [highlightQuery] — if non-empty, mark matching substrings in nav labels (case-insensitive, all words)
 * @param {Map<string, number> | null} [pathMatchCounts] — normalized path → per-page match count for filter suffix " (N)"
 */
export function renderNavTree(
  el,
  items,
  currentPath,
  onNavigate,
  pathFilter,
  highlightQuery,
  pathMatchCounts
) {
  el.textContent = "";
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Site");
  const ul = document.createElement("ul");
  const cNorm = norm(currentPath);
  const hq = (highlightQuery && String(highlightQuery).trim()) || "";
  const hTerms = hq
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0);
  const pmc = pathMatchCounts && pathMatchCounts.size ? pathMatchCounts : null;
  for (const n of items) {
    const li = renderNavItem(n, cNorm, onNavigate, pathFilter, hTerms, pmc);
    if (li) {
      ul.appendChild(li);
    }
  }
  nav.appendChild(ul);
  el.appendChild(nav);
}

/**
 * @param {NavItem} n
 * @param {string} cNorm
 * @param {(p: string) => void} onNavigate
 * @param {Set<string> | null} pathFilter
 * @param {string[]} highlightTerms — lowercased search tokens for <mark> in titles
 * @param {Map<string, number> | null} pathMatchCounts
 */
function renderNavItem(/** @type {NavItem} */ n, cNorm, onNavigate, pathFilter, highlightTerms, pathMatchCounts) {
  if (pathFilter != null && !hasNavMatch(n, pathFilter)) {
    return null;
  }
  const li = document.createElement("li");
  const mCount = n.path && pathMatchCounts ? pathMatchCounts.get(norm(n.path)) : undefined;
  if (n.path) {
    const a = document.createElement("a");
    if (n.items && n.items.length) {
      a.className = "branch";
    }
    setNavTitleWithHighlights(a, n.title, highlightTerms, mCount);
    a.href = pathToHref(n.path);
    a.dataset.path = n.path;
    if (cNorm && norm(n.path) === cNorm) {
      a.setAttribute("aria-current", "page");
    }
    a.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      e.preventDefault();
      onNavigate(/** @type {string} */ (n.path));
    });
    li.appendChild(a);
  } else {
    const t = document.createElement("span");
    t.className = "label";
    setNavTitleWithHighlights(t, n.title, highlightTerms, undefined);
    li.appendChild(t);
  }
  if (n.items && n.items.length) {
    const sub = document.createElement("ul");
    for (const c of n.items) {
      const ch = renderNavItem(c, cNorm, onNavigate, pathFilter, highlightTerms, pathMatchCounts);
      if (ch) {
        sub.appendChild(ch);
      }
    }
    if (sub.childElementCount) {
      li.appendChild(sub);
    }
  }
  return li;
}

function pathToHref(contentPath) {
  return contentPathToHash(contentPath);
}

/**
 * `contentPath` is relative to the app root (directory with index.html and pages.yml). No `..` or `//`. No leading `/` (treated as stripped).
 * `importMetaUrl` is a module under `src/`; site base is one `..` (works on GitHub Pages and local dev without `/absolute-from-domain-root` URLs).
 */
export function contentUrl(/** @type {string} */ contentPath, /** @type {string} */ importMetaUrl) {
  const raw = String(contentPath)
    .replace(/^\s+|\s+$/g, "")
    .replace(/^\//, "")
    .replace(/^\.\//, "");
  if (!raw || raw.includes("..") || /\\/.test(raw)) {
    throw new Error("content path must be a relative file path, no '..' (got: " + String(contentPath) + ")");
  }
  const siteBase = new URL("..", importMetaUrl);
  return new URL(raw, siteBase);
}
