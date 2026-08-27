function initCarousel(carouselEl) {
  const track = carouselEl.querySelector(".carousel__track");
  const dotsContainer = carouselEl.nextElementSibling;
  const prevBtn = carouselEl.querySelector(".carousel__arrow--prev");
  const nextBtn = carouselEl.querySelector(".carousel__arrow--next");
  const slides = Array.from(track.children);

  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX, startY;

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
    resetZoom();
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

  function resetZoom() {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    carouselEl.classList.remove("has-zoom");
    slides.forEach((img) => {
      img.classList.remove("is-zoomed");
      img.style.transform = "";
    });
  }

  function applyZoom(img) {
    if (zoomScale > 1) {
      img.classList.add("is-zoomed");
      carouselEl.classList.add("has-zoom");
    } else {
      img.classList.remove("is-zoomed");
      carouselEl.classList.remove("has-zoom");
    }
    img.style.transform = `scale(${zoomScale}) translate(${panX}px, ${panY}px)`;
  }

  function handleWheel(e) {
    const currentImg = slides[currentIndex()];
    if (!currentImg) return;

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomScale = Math.min(zoomScale + 0.15, 4);
      } else {
        zoomScale = Math.max(zoomScale - 0.15, 1);
        if (zoomScale === 1) { panX = 0; panY = 0; }
      }
      applyZoom(currentImg);
    } else {
      if (zoomScale > 1) return;
      if (e.deltaY > 0) {
        scrollToIndex(currentIndex() + 1);
      } else if (e.deltaY < 0) {
        scrollToIndex(currentIndex() - 1);
      }
    }
  }

  function handleDoubleClick(e) {
    if (zoomScale > 1) {
      resetZoom();
    } else {
      zoomScale = 2;
      panX = 0;
      panY = 0;
      const currentImg = slides[currentIndex()];
      if (currentImg) {
        const rect = currentImg.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        panX = -x * 50;
        panY = -y * 50;
        applyZoom(currentImg);
      }
    }
  }

  function handlePanStart(e) {
    if (zoomScale <= 1) return;
    isPanning = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) - panX;
    startY = (e.touches ? e.touches[0].clientY : e.clientY) - panY;
  }

  function handlePanMove(e) {
    if (!isPanning) return;
    e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    panX = x - startX;
    panY = y - startY;
    const currentImg = slides[currentIndex()];
    if (currentImg) applyZoom(currentImg);
  }

  function handlePanEnd() {
    isPanning = false;
  }

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateDots);
  }, { passive: true });

  track.addEventListener("wheel", handleWheel, { passive: false });
  track.addEventListener("dblclick", handleDoubleClick);
  track.addEventListener("mousedown", handlePanStart);
  track.addEventListener("mousemove", handlePanMove);
  track.addEventListener("mouseup", handlePanEnd);
  track.addEventListener("mouseleave", handlePanEnd);
  track.addEventListener("touchstart", handlePanStart, { passive: true });
  track.addEventListener("touchmove", handlePanMove, { passive: false });
  track.addEventListener("touchend", handlePanEnd);

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    scrollToIndex(currentIndex() - 1);
  });
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    scrollToIndex(currentIndex() + 1);
  });

  updateDots();
}

