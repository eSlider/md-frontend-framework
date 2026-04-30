/**
 * Two-state theme toggle (light <-> dark) persisted in localStorage.
 *
 * The actual `data-theme` attribute is applied synchronously by an inline
 * script in `index.html` to avoid a flash of incorrect theme. This module
 * only wires the toggle button and updates the accessible label.
 */

const STORAGE_KEY = "yamd-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// Enum
export const Themes = {
  LIGHT: "light",
  DARK: "dark",
};

/**
 * @returns {"light" | "dark" | null}
 */
function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
}

/**
 * @returns {"light" | "dark"}
 */
function getNextTheme() {
  return getEffectiveTheme() === Themes.DARK ? Themes.LIGHT : Themes.DARK;
}
/**
 * @param {"light" | "dark"} theme
 */
function setStoredTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * @returns {"light" | "dark"}
 */
function getEffectiveTheme() {
  const stored = getStoredTheme();
  if (stored) {
    return stored;
  }
  return window.matchMedia(DARK_QUERY).matches ? Themes.DARK : Themes.LIGHT;
}

/**
 * @param {"light" | "dark"} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * @param {HTMLElement | null} button
 * @returns {{ refresh: () => void } | null}
 */
export function setupThemeSwitcher(button) {
  if (!button) {
    return null;
  }

  function refresh() {
    const label = `Switch to ${(getNextTheme())} theme`;

    button.setAttribute("aria-label", label);
    button.title = label;
  }

  refresh();
  button.addEventListener("click", () => {

    const next = getNextTheme();
    setStoredTheme(next);
    applyTheme(next);
    refresh();
  });

  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener("change", () => {
    if (!getStoredTheme()) {
      refresh();
    }
  });

  return { refresh };
}
