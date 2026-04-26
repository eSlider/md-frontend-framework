import { compile } from "./document.js";
import { render } from "./render.js";
import {
  coalescePath,
  contentUrl,
  getPathFromQuery,
  parsePagesYmlText,
  pickInitialPath,
  renderNavTree,
  setPathInCurrentUrl,
} from "./site-nav.js";

const PAGES = new URL("../pages.yml", import.meta.url);
const el = document.getElementById("mdui-content");
const navHost = document.getElementById("mdui-nav-wrap");

if (!el) {
  throw new Error("#mdui-content");
}

const FALLBACK_MD = "content/example.md";

const nav = { defaultPath: null, items: [] };
let hasNav = false;

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
  const q = getPathFromQuery();
  if (hasNav) {
    return coalescePath(nav.items, q, nav.defaultPath, FALLBACK_MD);
  }
  return (q && q.trim() ? q.trim() : pickInitialPath([], nav.defaultPath, FALLBACK_MD)) || FALLBACK_MD;
}

function drawNav(/** @type {string} */ rel) {
  if (!hasNav || !navHost) {
    return;
  }
  renderNavTree(navHost, nav.items, rel, (p) => {
    const u = setPathInCurrentUrl(p);
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
  } catch (e) {
    const p = document.createElement("p");
    p.className = "mdui-error";
    p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
    el.replaceChildren(p);
  }
  drawNav(rel);
}

window.addEventListener("popstate", () => {
  go();
});

void (async () => {
  try {
    await loadTree();
    await go();
  } catch (e) {
    const p = document.createElement("p");
    p.className = "mdui-error";
    p.textContent = "Error: " + (e instanceof Error ? e.message : String(e));
    el.replaceChildren(p);
  }
})();
