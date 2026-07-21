const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const siteHeader = document.querySelector("[data-site-header]");
const navItems = Array.from(document.querySelectorAll("[data-nav-item]"));
const desktopQuery = window.matchMedia("(min-width: 1201px)");

if (siteHeader && navToggle && navLinks) {
  let openItem = null;
  let closeTimer = null;
  let mobileMenuOpen = false;
  let returnFocusToToggle = false;

  const submenuToggleFor = (item) => item.querySelector("[data-nav-submenu-toggle]");
  const focusableSelector = "a[href], button:not([disabled])";

  const clearCloseTimer = () => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const setItemOpen = (item, isOpen) => {
    item.classList.toggle("is-open", isOpen);
    const toggle = submenuToggleFor(item);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(isOpen));
    }
  };

  const closeDesktopMenu = (shouldReturnFocus = false) => {
    clearCloseTimer();
    if (openItem) {
      const toggle = submenuToggleFor(openItem);
      setItemOpen(openItem, false);
      if (shouldReturnFocus && toggle) {
        toggle.focus();
      }
    }
    openItem = null;
  };

  const openDesktopMenu = (item) => {
    if (!desktopQuery.matches) {
      return;
    }
    clearCloseTimer();
    if (openItem && openItem !== item) {
      setItemOpen(openItem, false);
    }
    openItem = item;
    setItemOpen(item, true);
  };

  const scheduleDesktopClose = () => {
    clearCloseTimer();
    closeTimer = window.setTimeout(() => closeDesktopMenu(), 150);
  };

  const openCurrentMobileSection = () => {
    navItems.forEach((item) => setItemOpen(item, item.classList.contains("is-current-section")));
  };

  const closeMobileMenu = (shouldReturnFocus = false) => {
    if (!mobileMenuOpen) {
      return;
    }
    mobileMenuOpen = false;
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    navItems.forEach((item) => setItemOpen(item, false));
    if (shouldReturnFocus || returnFocusToToggle) {
      navToggle.focus();
    }
    returnFocusToToggle = false;
  };

  const openMobileMenu = () => {
    mobileMenuOpen = true;
    returnFocusToToggle = true;
    document.body.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation");
    openCurrentMobileSection();
    const firstLink = navLinks.querySelector("a[href]");
    if (firstLink) {
      firstLink.focus();
      window.requestAnimationFrame(() => firstLink.focus());
      window.setTimeout(() => firstLink.focus(), 0);
      window.setTimeout(() => firstLink.focus(), 80);
    }
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      closeMobileMenu(true);
    } else {
      openMobileMenu();
    }
  };

  navToggle.addEventListener("click", toggleMobileMenu);

  navItems.forEach((item) => {
    const toggle = submenuToggleFor(item);

    item.addEventListener("pointerenter", () => openDesktopMenu(item));
    item.addEventListener("pointerleave", () => {
      if (desktopQuery.matches) {
        scheduleDesktopClose();
      }
    });
    item.addEventListener("focusin", () => openDesktopMenu(item));
    item.addEventListener("focusout", () => {
      if (desktopQuery.matches && !item.contains(document.activeElement)) {
        scheduleDesktopClose();
      }
    });

    if (toggle) {
      toggle.addEventListener("click", () => {
        if (desktopQuery.matches) {
          openDesktopMenu(item);
          return;
        }

        navItems.forEach((otherItem) => {
          if (otherItem !== item) {
            setItemOpen(otherItem, false);
          }
        });
        setItemOpen(item, !item.classList.contains("is-open"));
      });
    }
  });

  navLinks.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!desktopQuery.matches) {
        closeMobileMenu();
      }
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (desktopQuery.matches && openItem && !siteHeader.contains(target)) {
      closeDesktopMenu();
    }
    if (!desktopQuery.matches && mobileMenuOpen && !siteHeader.contains(target)) {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (desktopQuery.matches && openItem) {
        closeDesktopMenu(true);
      } else if (!desktopQuery.matches && mobileMenuOpen) {
        closeMobileMenu(true);
      }
      return;
    }

    if (event.key !== "Tab" || desktopQuery.matches || !mobileMenuOpen) {
      return;
    }

    const focusable = [navToggle, ...Array.from(navLinks.querySelectorAll(focusableSelector))]
      .filter((element) => element.offsetParent !== null || element === navToggle);
    if (!focusable.length) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const handleViewportChange = () => {
    closeDesktopMenu();
    closeMobileMenu();
    navItems.forEach((item) => setItemOpen(item, false));
  };

  desktopQuery.addEventListener("change", handleViewportChange);
}

const clampDesktopNavMenus = () => {
  if (!desktopQuery.matches) {
    return;
  }
  document.querySelectorAll("[data-nav-menu]").forEach((menu) => {
    menu.style.removeProperty("--nav-menu-shift");
    const rect = menu.getBoundingClientRect();
    let shift = 0;
    if (rect.left < 16) {
      shift = 16 - rect.left;
    } else if (rect.right > window.innerWidth - 16) {
      shift = window.innerWidth - 16 - rect.right;
    }
    if (shift) {
      menu.style.setProperty("--nav-menu-shift", `${shift}px`);
    }
  });
};

window.addEventListener("resize", clampDesktopNavMenus);
window.addEventListener("load", clampDesktopNavMenus);

const hero = document.querySelector("[data-hero]");
const heroImages = [
  "assets/img/hero/chicken-production.png",
  "assets/img/hero/frozen-foods.png",
  "assets/img/hero/cheese-production.png",
  "assets/img/markets/protein.png"
];

if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let index = 0;
  setInterval(() => {
    index = (index + 1) % heroImages.length;
    const imageUrl = new URL(heroImages[index], window.location.href).href;
    hero.style.setProperty("--hero-image", `url("${imageUrl}")`);
  }, 5200);
}

