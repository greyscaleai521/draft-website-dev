const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

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
