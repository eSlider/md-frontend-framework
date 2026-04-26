import yaml from "yaml";

const Q = "path";

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
 * @param {string} [fallback] — when tree has no paths, e.g. "content/example.md"
 */
export function pickInitialPath(items, ymlDefault, fallback) {
  if (ymlDefault && String(ymlDefault).trim()) {
    return String(ymlDefault).trim();
  }
  return firstPathInTree(items) || fallback || "content/example.md";
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
 * @param {string} [search] — e.g. window.location.search
 */
export function getPathFromQuery(search) {
  const q = search == null ? (typeof location !== "undefined" ? location.search : "") : search;
  if (!q || q === "?" || q === "") {
    return undefined;
  }
  return new URLSearchParams(q[0] === "?" ? q : "?" + q).get(Q) || undefined;
}

/**
 * @param {string} contentPath
 */
export function setPathInCurrentUrl(contentPath) {
  if (typeof location === "undefined") {
    return "?path=" + encodeURIComponent(contentPath);
  }
  const u = new URL(location.href);
  u.searchParams.set(Q, contentPath);
  u.hash = "";
  return u.pathname + u.search;
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
  nav.className = "mdui-nav";
  nav.setAttribute("aria-label", "Site");
  const ul = document.createElement("ul");
  ul.className = "mdui-nav__list mdui-nav__list--root";
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
  li.className = "mdui-nav__item";
  if (n.path) {
    const a = document.createElement("a");
    a.className = "mdui-nav__link" + (n.items && n.items.length ? " mdui-nav__link--branch" : "");
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
    t.className = "mdui-nav__label";
    t.textContent = n.title;
    li.appendChild(t);
  }
  if (n.items && n.items.length) {
    const sub = document.createElement("ul");
    sub.className = "mdui-nav__sub";
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
  if (typeof location === "undefined") {
    return "?path=" + encodeURIComponent(contentPath);
  }
  const u = new URL(location.href);
  u.searchParams.set(Q, contentPath);
  u.hash = "";
  return u.pathname + u.search;
}

/**
 * Resolve a repo-root-relative markdown path to a module-relative URL
 * (main is under `src/`; project root is one `..` up).
 * @param {string} contentPath
 * @param {string} importMetaUrl
 */
export function contentUrl(/** @type {string} */ contentPath, /** @type {string} */ importMetaUrl) {
  const root = new URL("..", importMetaUrl);
  return new URL(contentPath.replace(/^\//, ""), root);
}
