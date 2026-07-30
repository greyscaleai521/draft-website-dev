(() => {
  "use strict";

  const root = document.querySelector(".enterprise-access-page");
  if (!root) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setUseIcon = (svg, iconName) => {
    const use = svg?.querySelector("use");
    if (use && iconName) {
      use.setAttribute("href", `#ea-icon-${iconName}`);
    }
  };

  // Hero explainer controls.
  const heroVisual = root.querySelector("[data-ea-hero-visual]");
  if (heroVisual) {
    const controls = Array.from(heroVisual.querySelectorAll("[data-ea-hero-control]"));
    const detailTitle = heroVisual.querySelector("[data-ea-hero-title]");
    const detailCopy = heroVisual.querySelector("[data-ea-hero-copy]");
    const detailIcon = heroVisual.querySelector("[data-ea-hero-icon]");

    const activateHeroLayer = (control, shouldFocus = false) => {
      if (!control) return;
      const layer = control.dataset.eaHeroControl;
      controls.forEach((item) => {
        const selected = item === control;
        item.setAttribute("aria-pressed", String(selected));
      });
      heroVisual.dataset.activeLayer = layer;
      if (detailTitle) detailTitle.textContent = control.dataset.title || "";
      if (detailCopy) detailCopy.textContent = control.dataset.copy || "";
      setUseIcon(detailIcon, control.dataset.icon || layer);
      if (shouldFocus) control.focus();
    };

    controls.forEach((control, index) => {
      control.addEventListener("click", () => activateHeroLayer(control));
      control.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % controls.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + controls.length) % controls.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = controls.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        activateHeroLayer(controls[nextIndex], true);
      });
    });

    activateHeroLayer(controls.find((item) => item.getAttribute("aria-pressed") === "true") || controls[0]);
  }

  // Accessible role tabs.
  root.querySelectorAll("[data-ea-tabs]").forEach((tabGroup) => {
    const tabs = Array.from(tabGroup.querySelectorAll("[data-ea-tab]"));
    const panels = Array.from(tabGroup.querySelectorAll("[data-ea-panel]"));
    if (!tabs.length || !panels.length) return;

    const activate = (id, focus = false) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.eaTab === id;
        tab.setAttribute("aria-selected", String(selected));
        tab.setAttribute("tabindex", selected ? "0" : "-1");
        if (selected && focus) tab.focus();
      });
      panels.forEach((panel) => {
        const selected = panel.dataset.eaPanel === id;
        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab.dataset.eaTab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        activate(tabs[nextIndex].dataset.eaTab, true);
      });
    });

    const initial = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
    activate(initial.dataset.eaTab);
  });

  // Accessible access-flow stepper.
  root.querySelectorAll("[data-ea-stepper]").forEach((stepper) => {
    const steps = Array.from(stepper.querySelectorAll("[data-ea-step]"));
    const panels = Array.from(stepper.querySelectorAll("[data-ea-flow-panel]"));
    if (!steps.length || !panels.length) return;

    const activate = (id, focus = false) => {
      steps.forEach((step) => {
        const selected = step.dataset.eaStep === id;
        step.setAttribute("aria-selected", String(selected));
        step.setAttribute("tabindex", selected ? "0" : "-1");
        if (selected && focus) step.focus();
      });
      panels.forEach((panel) => {
        const selected = panel.dataset.eaFlowPanel === id;
        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);
      });
    };

    steps.forEach((step, index) => {
      step.addEventListener("click", () => activate(step.dataset.eaStep));
      step.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % steps.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + steps.length) % steps.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = steps.length - 1;
        } else {
          return;
        }
        event.preventDefault();
        activate(steps[nextIndex].dataset.eaStep, true);
      });
    });

    const initial = steps.find((step) => step.getAttribute("aria-selected") === "true") || steps[0];
    activate(initial.dataset.eaStep);
  });

  // Reveal motion, disabled for reduced-motion users.
  const revealItems = Array.from(root.querySelectorAll(".ea-reveal"));
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  // Sticky local navigation highlights the section currently in view.
  const pageNav = root.querySelector("[data-ea-page-nav]");
  if (pageNav && "IntersectionObserver" in window) {
    const links = Array.from(pageNav.querySelectorAll("a[href^='#']"));
    const sections = links
      .map((link) => root.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const setCurrent = (id) => {
      links.forEach((link) => {
        if (link.getAttribute("href") === `#${id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setCurrent(visible.target.id);
    }, { rootMargin: "-25% 0px -58% 0px", threshold: [0.08, 0.25, 0.55] });

    sections.forEach((section) => navObserver.observe(section));
  }
})();
