function initCarousel(carouselEl) {
  const track = carouselEl.querySelector(".carousel__track");
  const dotsContainer = carouselEl.nextElementSibling; // .carousel__dots
  const prevBtn = carouselEl.querySelector(".carousel__arrow--prev");
  const nextBtn = carouselEl.querySelector(".carousel__arrow--next");
  const slides = Array.from(track.children);

  dotsContainer.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot-btn";
    dot.setAttribute("aria-label", `Ir a la imagen ${i + 1}`);
    dot.addEventListener("click", () => scrollToIndex(i));
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  function scrollToIndex(index) {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    slides[clamped].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function currentIndex() {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let minDist = Infinity;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs((rect.left + rect.width / 2) - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function updateDots() {
    const idx = currentIndex();
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  }

  prevBtn.addEventListener("click", () => scrollToIndex(currentIndex() - 1));
  nextBtn.addEventListener("click", () => scrollToIndex(currentIndex() + 1));

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateDots);
  }, { passive: true });

  updateDots();
}

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const track = document.getElementById("lightbox-track");
  const dotsContainer = document.getElementById("lightbox-dots");
  const titleEl = document.getElementById("lightbox-title");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const prevBtn = lightbox.querySelector(".lightbox__arrow--prev");
  const nextBtn = lightbox.querySelector(".lightbox__arrow--next");

  let slides = [];
  let dots = [];

  function openLightbox(cardEl) {
    const images = Array.from(cardEl.querySelectorAll(".carousel__track img"));
    const title = cardEl.querySelector(".project-card__title")?.textContent || "";

    track.innerHTML = "";
    dotsContainer.innerHTML = "";

    images.forEach((img) => {
      const clone = document.createElement("img");
      clone.src = img.src;
      clone.alt = img.alt;
      track.appendChild(clone);
    });

    slides = Array.from(track.children);

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot-btn";
      dot.setAttribute("aria-label", `Ir a la imagen ${i + 1}`);
      dot.addEventListener("click", () => scrollToIndex(i));
      dotsContainer.appendChild(dot);
    });
    dots = Array.from(dotsContainer.children);

    titleEl.textContent = title;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    updateDots();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function scrollToIndex(index) {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    slides[clamped].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function currentIndex() {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let minDist = Infinity;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const dist = Math.abs((rect.left + rect.width / 2) - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function updateDots() {
    const idx = currentIndex();
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  }

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", () => scrollToIndex(currentIndex() - 1));
  nextBtn.addEventListener("click", () => scrollToIndex(currentIndex() + 1));

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateDots);
  }, { passive: true });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") scrollToIndex(currentIndex() - 1);
    if (e.key === "ArrowRight") scrollToIndex(currentIndex() + 1);
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    card.querySelectorAll(".carousel__track img").forEach((img) => {
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        openLightbox(card);
      });
    });
  });
}

function initCategoryTabs() {
  const nav = document.querySelector(".category-tabs");
  if (!nav) return;

  const indicator = nav.querySelector(".tab-indicator");
  const tabs = Array.from(nav.querySelectorAll(".category-tab"));

  function moveIndicator(tab) {
    indicator.style.left = tab.offsetLeft + "px";
    indicator.style.width = tab.offsetWidth + "px";
  }

  function activate(tab, { focus = false } = {}) {
    tabs.forEach((t) => {
      const isTarget = t === tab;
      t.classList.toggle("is-active", isTarget);
      t.setAttribute("aria-selected", isTarget ? "true" : "false");
      t.tabIndex = isTarget ? 0 : -1;

      const panel = document.getElementById(t.dataset.target);
      if (!panel) return;
      if (isTarget) {
        panel.hidden = false;
        panel.classList.add("is-active");
      } else {
        panel.hidden = true;
        panel.classList.remove("is-active");
      }
    });
    moveIndicator(tab);
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        activate(tabs[(i + 1) % tabs.length], { focus: true });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        activate(tabs[(i - 1 + tabs.length) % tabs.length], { focus: true });
      }
    });
  });

  window.addEventListener("resize", () => {
    const active = tabs.find((t) => t.classList.contains("is-active"));
    if (active) moveIndicator(active);
  });

  const initialActive = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
  moveIndicator(initialActive);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".carousel").forEach(initCarousel);
  initCategoryTabs();
  initLightbox();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
