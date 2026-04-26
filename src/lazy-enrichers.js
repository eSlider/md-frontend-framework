/**
 * Optional client-side “interpreters” for markdown output (Mermaid, …).
 * Sub-modules are loaded only when the rendered DOM contains the matching block.
 */
import { runMermaidInRoot } from "./mermaid-lazy.js";

/**
 * @param {HTMLElement} root
 */
export async function runLazyEnrichers(root) {
  await runMermaidInRoot(root);
}