function initProjectModal() {
  const modal = document.getElementById("project-modal");
  const track = document.getElementById("modal-track");
  const dotsContainer = document.getElementById("modal-dots");
  const titleEl = document.getElementById("modal-title");
  const metaEl = document.getElementById("modal-meta");
  const descEl = document.getElementById("modal-desc");
  const tagsEl = document.getElementById("modal-tags");
  const closeBtn = modal.querySelector(".project-modal__close");
  const prevBtn = modal.querySelector(".project-modal__arrow--prev");
  const nextBtn = modal.querySelector(".project-modal__arrow--next");
  const carouselWrap = modal.querySelector(".project-modal__carousel");

  let slides = [];
  let dots = [];
  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX, startY;

  function resetZoom() {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    carouselWrap.classList.remove("has-zoom");
    slides.forEach((img) => {
      img.classList.remove("is-zoomed");
      img.style.transform = "";
    });
  }

  function applyZoom(img) {
    if (zoomScale > 1) {
      img.classList.add("is-zoomed");
      carouselWrap.classList.add("has-zoom");
    } else {
      img.classList.remove("is-zoomed");
      carouselWrap.classList.remove("has-zoom");
    }
    img.style.transform = `scale(${zoomScale}) translate(${panX}px, ${panY}px)`;
  }

  function scrollToIndex(index) {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    resetZoom();
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

  function handleWheel(e) {
    const currentImg = slides[currentIndex()];
    if (!currentImg) return;

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomScale = Math.min(zoomScale + 0.15, 4);
      } else {
        zoomScale = Math.max(zoomScale - 0.15, 1);
        if (zoomScale === 1) { panX = 0; panY = 0; }
      }
      applyZoom(currentImg);
    } else {
      if (zoomScale > 1) return;
      if (e.deltaY > 0) {
        scrollToIndex(currentIndex() + 1);
      } else if (e.deltaY < 0) {
        scrollToIndex(currentIndex() - 1);
      }
    }
  }

  function handleDoubleClick(e) {
    if (zoomScale > 1) {
      resetZoom();
    } else {
      zoomScale = 2;
      panX = 0;
      panY = 0;
      const currentImg = slides[currentIndex()];
      if (currentImg) {
        const rect = currentImg.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        panX = -x * 50;
        panY = -y * 50;
        applyZoom(currentImg);
      }
    }
  }

  function handlePanStart(e) {
    if (zoomScale <= 1) return;
    isPanning = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) - panX;
    startY = (e.touches ? e.touches[0].clientY : e.clientY) - panY;
  }

  function handlePanMove(e) {
    if (!isPanning) return;
    e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    panX = x - startX;
    panY = y - startY;
    const currentImg = slides[currentIndex()];
    if (currentImg) applyZoom(currentImg);
  }

  function handlePanEnd() {
    isPanning = false;
  }

  function openModal(cardEl) {
    const images = Array.from(cardEl.querySelectorAll(".carousel__track img"));
    const title = cardEl.querySelector(".project-card__title")?.textContent || "";
    const meta = cardEl.querySelector(".project-card__meta")?.textContent || "";
    const desc = cardEl.querySelector(".project-card__desc")?.textContent || "";
    const tags = cardEl.querySelector(".project-card__tags")?.textContent || "";

    track.innerHTML = "";
    dotsContainer.innerHTML = "";
    resetZoom();

    images.forEach((img) => {
      const clone = document.createElement("img");
      clone.src = img.src;
      clone.alt = img.alt;
      track.appendChild(clone);
    });

    slides = Array.from(track.children);

    slides.forEach((img) => {
      img.addEventListener("dblclick", handleDoubleClick);
      img.addEventListener("mousedown", handlePanStart);
      img.addEventListener("touchstart", handlePanStart, { passive: true });
    });

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot-btn";
      dot.setAttribute("aria-label", `Ir a la imagen ${i + 1}`);
      dot.addEventListener("click", () => scrollToIndex(i));
      dotsContainer.appendChild(dot);
    });
    dots = Array.from(dotsContainer.children);

    titleEl.textContent = title;
    metaEl.textContent = meta;
    descEl.textContent = desc;
    tagsEl.textContent = tags;

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    updateDots();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    resetZoom();
  }

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateDots);
  }, { passive: true });

  track.addEventListener("wheel", handleWheel, { passive: false });
  track.addEventListener("mousemove", handlePanMove);
  track.addEventListener("mouseup", handlePanEnd);
  track.addEventListener("mouseleave", handlePanEnd);
  track.addEventListener("touchmove", handlePanMove, { passive: false });
  track.addEventListener("touchend", handlePanEnd);

  closeBtn.addEventListener("click", closeModal);
  prevBtn.addEventListener("click", () => scrollToIndex(currentIndex() - 1));
  nextBtn.addEventListener("click", () => scrollToIndex(currentIndex() + 1));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") scrollToIndex(currentIndex() - 1);
    if (e.key === "ArrowRight") scrollToIndex(currentIndex() + 1);
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".carousel__arrow")) return;
      openModal(card);
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
  initProjectModal();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
