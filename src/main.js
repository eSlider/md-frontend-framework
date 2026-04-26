import { compile } from "./document.js";
import { render } from "./render.js";
import { runLazyEnrichers } from "./lazy-enrichers.js";
import {
  coalescePath,
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
const el = document.getElementById("yamd-content");
const navHost = document.getElementById("yamd-nav-wrap");

if (!el) {
  throw new Error("#yamd-content");
}

const FALLBACK_MD = "content/docs/index.md";

const nav = { defaultPath: null, items: [] };
let hasNav = false;

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
  renderNavTree(navHost, nav.items, rel, (p) => {
    const u = getHistoryUrlForContent(p);
    history.pushState({ p }, "", u);
    go(p);
  });
}

/**
 * @param {string|undefined} explicitPath
 */
async function go(/** @type {string|undefined} */ explicitPath) {
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
    const doc = await compile(await res.text());
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

window.addEventListener("popstate", () => {
  go();
});

window.addEventListener("hashchange", () => {
  go();
});

void (async () => {
  try {
    migrateLegacyPathQuery();
    rewriteLegacyContentHash();
    await loadTree();
    await go();
  } catch (e) {
    const p = document.createElement("p");
    p.className = "yamd-error";
    p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
    el.replaceChildren(p);
  }
})();