document.querySelectorAll("[data-motion-section]").forEach((section) => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    section.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        section.classList.add("is-visible");
        observer.unobserve(section);
      }
    });
  }, { threshold: 0.35 });

  observer.observe(section);
});

document.querySelectorAll("[data-traceability-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let timer = null;

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  const showSlide = (nextIndex) => {
    currentIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === currentIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", String(isActive));
    });
  };

  const stopTimer = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startTimer = () => {
    if (!prefersReducedMotion && slides.length > 1 && !timer) {
      timer = window.setInterval(() => showSlide(currentIndex + 1), 5600);
    }
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
      stopTimer();
      startTimer();
    });
  });

  carousel.addEventListener("mouseenter", stopTimer);
  carousel.addEventListener("mouseleave", startTimer);
  carousel.addEventListener("focusin", stopTimer);
  carousel.addEventListener("focusout", startTimer);

  showSlide(currentIndex);
  startTimer();
});

document.querySelectorAll("[data-srdecide-stepper]").forEach((stepper) => {
  const tabs = Array.from(stepper.querySelectorAll("[data-step]"));
  const panels = Array.from(stepper.querySelectorAll("[data-panel]"));

  if (!tabs.length || !panels.length) {
    return;
  }

  const activateStep = (step) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.step === step;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === step;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateStep(tab.dataset.step));

    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      tabs[nextIndex].focus();
      activateStep(tabs[nextIndex].dataset.step);
    });
  });
});

document.querySelectorAll("[data-tabs]").forEach((tabGroup) => {
  const tabs = Array.from(tabGroup.querySelectorAll("[data-tab-target]"));
  const panels = Array.from(tabGroup.querySelectorAll("[data-tab-panel]"));

  if (!tabs.length || !panels.length) {
    return;
  }

  const activateTab = (target, shouldFocus = false, syncHash = false) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tabTarget === target;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("tabindex", isActive ? "0" : "-1");

      if (isActive && shouldFocus) {
        tab.focus();
      }
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.tabPanel === target;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });

    if (syncHash && tabGroup.dataset.tabs === "applications") {
      window.history.replaceState(null, "", `#${target}`);
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tabTarget, false, true));

    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateTab(tab.dataset.tabTarget, false, true);
        return;
      } else {
        return;
      }

      event.preventDefault();
      activateTab(tabs[nextIndex].dataset.tabTarget, true, true);
    });
  });

  const tabForHash = () => {
    const hash = window.location.hash.slice(1);
    return hash ? tabs.find((tab) => tab.dataset.tabTarget === hash) : null;
  };

  const initialTab = tabForHash() || tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  activateTab(initialTab.dataset.tabTarget);

  window.addEventListener("hashchange", () => {
    const hashedTab = tabForHash();

    if (hashedTab) {
      activateTab(hashedTab.dataset.tabTarget);
    }
  });
});

document.querySelectorAll("[data-activate-tab]").forEach((link) => {
  link.addEventListener("click", () => {
    const target = link.dataset.activateTab;
    const tab = document.querySelector(`[data-tab-target="${target}"]`);

    if (tab) {
      tab.click();
    }
  });
});

document.querySelectorAll("[data-fm-evidence-card]").forEach((card) => {
  const setOpen = (isOpen) => {
    card.classList.toggle("is-open", isOpen);
    card.setAttribute("aria-pressed", String(isOpen));
  };

  card.addEventListener("click", () => {
    setOpen(!card.classList.contains("is-open"));
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(!card.classList.contains("is-open"));
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  });
});

document.querySelectorAll("[data-compare-card]").forEach((card) => {
  const visual = card.querySelector("[data-compare-visual]");
  const handle = card.querySelector("[data-compare-handle]");

  if (!visual || !handle) {
    return;
  }

  let activePointerId = null;
  let value = 50;

  const clampValue = (nextValue) => Math.max(8, Math.min(92, nextValue));

  const setValue = (nextValue) => {
    value = clampValue(nextValue);
    const roundedValue = Math.round(value);

    visual.style.setProperty("--compare-position", `${value}%`);
    handle.setAttribute("aria-valuenow", String(roundedValue));
    handle.setAttribute("aria-valuetext", `${roundedValue} percent good reference shown`);
  };

  const getValueFromPointer = (clientX) => {
    const rect = visual.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  };

  visual.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePointerId = event.pointerId;
    visual.setPointerCapture(activePointerId);
    setValue(getValueFromPointer(event.clientX));
  });

  visual.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    setValue(getValueFromPointer(event.clientX));
  });

  const endDrag = (event) => {
    if (event.pointerId === activePointerId) {
      activePointerId = null;
    }
  };

  visual.addEventListener("pointerup", endDrag);
  visual.addEventListener("pointercancel", endDrag);
  visual.addEventListener("lostpointercapture", () => {
    activePointerId = null;
  });

  handle.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 10 : 5;
    let nextValue = value;

    if (event.key === "ArrowLeft") {
      nextValue = value - step;
    } else if (event.key === "ArrowRight") {
      nextValue = value + step;
    } else if (event.key === "Home") {
      nextValue = 8;
    } else if (event.key === "End") {
      nextValue = 92;
    } else {
      return;
    }

    event.preventDefault();
    setValue(nextValue);
  });

  setValue(value);
});

document.querySelectorAll("[data-assembly-toggle]").forEach((toggle) => {
  const setZoomed = (isZoomed) => {
    toggle.classList.toggle("is-zoomed", isZoomed);
    toggle.setAttribute("aria-pressed", String(isZoomed));
  };

  toggle.addEventListener("click", () => {
    setZoomed(!toggle.classList.contains("is-zoomed"));
  });

  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setZoomed(false);
    }
  });
});
