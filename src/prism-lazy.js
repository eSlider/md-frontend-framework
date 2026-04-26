/**
 * Syntax highlighting with [Prism](https://prismjs.com/) — lazy: loads only when
 * `pre > code.language-*` exists (excluding `language-mermaid`, handled earlier by Mermaid).
 * Pure ESM from esm.sh; theme CSS is injected once.
 */

const PRISM_VER = "1.29.0";
const ESM_BASE = `https://esm.sh/prismjs@${PRISM_VER}`;
const THEME = `https://cdn.jsdelivr.net/npm/prismjs@${PRISM_VER}/themes/prism-okaidia.min.css`;

/** @param {string} id */
function mapFenceLangToPrismComponent(id) {
  const l = (id || "").toLowerCase().trim();
  if (!l || l === "mermaid" || l === "plain" || l === "text") {
    return null;
  }
  const map = {
    html: "markup",
    htm: "markup",
    xml: "markup",
    svg: "markup",
    mathml: "markup",
    js: "javascript",
    es: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    ts: "typescript",
    json: "json",
    webmanifest: "json",
    css: "css",
    scss: "scss",
    less: "less",
    sh: "bash",
    shell: "bash",
    bash: "bash",
    zsh: "bash",
    yml: "yaml",
    yaml: "yaml",
    md: "markdown",
    markdown: "markdown",
    diff: "diff",
    py: "python",
    python: "python",
    rs: "rust",
    rust: "rust",
    go: "go",
    golang: "go",
  };
  return map[l] || l;
}

let themeInjected = false;
function ensurePrismTheme() {
  if (themeInjected) {
    return;
  }
  themeInjected = true;
  if (document.querySelector("link[data-yamd-prism-theme]")) {
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = THEME;
  link.setAttribute("data-yamd-prism-theme", "");
  document.head.appendChild(link);
}

const loadedComponents = new Set();

/**
 * @param {string} comp
 */
async function ensurePrismComponent(comp) {
  if (loadedComponents.has(comp)) {
    return;
  }
  const url = `${ESM_BASE}/components/prism-${comp}.js?deps=prismjs@${PRISM_VER}`;
  await import(/* webpackIgnore: true */ url);
  loadedComponents.add(comp);
}

let prismCore = null;
function loadPrismCore() {
  if (!prismCore) {
    prismCore = (async () => {
      const mod = await import(/* webpackIgnore: true */ ESM_BASE);
      const Prism = mod.default;
      Prism.manual = true;
      return Prism;
    })();
  }
  return prismCore;
}

/** @param {ParentNode} root */
function queryCodeBlocks(root) {
  return root.querySelectorAll("pre > code[class*='language-']");
}

/**
 * @param {HTMLElement} root
 */
export async function runPrismInRoot(root) {
  const blocks = queryCodeBlocks(root);
  if (blocks.length === 0) {
    return;
  }

  const components = new Set();
  for (const code of blocks) {
    const m = /(?:^|\s)language-([^\s]+)/.exec(code.className);
    const fence = m ? m[1] : "";
    const comp = mapFenceLangToPrismComponent(fence);
    if (comp) {
      components.add(comp);
    }
  }
  if (components.size === 0) {
    return;
  }

  ensurePrismTheme();
  const Prism = await loadPrismCore();

  try {
    await ensurePrismComponent("clike");
  } catch {
  }
  for (const comp of components) {
    if (comp === "clike") {
      continue;
    }
    try {
      await ensurePrismComponent(comp);
    } catch {
    }
  }

  if (typeof Prism.highlightAllUnder === "function") {
    Prism.highlightAllUnder(root, false, () => {});
  } else {
    for (const code of blocks) {
      const m = /(?:^|\s)language-([^\s]+)/.exec(code.className);
      if (!m || !mapFenceLangToPrismComponent(m[1])) {
        continue;
      }
      try {
        Prism.highlightElement(code);
      } catch {
      }
    }
  }

  for (const code of blocks) {
    const pre = code.parentElement;
    if (pre && pre.localName.toLowerCase() === "pre") {
      pre.classList.add("yamd-prism", "yamd-md__pre--prism");
    }
  }
}
