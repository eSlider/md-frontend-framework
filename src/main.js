import { compile } from "./document.js";
import { render } from "./render.js";
import { runLazyEnrichers } from "./lazy-enrichers.js";
import { setupMobileNav } from "./mobile-nav.js";
import { setupNavSearch } from "./nav-search.js";
import {
  coalescePath,
  collectPageEntriesForSearch,
  contentPathToHash,
  contentUrl,
  getContentPathFromHash,
  getHistoryUrlForContent,
  norm,
  parsePagesYmlText,
  pickInitialPath,
  renderNavTree,
  rewriteLegacyContentHash,
} from "./site-nav.js";

const PAGES = new URL("../pages.yml", import.meta.url);

/** @type {HTMLElement | null} */
let el = null;
/** @type {HTMLElement | null} */
let navHost = null;

const FALLBACK_MD = "content/docs/index.md";

const nav = { defaultPath: null, items: [] };
let hasNav = false;
/** @type {ReturnType<typeof setupMobileNav>} */
let mobileNav = null;
/** @type {HTMLElement | null} */
let navTreeRoot = null;
/** @type {ReturnType<typeof setupNavSearch> | null} */
let navSearch = null;
/** @type {Set<string> | null} — when non-null, nav shows only these normalized paths and ancestor rows for matching branches */
let pathFilter = null;
/** @type {string} — current filter text for <mark> in nav labels; empty = no highlight */
let pathFilterQuery = "";

/**
 * @param {() => void} fn
 */
function whenDocumentReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

function initRoots() {
  el = document.getElementById("yamd-content");
  navHost = document.getElementById("yamd-nav-wrap");
  if (!el) {
    throw new Error("#yamd-content");
  }
}

function migrateLegacyPathQuery() {
  if (typeof location === "undefined") {
    return;
  }
  const ps = new URLSearchParams(window.location.search);
  const p = ps.get("path");
  if (!p) {
    return;
  }
  const decoded = norm(decodeURIComponent(p));
  const withMd = decoded.toLowerCase().endsWith(".md") ? decoded : decoded + ".md";
  ps.delete("path");
  const s = ps.toString();
  const base = location.pathname + (s ? "?" + s : "");
  history.replaceState(null, "", base + contentPathToHash(withMd));
}

async function loadTree() {
  try {
    const r = await fetch(PAGES, { cache: "no-store" });
    if (!r.ok) {
      return;
    }
    const t = parsePagesYmlText(await r.text());
    nav.defaultPath = t.defaultPath;
    nav.items = t.items;
    hasNav = t.items.length > 0;
  } catch {
  }
  if (navHost) {
    if (hasNav) {
      navHost.removeAttribute("hidden");
    } else {
      navHost.setAttribute("hidden", "");
    }
  }
  const menubar = document.getElementById("yamd-menubar");
  if (menubar) {
    if (hasNav) {
      menubar.removeAttribute("hidden");
    } else {
      menubar.setAttribute("hidden", "");
    }
  }
}

function currentLogicalPath() {
  const fromHash = getContentPathFromHash();
  if (hasNav) {
    return coalescePath(nav.items, fromHash, nav.defaultPath, FALLBACK_MD);
  }
  return (
    (fromHash && fromHash.trim() ? fromHash.trim() : pickInitialPath([], nav.defaultPath, FALLBACK_MD)) ||
    FALLBACK_MD
  );
}

function drawNav(/** @type {string} */ rel) {
  if (!hasNav || !navHost) {
    return;
  }
  if (!navSearch || !navTreeRoot) {
    const entries = collectPageEntriesForSearch(nav.items, nav.defaultPath);
    navSearch = setupNavSearch(
      {
        onFilterChange(/** @type {Set<string> | null} */ paths, /** @type {string} */ query) {
          pathFilter = paths;
          pathFilterQuery = query || "";
          drawNav(currentLogicalPath());
        },
      },
      import.meta.url,
      entries
    );
    navHost.appendChild(navSearch.root);
    navTreeRoot = document.createElement("div");
    navTreeRoot.className = "yamd-nav__tree";
    navHost.appendChild(navTreeRoot);
  }
  renderNavTree(
    navTreeRoot,
    nav.items,
    rel,
    (p) => {
      const u = getHistoryUrlForContent(p);
      history.pushState({ p: p }, "", u);
      void go(p);
    },
    pathFilter,
    pathFilterQuery
  );
}

/**
 * @param {string|undefined} explicitPath
 */
async function go(/** @type {string|undefined} */ explicitPath) {
  if (!el) {
    return;
  }
  if (mobileNav) {
    mobileNav.closeIfMobile();
  }
  const rel =
    explicitPath != null
      ? hasNav
        ? coalescePath(nav.items, explicitPath, nav.defaultPath, FALLBACK_MD)
        : (explicitPath.trim() || pickInitialPath([], nav.defaultPath, FALLBACK_MD))
      : currentLogicalPath();

  try {
    const u = contentUrl(rel, import.meta.url);
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Fetch " + rel + " → " + res.status);
    }
    const doc = await compile(await res.text(), { sourcePath: rel });
    el.replaceChildren();
    render(el, doc);
    await runLazyEnrichers(el);
  } catch (e) {
    const p = document.createElement("p");
    p.className = "yamd-error";
    p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
    el.replaceChildren(p);
  }
  drawNav(rel);
}

whenDocumentReady(() => {
  initRoots();
  mobileNav = setupMobileNav({
    menubtn: document.getElementById("yamd-menubtn"),
    backdrop: document.getElementById("yamd-nav-backdrop"),
  });

  window.addEventListener("popstate", () => {
    void go();
  });

  window.addEventListener("hashchange", () => {
    void go();
  });

  void (async () => {
    try {
      migrateLegacyPathQuery();
      rewriteLegacyContentHash();
      await loadTree();
      await go();
    } catch (e) {
      if (!el) {
        return;
      }
      const p = document.createElement("p");
      p.className = "yamd-error";
      p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
      el.replaceChildren(p);
    }
  })();
});
