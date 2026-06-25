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
