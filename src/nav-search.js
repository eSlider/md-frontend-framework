import yaml from "https://esm.sh/yaml@2.8.0?bundle";
import { contentUrl, norm } from "./site-nav.js";

/**
 * @typedef {{ path: string, navLabel: string, docTitle: string, haystack: string }} IndexRow
 */

/**
 * @param {string} text
 * @returns {{ frontmatter: string | null, body: string }}
 * Same as document.js
 */
function splitFrontmatter(/** @type {string} */ text) {
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

/**
 * @param {string} body
 * @returns {string}
 */
function bodyToIndexText(/** @type {string} */ body) {
  let s = String(body);
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/^#+\s*[^\n]*/gm, " ");
  s = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1 ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/[*_~`#>|]/g, " ");
  s = s.replace(/https?:\/\/\S+/g, " ");
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * @param {string} raw
 * @returns {string}
 */
function docTitleFromRaw(/** @type {string} */ raw) {
  const t = String(raw).replace(/^\uFEFF/, "");
  const { frontmatter, body: _b } = splitFrontmatter(t);
  if (!frontmatter) {
    return "";
  }
  try {
    const m = /** @type {Record<string, unknown>} */ (yaml.parse(frontmatter) ?? {});
    return typeof m.title === "string" ? m.title.trim() : "";
  } catch {
    return "";
  }
}

/**
 * @param {string} raw
 * @returns {string}
 */
function bodyForIndex(/** @type {string} */ raw) {
  const t = String(raw).replace(/^\uFEFF/, "");
  const { body } = splitFrontmatter(t);
  return bodyToIndexText(body);
}

/**
 * @param {{ path: string, label: string }[]} entries
 * @param {string} importMetaUrl
 * @returns {Promise<IndexRow[]>}
 */
export async function buildSearchIndex(/** @type {{ path: string, label: string }[]} */ entries, /** @type {string} */ importMetaUrl) {
  const rows = await Promise.all(
    entries.map(async (e) => {
      try {
        const u = contentUrl(e.path, importMetaUrl);
        const r = await fetch(u, { cache: "no-store" });
        if (!r.ok) {
          return makeRowFromNavOnly(e);
        }
        const raw = await r.text();
        const docTitle = docTitleFromRaw(raw);
        const bodyText = bodyForIndex(raw);
        return buildRow(e.path, e.label, docTitle, bodyText);
      } catch {
        return makeRowFromNavOnly(e);
      }
    })
  );
  return rows;
}

/**
 * @param {string} path
 * @param {string} navLabel
 * @param {string} docTitle
 * @param {string} bodyText
 * @returns {IndexRow}
 */
function buildRow(/** @type {string} */ path, /** @type {string} */ navLabel, /** @type {string} */ docTitle, /** @type {string} */ bodyText) {
  const t = [navLabel, docTitle, bodyText].filter(Boolean).join(" ");
  return {
    path,
    navLabel: navLabel || "",
    docTitle: docTitle || "",
    haystack: t.toLowerCase(),
  };
}

/**
 * @param {{ path: string, label: string }} e
 * @returns {IndexRow}
 */
function makeRowFromNavOnly(/** @type {{ path: string, label: string }} */ e) {
  return buildRow(e.path, e.label, "", "");
}

/**
 * All page paths (normalized) that match the same rules as search (and query).
 * @param {IndexRow[]} index
 * @param {string} q
 * @returns {Set<string>}
 */
export function matchingPathsForQuery(/** @type {IndexRow[]} */ index, /** @type {string} */ q) {
  const t = String(q)
    .trim()
    .toLowerCase();
  const out = new Set();
  if (!t) {
    return out;
  }
  const terms = t.split(/\s+/).filter((s) => s.length > 0);
  if (terms.length === 0) {
    return out;
  }
  for (const row of index) {
    const titleL = (row.docTitle + " " + row.navLabel).toLowerCase();
    let allTerms = true;
    for (const term of terms) {
      if (!row.haystack.includes(term) && !titleL.includes(term)) {
        allTerms = false;
        break;
      }
    }
    if (allTerms) {
      out.add(norm(row.path));
    }
  }
  return out;
}

/**
 * @param {{ path: string, label: string }[]} entries
 * @param {string} q
 * @returns {Set<string>} normalized path keys
 */
function matchingPathsFromNavLabels(/** @type {{ path: string, label: string }[]} */ entries, /** @type {string} */ q) {
  const t = String(q)
    .trim()
    .toLowerCase();
  const out = new Set();
  if (!t) {
    return out;
  }
  const terms = t.split(/\s+/).filter((s) => s.length > 0);
  if (terms.length === 0) {
    return out;
  }
  for (const e of entries) {
    const l = (e.label || "").toLowerCase();
    if (terms.every((term) => l.includes(term))) {
      out.add(norm(e.path));
    }
  }
  return out;
}

/**
 * @param {{ onFilterChange: (paths: Set | null, query: string) => void }} actions
 * @param {string} importMetaUrl
 * @param {{ path: string, label: string }[]} entries
 * @returns {{ root: HTMLElement, getIndex: () => IndexRow[] }}
 */
export function setupNavSearch(/** @type {{ onFilterChange: (paths: Set | null, query: string) => void }} */ actions, /** @type {string} */ importMetaUrl, /** @type {{ path: string, label: string }[]} */ entries) {
  const { onFilterChange } = actions;

  const block = document.createElement("div");
  block.className = "yamd-nav-search";
  const label = document.createElement("label");
  label.className = "yamd-nav-search__label";
  label.setAttribute("for", "yamd-nav-search-input");
  label.textContent = "Filter navigation";

  const input = document.createElement("input");
  input.className = "yamd-nav-search__input";
  input.id = "yamd-nav-search-input";
  input.type = "search";
  input.name = "q";
  input.autocomplete = "off";
  input.placeholder = "Filter…";
  input.setAttribute("aria-label", "Filter navigation by page content");
  input.setAttribute("enterkeyhint", "search");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");

  const status = document.createElement("p");
  status.className = "yamd-nav-search__status";
  status.setAttribute("aria-live", "polite");

  block.appendChild(label);
  block.appendChild(input);
  block.appendChild(status);

  /** @type {IndexRow[]} */
  let index = [];
  let debounce = 0;
  /** Bumped on each focus; stale async completions are ignored. */
  let indexGeneration = 0;
  let indexLoading = false;

  function setStatus(/** @type {string} */ t) {
    status.textContent = t;
  }

  function idleStatus() {
    if (indexLoading) {
      setStatus("Indexing…");
    } else if (index.length) {
      setStatus(`${index.length} pages indexed`);
    } else {
      setStatus("Filter by search");
    }
  }

  async function loadIndexOnFocus() {
    const gen = ++indexGeneration;
    indexLoading = true;
    if (input.value.trim()) {
      setStatus("Indexing…");
      onFilterChange(null, input.value.trim());
    } else {
      idleStatus();
    }
    try {
      const rows = await buildSearchIndex(entries, importMetaUrl);
      if (gen !== indexGeneration) {
        return;
      }
      index = rows;
      indexLoading = false;
      if (input.value.trim()) {
        applyFilter();
      } else {
        idleStatus();
      }
    } catch {
      if (gen !== indexGeneration) {
        return;
      }
      index = entries.map((e) => makeRowFromNavOnly(e));
      indexLoading = false;
      setStatus("Index failed; filter by nav title only");
      if (input.value.trim()) {
        applyFilter();
      } else {
        idleStatus();
      }
    }
  }

  function applyFilter() {
    const q = input.value;
    const qt = q.trim();
    if (!qt) {
      onFilterChange(null, "");
      idleStatus();
      return;
    }
    if (indexLoading) {
      onFilterChange(null, qt);
      setStatus("Indexing…");
      return;
    }
    if (index.length) {
      const paths = matchingPathsForQuery(index, q);
      onFilterChange(paths, qt);
      setStatus(paths.size ? `Showing ${paths.size} page${paths.size === 1 ? "" : "s"}` : "No matches");
    } else {
      const paths = matchingPathsFromNavLabels(entries, q);
      onFilterChange(paths, qt);
      setStatus(paths.size ? `Showing ${paths.size} (nav title only, focus to index)` : "No matches");
    }
  }

  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      applyFilter();
    }, 150);
  });

  input.addEventListener("search", applyFilter);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      applyFilter();
    }
  });

  input.addEventListener("focus", () => {
    void loadIndexOnFocus();
  });

  setStatus("Filter by search");

  document.addEventListener("keydown", (e) => {
    if (e.key !== "/") {
      return;
    }
    const t = e.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
      return;
    }
    if (t instanceof HTMLSelectElement) {
      return;
    }
    if (t instanceof HTMLElement && t.isContentEditable) {
      return;
    }
    e.preventDefault();
    input.focus();
  });

  return {
    root: block,
    getIndex: () => index,
  };
}
