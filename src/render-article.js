import { renderUiModel } from "./render-ui.js";
import { contentPathToHash } from "./site-nav.js";

const TITLE = "yamd";

/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyText(text) {
  if (!text) {
    return false;
  }
  if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(ta);
  }
  return ok;
}

/**
 * @param {HTMLElement} section
 * @param {string} source
 */
function attachMarkdownCopyButton(section, source) {
  const text = source.replace(/^\s+|\s+$/g, "");
  if (!text) {
    return;
  }
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "copy-md-btn";
  btn.textContent = "Copy markdown";
  btn.setAttribute("aria-label", "Copy markdown section");
  btn.addEventListener("click", async () => {
    const original = btn.textContent || "Copy markdown";
    btn.disabled = true;
    const ok = await copyText(text);
    btn.textContent = ok ? "Copied" : "Error";
    btn.dataset.state = ok ? "success" : "error";
    window.setTimeout(() => {
      btn.textContent = original;
      delete btn.dataset.state;
      btn.disabled = false;
    }, ok ? 1200 : 1600);
  });
  section.prepend(btn);
}

function slugifyHeading(text) {
  const base = String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || "section";
}

/**
 * @param {HTMLElement} section
 * @param {string} contentPath
 */
function decorateHeadingLinks(section, contentPath) {
  const pageHash = contentPathToHash(contentPath).replace(/^#/, "");
  /** @type {Map<string, number>} */
  const seen = new Map();
  const hs = section.querySelectorAll("h1, h2, h3, h4, h5, h6");
  for (const h of hs) {
    let id = (h.getAttribute("id") || "").trim();
    if (!id) {
      const base = slugifyHeading(h.textContent || "");
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      id = n === 1 ? base : `${base}-${n}`;
      h.setAttribute("id", id);
    }
    if (!h.querySelector(":scope > a.heading-link")) {
      const a = document.createElement("a");
      a.className = "heading-link";
      a.href = `#${pageHash}/${id}`;
      a.setAttribute("aria-label", "Link to this heading");
      a.textContent = "#";
      h.appendChild(a);
    }
  }
}

/**
 * @param {string} printDate
 * @param {string} printTitle
 */
function upsertPrintFooter(printDate, printTitle) {
  if (!document.body) {
    return;
  }
  /** @type {HTMLElement | null} */
  let footer = document.getElementById("print-footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "print-footer";
    footer.setAttribute("aria-hidden", "true");
    footer.innerHTML = '<span class="left"></span><span class="center"></span><span class="right"></span>';
    document.body.appendChild(footer);
  }
  const left = footer.querySelector(".left");
  const center = footer.querySelector(".center");
  if (left) {
    left.textContent = printDate;
  }
  if (center) {
    center.textContent = printTitle;
  }
}

export function render(root, { meta, parts }, options) {
  const contentPath = options && typeof options.contentPath === "string" ? options.contentPath : "content/docs/index.md";
  const act = typeof meta.form_action === "string" ? meta.form_action : undefined;
  const meth = typeof meta.form_method === "string" ? meta.form_method : undefined;
  const settings = meta && typeof meta.settings === "object" && meta.settings ? meta.settings : {};
  const copyMarkdownEnabled =
    settings.copy_markdown === true ||
    settings.copyMarkdown === true;

  if (meta.title) {
    document.title = String(meta.title) + " · yamd";
  }
  const printTitle = document.title || TITLE;
  const printDate = new Date().toISOString().slice(0, 10);
  document.documentElement.setAttribute("data-print-title", printTitle);
  document.documentElement.setAttribute("data-print-date", printDate);
  if (document.body) {
    document.body.setAttribute("data-print-title", printTitle);
    document.body.setAttribute("data-print-date", printDate);
  }
  upsertPrintFooter(printDate, printTitle);

  const a = document.createElement("article");
  const first = parts[0];
  const h1InFirstMd =
    first &&
    first.type === "md" &&
    typeof first.html === "string" &&
    /^\s*<h1\b/i.test(first.html);
  if (!h1InFirstMd) {
    const h1 = document.createElement("h1");
    h1.textContent = String(meta.title || TITLE);
    a.appendChild(h1);
  }

  for (const p of parts) {
    const s = document.createElement("section");
    if (p.type === "md") {
      s.className = "md";
      s.innerHTML = p.html;
      if (copyMarkdownEnabled && typeof p.source === "string") {
        attachMarkdownCopyButton(s, p.source);
      }
      decorateHeadingLinks(s, contentPath);
    } else {
      s.className = "ui";
      s.appendChild(renderUiModel(p.data, { action: act, method: meth }));
    }
    a.appendChild(s);
  }
  root.replaceChildren(a);
}
