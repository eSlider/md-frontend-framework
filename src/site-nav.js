import yaml from "yaml";

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
  if (typeof raw === "object" && raw !== null) {
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
 * @param {string} [fallback] — when tree has no paths, e.g. "content/docs/index.md"
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
 * @param {HTMLElement} el
 * @param {NavItem[]} items
 * @param {string} currentPath
 * @param {(p: string) => void} onNavigate
 */
export function renderNavTree(el, items, currentPath, onNavigate) {
  el.textContent = "";
  const nav = document.createElement("nav");
  nav.className = "yamd-nav";
  nav.setAttribute("aria-label", "Site");
  const ul = document.createElement("ul");
  ul.className = "yamd-nav__list yamd-nav__list--root";
  const cNorm = norm(currentPath);
  for (const n of items) {
    const li = renderNavItem(n, cNorm, onNavigate);
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
 */
function renderNavItem(n, cNorm, onNavigate) {
  const li = document.createElement("li");
  li.className = "yamd-nav__item";
  if (n.path) {
    const a = document.createElement("a");
    a.className = "yamd-nav__link" + (n.items && n.items.length ? " yamd-nav__link--branch" : "");
    a.textContent = n.title;
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
    t.className = "yamd-nav__label";
    t.textContent = n.title;
    li.appendChild(t);
  }
  if (n.items && n.items.length) {
    const sub = document.createElement("ul");
    sub.className = "yamd-nav__sub";
    for (const c of n.items) {
      const ch = renderNavItem(c, cNorm, onNavigate);
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
