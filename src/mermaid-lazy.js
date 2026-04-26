/**
 * Renders ` ```mermaid` blocks (marked → `pre > code.language-mermaid`) to SVG.
 * Loads mermaid from CDN only when at least one such block exists.
 */

const MERMAID_CDN = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

/** @param {ParentNode} root */
function queryMermaidCodes(root) {
  return root.querySelectorAll("pre > code.language-mermaid");
}

let mermaidReady = null;

/**
 * @returns {Promise<unknown>}
 */
function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = (async () => {
      const mod = await import(/* webpackIgnore: true */ MERMAID_CDN);
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
      });
      return mermaid;
    })();
  }
  return mermaidReady;
}

/**
 * @param {HTMLElement} root — host of rendered article (e.g. #yamd-content)
 */
export async function runMermaidInRoot(root) {
  const codes = queryMermaidCodes(root);
  if (codes.length === 0) {
    return;
  }
  const mermaid = await loadMermaid();
  for (const code of codes) {
    const pre = code.parentElement;
    if (!pre || pre.localName.toLowerCase() !== "pre") {
      continue;
    }
    const def = (code.textContent || "").replace(/\n$/, "");
    const out = document.createElement("div");
    out.className = "yamd-mermaid";
    out.setAttribute("role", "img");
    if (def.trim().slice(0, 80)) {
      out.setAttribute("aria-label", "Diagram: " + def.trim().slice(0, 80).replace(/\s+/g, " ") + (def.length > 80 ? "…" : ""));
    }
    const id = "yamd-mmd-" + Math.random().toString(36).slice(2) + "-" + String(Date.now());
    pre.replaceWith(out);
    try {
      const { svg } = await mermaid.render(id, def);
      out.innerHTML = svg;
    } catch (e) {
      out.className = "yamd-mermaid yamd-mermaid--error";
      out.removeAttribute("role");
      out.removeAttribute("aria-label");
      out.textContent = (e instanceof Error ? e.message : String(e)) || "Mermaid render error";
    }
  }
}
