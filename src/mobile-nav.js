/**
 * Mobile: hamburger, slide-in drawer, scrim; body scroll lock; Esc / scrim to close
 * (same breakpoint as the shell: max-width: 52rem).
 */

const MQ = "(max-width: 52rem)";

/**
 * @returns {boolean}
 */
export function isMobileLayout() {
  return window.matchMedia(MQ).matches;
}

/** @type {{ closeIfMobile: () => void } | null} */
let mobileApi = null;

/**
 * @param {{ menubtn: HTMLElement | null, backdrop: HTMLElement | null }} els
 * @returns {{ closeIfMobile: () => void } | null}
 */
export function setupMobileNav(els) {
  if (mobileApi) {
    return mobileApi;
  }
  const { menubtn, backdrop } = els;
  if (!menubtn) {
    return null;
  }
  const mql = window.matchMedia(MQ);

  function setOpen(/** @type {boolean} */ open) {
    if (!isMobileLayout()) {
      clearState();
      return;
    }
    if (open) {
      document.documentElement.classList.add("yamd-nav--open");
      document.body.classList.add("yamd-nav--lock");
      menubtn.setAttribute("aria-expanded", "true");
      menubtn.setAttribute("aria-label", "Close table of contents");
      if (backdrop) {
        backdrop.removeAttribute("hidden");
        backdrop.setAttribute("aria-hidden", "false");
      }
    } else {
      clearState();
    }
  }

  function clearState() {
    document.documentElement.classList.remove("yamd-nav--open");
    document.body.classList.remove("yamd-nav--lock");
    menubtn.setAttribute("aria-expanded", "false");
    menubtn.setAttribute("aria-label", "Open table of contents");
    if (backdrop) {
      backdrop.setAttribute("hidden", "");
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function close() {
    if (isMobileLayout()) {
      setOpen(false);
    } else {
      clearState();
    }
  }

  function toggle() {
    if (document.documentElement.classList.contains("yamd-nav--open")) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }

  menubtn.addEventListener("click", () => {
    toggle();
  });
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      close();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobileLayout() && document.documentElement.classList.contains("yamd-nav--open")) {
      e.preventDefault();
      close();
    }
  });
  mql.addEventListener("change", () => {
    if (!mql.matches) {
      clearState();
    }
  });

  mobileApi = {
    closeIfMobile: () => {
      if (isMobileLayout()) {
        setOpen(false);
      }
    },
  };
  return mobileApi;
}
