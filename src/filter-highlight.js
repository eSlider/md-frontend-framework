/**
 * Highlights occurrences of the trimmed sidebar-filter value inside the
 * currently rendered article. Wraps each match in <span class="filter-value">.
 *
 * Idempotent: every call first unwraps any prior .filter-value spans, so the
 * caller can re-invoke it on every filter change without accumulating layers.
 */

const HIGHLIGHT_CLASS = "filter-value";
const HIGHLIGHT_SELECTOR = "span." + HIGHLIGHT_CLASS;

/**
 * Element tag names whose subtree must NOT be modified — either because the
 * text is not user-visible (script/style/template) or because it belongs to
 * an interactive control whose internals must stay intact.
 * @type {Set<string>}
 */
const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "IFRAME",
  "TEMPLATE",
  "BUTTON",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION",
]);

/**
 * @param {ParentNode | null | undefined} root
 * @param {string | null | undefined} query — already trimmed by the caller is fine; we trim again defensively
 * @returns {HTMLElement | null} the first wrapped match, or null when nothing was wrapped
 */
export function applyFilterHighlight(root, query) {
  if (!root || typeof (/** @type {{ querySelectorAll?: unknown }} */ (root)).querySelectorAll !== "function") {
    return null;
  }
  unwrapExistingHighlights(/** @type {Element | DocumentFragment} */ (root));
  const needle = String(query || "").trim();
  if (!needle) {
    return null;
  }
  return wrapOccurrencesIn(/** @type {Element | DocumentFragment} */ (root), needle);
}

/**
 * @param {Element | DocumentFragment} root
 */
function unwrapExistingHighlights(root) {
  const spans = root.querySelectorAll(HIGHLIGHT_SELECTOR);
  /** @type {Set<Node>} */
  const touchedParents = new Set();
  for (const span of spans) {
    const parent = span.parentNode;
    if (!parent) {
      continue;
    }
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
    touchedParents.add(parent);
  }
  for (const p of touchedParents) {
    if (typeof (/** @type {Element} */ (p)).normalize === "function") {
      /** @type {Element} */ (p).normalize();
    }
  }
}

/**
 * @param {Element | DocumentFragment} root
 * @param {string} needle — non-empty
 * @returns {HTMLElement | null} first wrapped match, or null if none found
 */
function wrapOccurrencesIn(root, needle) {
  const targets = collectTextNodes(root);
  const lowered = needle.toLowerCase();
  /** @type {HTMLElement | null} */
  let first = null;
  for (const node of targets) {
    const got = wrapMatchesInTextNode(node, lowered, needle.length);
    if (got && !first) {
      first = got;
    }
  }
  return first;
}

/**
 * @param {Element | DocumentFragment} root
 * @returns {Text[]}
 */
function collectTextNodes(root) {
  /** @type {Text[]} */
  const out = [];
  const walker = (root.ownerDocument || document).createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(/** @type {Node} */ node) {
        const text = node.nodeValue;
        if (!text || !text.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        let p = node.parentNode;
        while (p && p !== root) {
          if (p.nodeType === 1 && SKIP_TAGS.has(/** @type {Element} */ (p).tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  let n = walker.nextNode();
  while (n) {
    out.push(/** @type {Text} */ (n));
    n = walker.nextNode();
  }
  return out;
}

/**
 * @param {Text} textNode
 * @param {string} needleLower — already toLowerCase()'d, non-empty
 * @param {number} needleLen
 * @returns {HTMLElement | null} the first .filter-value span created from this text node, or null
 */
function wrapMatchesInTextNode(textNode, needleLower, needleLen) {
  const original = textNode.nodeValue;
  if (!original) {
    return null;
  }
  const low = original.toLowerCase();
  let from = 0;
  let firstHit = low.indexOf(needleLower, from);
  if (firstHit < 0) {
    return null;
  }
  const doc = textNode.ownerDocument || document;
  const frag = doc.createDocumentFragment();
  /** @type {HTMLElement | null} */
  let firstSpan = null;
  while (firstHit >= 0) {
    if (from < firstHit) {
      frag.appendChild(doc.createTextNode(original.slice(from, firstHit)));
    }
    const span = doc.createElement("span");
    span.className = HIGHLIGHT_CLASS;
    span.appendChild(doc.createTextNode(original.slice(firstHit, firstHit + needleLen)));
    frag.appendChild(span);
    if (!firstSpan) {
      firstSpan = span;
    }
    from = firstHit + needleLen;
    firstHit = low.indexOf(needleLower, from);
  }
  if (from < original.length) {
    frag.appendChild(doc.createTextNode(original.slice(from)));
  }
  const parent = textNode.parentNode;
  if (!parent) {
    return null;
  }
  parent.replaceChild(frag, textNode);
  return firstSpan;
}
