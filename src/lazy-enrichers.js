/**
 * Optional client-side “interpreters” for markdown output (Mermaid, Prism, …).
 * Sub-modules are loaded only when the rendered DOM contains the matching block.
 * Order: Mermaid first (replaces ` ```mermaid` pres), then Prism (syntax colours other fences).
 */
import { runMermaidInRoot } from "./mermaid-lazy.js";
import { runPrismInRoot } from "./prism-lazy.js";

/**
 * @param {HTMLElement} root
 */
export async function runLazyEnrichers(root) {
  await runMermaidInRoot(root);
  await runPrismInRoot(root);
}
