import { compile } from "./document.js";
import { applyFilterHighlight } from "./filter-highlight.js";
import { render } from "./render-article.js";
import { runLazyEnrichers } from "./render-enrich.js";
import { setupMobileNav } from "./mobile-nav.js";
import { setupNavSearch } from "./nav-search.js";
import { setupThemeSwitcher } from "./theme-switcher.js";
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

const PAGES_CANDIDATES = [new URL("../content/pages.yml", import.meta.url), new URL("../pages.yml", import.meta.url)];

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
/** @type {Map<string, number> | null} — per-page min term counts (normalized path → count) when filtering */
let pathFilterCounts = null;
let activeFilterMatchIndex = -1;

/**
 * @returns {{ contentPath: string | undefined, headingSlug: string | undefined }}
 */
function routeFromHash() {
  const hash = (typeof location !== "undefined" ? location.hash : "") || "";
  const raw = hash.replace(/^#+/, "").replace(/^\//, "").trim();
  if (!raw) {
    return { contentPath: undefined, headingSlug: undefined };
  }

  const normalized = raw.toLowerCase().endsWith(".md") ? raw.slice(0, -3) : raw;
  if (hasNav) {
    const known = new Set();
    const addKnown = (p) => {
      const h = contentPathToHash(p).replace(/^#/, "");
      if (h) {
        known.add(h);
      }
    };
    const walk = (items) => {
      for (const n of items) {
        if (n.path) {
          addKnown(n.path);
        }
        if (n.items) {
          walk(n.items);
        }
      }
    };
    walk(nav.items || []);
    if (nav.defaultPath) {
      addKnown(nav.defaultPath);
    }

    const segs = normalized.split("/").filter(Boolean);
    for (let i = segs.length; i >= 1; i--) {
      const prefix = segs.slice(0, i).join("/");
      if (!known.has(prefix)) {
        continue;
      }
      const contentPath = getContentPathFromHash("#" + prefix);
      if (!contentPath) {
        continue;
      }
      const headingSlug = segs.slice(i).join("/") || undefined;
      return { contentPath, headingSlug };
    }
  }

  return { contentPath: getContentPathFromHash("#" + normalized), headingSlug: undefined };
}

/**
 * @param {string} id
 */
function idSelector(id) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return "#" + CSS.escape(id);
  }
  return "#" + id.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

/**
 * @param {string | undefined} headingSlug
 */
function scrollToHeading(headingSlug) {
  if (!el || !headingSlug) {
    return;
  }
  const id = decodeURIComponent(headingSlug);
  const t = el.querySelector(idSelector(id));
  if (!t) {
    return;
  }
  t.scrollIntoView({ block: "start", behavior: "auto" });
}

/**
 * @param {Element | null} target
 */
function scrollToFilterMatch(target) {
  if (!target) {
    return;
  }
  target.scrollIntoView({ block: "center", behavior: "auto" });
}

/**
 * @returns {HTMLElement[]}
 */
function getFilterMatches() {
  if (!el) {
    return [];
  }
  return Array.from(el.querySelectorAll(".filter-value"));
}

/**
 * @param {HTMLElement | null} target
 */
function setActiveFilterMatch(target) {
  const matches = getFilterMatches();
  for (const m of matches) {
    m.classList.remove("is-active");
  }
  if (!target) {
    activeFilterMatchIndex = -1;
    return;
  }
  const idx = matches.indexOf(target);
  activeFilterMatchIndex = idx;
  target.classList.add("is-active");
}

function focusNextFilterMatch() {
  const matches = getFilterMatches();
  if (!matches.length) {
    return;
  }
  const next = (activeFilterMatchIndex + 1) % matches.length;
  const target = matches[next];
  setActiveFilterMatch(target);
  scrollToFilterMatch(target);
}

/**
 * @param {() => void} fn
 */
function whenDocumentReady(fn) {

  // Apply explicit theme from localStorage, otherwise fallback to OS/browser theme.
  (function () {
    try {
      var t = localStorage.getItem("yamd-theme");
      if (t !== "light" && t !== "dark") {
        t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      document.documentElement.setAttribute("data-theme", t);
    } catch (e) {}
  })();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

function initRoots() {
  el = document.getElementById("content");
  navHost = document.getElementById("nav");
  if (!el) {
    throw new Error("#content");
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
  for (const pagesUrl of PAGES_CANDIDATES) {
    try {
      const r = await fetch(pagesUrl, { cache: "no-store" });
      if (!r.ok) {
        continue;
      }
      const t = parsePagesYmlText(await r.text());
      nav.defaultPath = t.defaultPath;
      nav.items = t.items;
      hasNav = t.items.length > 0;
      break;
    } catch {
    }
  }
  if (navHost) {
    if (hasNav) {
      navHost.removeAttribute("hidden");
    } else {
      navHost.setAttribute("hidden", "");
    }
  }
  const menubar = document.getElementById("menubar");
  if (menubar) {
    if (hasNav) {
      menubar.removeAttribute("hidden");
    } else {
      menubar.setAttribute("hidden", "");
    }
  }
}

function currentLogicalPath() {
  const fromHash = routeFromHash().contentPath;
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
        onFilterChange(/** @type {Set<string> | null} */ paths, /** @type {string} */ query, /** @type {Map | null} */ pathCounts) {
          pathFilter = paths;
          pathFilterQuery = query || "";
          pathFilterCounts = pathCounts;
          drawNav(currentLogicalPath());
          const firstHit = applyFilterHighlight(el, pathFilterQuery);
          setActiveFilterMatch(firstHit);
          scrollToFilterMatch(firstHit);
        },
      },
      import.meta.url,
      entries
    );
    navHost.appendChild(navSearch.root);
    navTreeRoot = document.createElement("div");
    navTreeRoot.className = "tree";
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
    pathFilterQuery,
    pathFilterCounts
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
  const route = routeFromHash();
  const rel =
    explicitPath != null
      ? hasNav
        ? coalescePath(nav.items, explicitPath, nav.defaultPath, FALLBACK_MD)
        : (explicitPath.trim() || pickInitialPath([], nav.defaultPath, FALLBACK_MD))
      : (route.contentPath || currentLogicalPath());

  try {
    const u = contentUrl(rel, import.meta.url);
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Fetch " + rel + " → " + res.status);
    }
    const doc = await compile(await res.text(), { sourcePath: rel });
    el.replaceChildren();
    render(el, doc, { contentPath: rel });
    await runLazyEnrichers(el);
    const firstHit = applyFilterHighlight(el, pathFilterQuery);
    setActiveFilterMatch(firstHit);
    if (route.headingSlug) {
      scrollToHeading(route.headingSlug);
    } else {
      scrollToFilterMatch(firstHit);
    }
  } catch (e) {
    const p = document.createElement("p");
    p.className = "error";
    p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
    el.replaceChildren(p);
  }
  drawNav(rel);
}

whenDocumentReady(() => {
  initRoots();
  mobileNav = setupMobileNav({
    menubtn: document.getElementById("menubtn"),
    backdrop: document.getElementById("backdrop"),
  });

  setupThemeSwitcher(document.getElementById("theme-btn"));

  document.addEventListener("keydown", (e) => {
    if (!e.altKey || e.key.toLowerCase() !== "n") {
      return;
    }
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
      return;
    }
    if (t instanceof HTMLElement && t.isContentEditable) {
      return;
    }
    e.preventDefault();
    focusNextFilterMatch();
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
      p.className = "error";
      p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
      el.replaceChildren(p);
    }
  })();
});
