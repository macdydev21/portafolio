/* ---------- Notificador de visitas por Telegram ----------
   1. En Telegram, busca "@BotFather" y envíale: /newbot
      Sigue las instrucciones (nombre del bot) y copia el "token" que te da,
      se ve así: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   2. Abre un chat con TU nuevo bot y envíale cualquier mensaje (ej: "hola").
   3. En el navegador, visita (reemplazando TU_TOKEN):
      https://api.telegram.org/botTU_TOKEN/getUpdates
      Busca en el JSON el número "chat":{"id": ...} — ese es tu CHAT_ID.
   4. Pega ambos valores abajo y guarda el archivo. Listo.

   Nota de seguridad: este token queda visible en el código fuente de la
   página (cualquiera que abra "Ver código fuente" podría verlo). El único
   riesgo real es que alguien podría usarlo para mandar mensajes molestos a
   este chat de Telegram — no compromete tu cuenta ni nada más. Si eso pasa,
   simplemente genera un token nuevo con @BotFather (/revoke o /newbot). */
const TELEGRAM_BOT_TOKEN = "8506152978:AAFiUKA5YwRHQEJC-YT2Qp7GXIenfQTkHbk";
const TELEGRAM_CHAT_ID = "8792294174";

function initVisitNotifier() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const page = window.location.pathname.split("/").pop() || "inicio";
  const referrer = document.referrer ? new URL(document.referrer).hostname : "directo/desconocido";
  const now = new Date().toLocaleString("es-CU", { timeZone: "America/Havana" });

  const text =
    `👀 Nueva visita a tu portafolio\n` +
    `📄 Página: ${page}\n` +
    `🔗 Viene de: ${referrer}\n` +
    `🕒 Hora (Cuba): ${now}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    + `?chat_id=${encodeURIComponent(TELEGRAM_CHAT_ID)}`
    + `&text=${encodeURIComponent(text)}`;

  fetch(url).catch(() => {});
}

const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const CAROUSEL_AUTOPLAY_MS = 3200;
const MODAL_AUTOPLAY_MS = 4000;

/* ---------- Tema y utilidades globales ---------- */
function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function currentLang() {
  return document.documentElement.lang === "en" ? "en" : "es";
}

/* ---------- Sonidos sutiles de interfaz (sintetizados, sin archivos externos) ---------- */
let audioCtx = null;

function isSoundMuted() {
  try {
    return localStorage.getItem("soundMuted") === "true";
  } catch (e) {
    return false;
  }
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone({ freq, glideTo, duration = 0.15, type = "sine", volume = 0.06, delay = 0 }) {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNavigateSound() {
  if (currentTheme() === "light") {
    playTone({ freq: 520, glideTo: 780, duration: 0.14, type: "triangle", volume: 0.11 });
  } else {
    playTone({ freq: 320, glideTo: 560, duration: 0.16, type: "sine", volume: 0.09 });
  }
}

function playOpenSound() {
  if (currentTheme() === "light") {
    playTone({ freq: 880, duration: 0.1, type: "sine", volume: 0.12 });
    playTone({ freq: 1318.5, duration: 0.18, type: "sine", volume: 0.09, delay: 0.09 });
  } else {
    playTone({ freq: 660, glideTo: 880, duration: 0.09, type: "triangle", volume: 0.13 });
    playTone({ freq: 1320, duration: 0.08, type: "sine", volume: 0.08, delay: 0.05 });
  }
}

function playCopySound() {
  if (currentTheme() === "light") {
    playTone({ freq: 1046.5, duration: 0.08, type: "sine", volume: 0.08 });
  } else {
    playTone({ freq: 900, glideTo: 1100, duration: 0.07, type: "sine", volume: 0.07 });
  }
}

function playCloseSound() {
  if (currentTheme() === "light") {
    playTone({ freq: 1318.5, duration: 0.08, type: "sine", volume: 0.1 });
    playTone({ freq: 880, duration: 0.14, type: "sine", volume: 0.08, delay: 0.07 });
  } else {
    playTone({ freq: 880, glideTo: 600, duration: 0.11, type: "triangle", volume: 0.12 });
  }
}

/* "Pasar página" al navegar entre fotos de un carrusel con flechas/puntos/teclado */
function playSwipeSound(direction = 1) {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const light = currentTheme() === "light";
  const base = light ? 1500 : 1150;
  const start = direction >= 0 ? base * 0.82 : base * 1.18;
  const end = direction >= 0 ? base * 1.18 : base * 0.82;
  const duration = 0.13;
  const now = ctx.currentTime;

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(start, now);
  filter.frequency.exponentialRampToValueAtTime(end, now + duration);

  const gain = ctx.createGain();
  const volume = light ? 0.06 : 0.05;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration + 0.02);
}

function initSoundEffects() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const targetId = link.getAttribute("href").slice(1);
    if (!targetId || !document.getElementById(targetId)) return;
    link.addEventListener("click", () => playNavigateSound());
  });
}

const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
const ICON_MENU_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';

function initSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;
  function refresh() {
    const muted = isSoundMuted();
    btn.innerHTML = muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
    const label = muted
      ? (currentLang() === "en" ? "Unmute sound" : "Activar sonido")
      : (currentLang() === "en" ? "Mute sound" : "Silenciar sonido");
    btn.setAttribute("aria-label", label);
  }
  btn.addEventListener("click", () => {
    try {
      localStorage.setItem("soundMuted", (!isSoundMuted()).toString());
    } catch (e) {}
    refresh();
  });
  refresh();
  document.addEventListener("languagechange:app", refresh);
}

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#2563eb" : "#0b0d12");
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  function refresh() {
    const theme = currentTheme();
    btn.innerHTML = theme === "light" ? ICON_MOON : ICON_SUN;
    const label = theme === "light"
      ? (currentLang() === "en" ? "Switch to dark theme" : "Cambiar a tema oscuro")
      : (currentLang() === "en" ? "Switch to light theme" : "Cambiar a tema claro");
    btn.setAttribute("aria-label", label);
  }
  btn.addEventListener("click", () => {
    const next = currentTheme() === "light" ? "dark" : "light";
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    applyTheme(next);
    refresh();
  });
  refresh();
  document.addEventListener("languagechange:app", refresh);
}

const TAG_ICONS = {
  "#Odoo": "images/icons/odoo.webp",
  "#React": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "#NodeJS": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  "#Python": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "#PostgreSQL": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  "#Docker": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
};

const TAG_TRANSLATIONS_EN = {
  "#Integraciones": "#Integrations",
  "#Migraciones": "#Migrations",
  "#Facturación": "#Invoicing",
  "#Seguridad": "#Security",
  "#Lealtad": "#Loyalty",
  "#Asistencia": "#Attendance",
  "#RecursosHumanos": "#HR",
  "#IA": "#AI",
  "#Inventario": "#Inventory",
};

function translateTag(tag) {
  if (currentLang() !== "en") return tag;
  return TAG_TRANSLATIONS_EN[tag] || tag;
}

function renderTagChips(el) {
  if (!el) return;
  const raw = (el.dataset.raw ?? el.textContent).trim();
  if (!raw) return;
  el.dataset.raw = raw;
  el.innerHTML = "";
  raw.split(/\s+/).filter(Boolean).forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    const iconSrc = TAG_ICONS[tag];
    if (iconSrc) {
      const img = document.createElement("img");
      img.src = iconSrc;
      img.alt = "";
      img.className = "tag-chip__icon";
      chip.appendChild(img);
    }
    const label = document.createElement("span");
    label.textContent = translateTag(tag);
    chip.appendChild(label);
    el.appendChild(chip);
  });
  el.dataset.chipified = "true";
}

function refreshAllTagChips() {
  document.querySelectorAll(".project-card__tags, .project-modal__tags").forEach(renderTagChips);
}

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

  let autoplayTimer = null;

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    if (PREFERS_REDUCED_MOTION || slides.length <= 1 || zoomScale > 1) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      scrollToIndex((currentIndex() + 1) % slides.length);
    }, CAROUSEL_AUTOPLAY_MS);
  }

  dotsContainer.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot-btn";
    dot.setAttribute("aria-label", `Ir a la imagen ${i + 1}`);
    dot.addEventListener("click", () => {
      playSwipeSound(i >= currentIndex() ? 1 : -1);
      scrollToIndex(i);
      startAutoplay();
    });
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  function scrollToIndex(index) {
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    resetZoom();
    track.scrollTo({ left: slides[clamped].offsetLeft, behavior: "smooth" });
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
    playSwipeSound(-1);
    scrollToIndex(currentIndex() - 1);
    startAutoplay();
  });
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    playSwipeSound(1);
    scrollToIndex(currentIndex() + 1);
    startAutoplay();
  });

  carouselEl.addEventListener("mouseenter", stopAutoplay);
  carouselEl.addEventListener("mouseleave", startAutoplay);
  carouselEl.addEventListener("touchstart", stopAutoplay, { passive: true });

  updateDots();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startAutoplay();
        else stopAutoplay();
      });
    }, { threshold: 0.2 }).observe(carouselEl);
  } else {
    startAutoplay();
  }
}

function initProjectModal() {
  const modal = document.getElementById("project-modal");
  if (!modal) return;
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
  let autoplayTimer = null;

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    if (PREFERS_REDUCED_MOTION || slides.length <= 1 || zoomScale > 1) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      scrollToIndex((currentIndex() + 1) % slides.length);
    }, MODAL_AUTOPLAY_MS);
  }

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
    track.scrollTo({ left: slides[clamped].offsetLeft, behavior: "smooth" });
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
    const tagsEl_source = cardEl.querySelector(".project-card__tags");
    const tags = tagsEl_source?.dataset.raw || tagsEl_source?.textContent || "";

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
      dot.addEventListener("click", () => {
        scrollToIndex(i);
        startAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
    dots = Array.from(dotsContainer.children);

    titleEl.textContent = title;
    metaEl.textContent = meta;
    descEl.textContent = desc;
    tagsEl.textContent = tags;
    delete tagsEl.dataset.raw;
    delete tagsEl.dataset.chipified;
    renderTagChips(tagsEl);

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    updateDots();
    startAutoplay();
    playOpenSound();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    resetZoom();
    stopAutoplay();
    playCloseSound();
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
  prevBtn.addEventListener("click", () => {
    playSwipeSound(-1);
    scrollToIndex(currentIndex() - 1);
    startAutoplay();
  });
  nextBtn.addEventListener("click", () => {
    playSwipeSound(1);
    scrollToIndex(currentIndex() + 1);
    startAutoplay();
  });

  carouselWrap.addEventListener("mouseenter", stopAutoplay);
  carouselWrap.addEventListener("mouseleave", startAutoplay);
  carouselWrap.addEventListener("touchstart", stopAutoplay, { passive: true });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") { playSwipeSound(-1); scrollToIndex(currentIndex() - 1); startAutoplay(); }
    if (e.key === "ArrowRight") { playSwipeSound(1); scrollToIndex(currentIndex() + 1); startAutoplay(); }
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".carousel__arrow")) return;
      openModal(card);
    });
  });
}

/* ---------- Traducción ES/EN ---------- */
const TRANSLATIONS_EN = {
  "nav-about": `About`,
  "nav-experience": `Experience`,
  "nav-projects": `Projects`,
  "nav-skills": `Skills`,
  "nav-education": `Education`,
  "nav-contact": `Contact`,
  "cta-download-cv": `Download CV`,
  "hero-tagline": `Passionate about turning ideas into software solutions`,
  "hero-subtitle": `Specialized in <strong>Odoo</strong> and web development — Python · JavaScript · React · ORM · QWeb · OWL Framework`,
  "badge-remote": `🌎 100% Remote`,
  "badge-experience": `🚀 ~3 years of experience`,
  "badge-countries": `🤝 Clients &amp; work in 6 countries`,
  "cta-view-projects": `View projects`,
  "cta-contact": `Contact`,
  "aria-send-email": `Send email`,
  "aria-call-phone": `Call`,
  "aria-linkedin": `LinkedIn profile`,
  "aria-github": `GitHub profile`,
  "copy-email": `Copy email`,
  "tech-label": `Technologies I work with`,
  "stat-years": `Years of experience`,
  "stat-countries": `Countries with clients &amp; work`,
  "stat-projects": `Projects &amp; Odoo modules`,
  "stat-remote": `Remote work`,
  "about-title": `About me`,
  "about-text": `Fullstack Developer passionate about turning ideas into software solutions, with
        almost three years of experience in Python, JavaScript, React and Node.js. Specialized in the
        <strong>Odoo</strong> ecosystem (ORM, QWeb, OWL Framework) across versions 14 to 19: Point of
        Sale, Invoicing, Sales, Accounting, Purchasing, Fleet, Employees, Contacts and Attendance
        modules, plus reports, integrations, migrations and 3 tax localizations implemented
        (Honduras, El Salvador and Guatemala). 100% remote career
        with clients in Spain, Panama, Honduras, Mexico, Peru and the United States, backed by my own
        solar power system, stable internet and a well-equipped PC that guarantee continuous
        availability.`,
  "exp-title": `Professional Experience`,
  "exp-hint": `Remote career alongside clients and teams from different countries`,
  "order-label": `Order:`,
  "order-desc": `Most recent first`,
  "order-asc": `Oldest first`,

  "exp1-date": `Aug 2026 – Sep 2026`,
  "exp1-title": `Fullstack Developer — Salvha (Print Shop, Custom ERP)`,
  "exp1-place": `Freelance · Direct client · Peru · Odoo 18`,
  "exp1-desc": `Attendance module with photos, facial recognition (face-api.js) and geolocation that
              <strong>strengthened daily staff control</strong>; facial verification and digital signature
              in the sales process, <strong>improving traceability and security of every
              transaction</strong>; a Google reviews widget via SerpApi to <strong>reinforce trust with new
              customers</strong>; quick-call, WhatsApp buttons and a promo popup that <strong>boosted
              customer acquisition</strong>; and fixed asset conflicts in a third-party theme, removing
              duplicates and CDN dependencies.`,

  "exp2-date": `Jun 2026 – Jul 2026`,
  "exp2-title": `Fullstack Developer — Direct Client (ERP/Odoo)`,
  "exp2-place": `Freelance · Mexico · Odoo 19`,
  "exp2-desc": `Improvements to the Odoo POS terminal —pre-order printing and a second printer— that
              <strong>sped up customer service at checkout</strong>; and an OWL patch with debounce and
              mutex over the native sync that <strong>prevented race conditions and manual reloads</strong>.`,

  "exp3-date": `Jan 2026 – Feb 2026`,
  "exp3-title": `Fullstack Developer — Direct Client (ERP/Odoo)`,
  "exp3-place": `Freelance · Honduras · Odoo 18`,
  "exp3-desc": `E-invoicing module in Python, QWeb and OWL, adapting the Point of Sale to Honduras' tax
              localization and <strong>ensuring tax compliance with the Honduran tax authorities</strong>.`,

  "exp4-date": `Oct 2025 – Jul 2026`,
  "exp4-title": `Fullstack Developer — Sherwood Forest, S.A. (ERP/Odoo)`,
  "exp4-place": `Part-Time Collaborator · Panama City, Panama · Odoo 18`,
  "exp4-desc": `Point of Sale and receipt customization coordinating priorities with the Project
              Manager, <strong>improving the efficiency of the sales process</strong>; Excel (xlsxwriter)
              and PDF reports that <strong>sped up access to key information for the management
              team</strong>; digitally signed e-invoicing for Honduras, El Salvador (DTE) and Guatemala
              (FEL), <strong>ensuring regulatory compliance in each country</strong>; and an Odoo
              instance-to-instance sync module via XML-RPC that <strong>optimized multi-branch
              operations</strong>.`,

  "exp5-date": `Jul 2024 – Mar 2026`,
  "exp5-title": `Fullstack Developer — JUMO Technologies S.L. (ERP/Odoo)`,
  "exp5-place": `Full-Time · Barcelona, Spain · Odoo 14 to 18`,
  "exp5-desc": `Custom modules and customization of standard modules (Contacts, Sales, Purchase,
              Inventory, Accounting and Fleet) that <strong>adapted the ERP to the business'
              needs</strong>; Point of Sale and receipt customization with OWL/QWeb for reservations,
              kitchen management and order issuing, <strong>speeding up daily operations</strong>;
              migrations between Odoo versions (14 to 18) <strong>with no data loss</strong>; advanced
              Excel and QWeb reports that <strong>made decision-making easier</strong>; Krossbooking and
              Amazon Seller integration via REST APIs and cron jobs that <strong>automated reservations,
              invoicing and inventory sync</strong>; and customization of the Attendance, Contacts and
              Fleet modules, <strong>strengthening control across Helpdesk-linked locations and vehicle
              repairs</strong>.`,

  "exp6-date": `Apr 2024 – Jun 2024`,
  "exp6-title": `Fullstack Developer — Direct Client (ERP/Odoo)`,
  "exp6-place": `Freelance · Havana, Cuba · Odoo 16 and 17`,
  "exp6-desc": `Adaptation of standard Odoo modules (ORM and XML views) to the client's requirements,
              <strong>fitting the ERP to their internal processes</strong>; custom PDF reports with QWeb
              that <strong>improved the presentation of key business information</strong>; and a
              server-to-server Odoo connection module via XML-RPC with Docker, <strong>standardizing the
              environment and speeding up deployment</strong>.`,

  "exp7-date": `Sep 2023 – Dec 2023`,
  "exp7-title": `Fullstack Developer — Direct Client`,
  "exp7-place": `Freelance · Miami, United States`,
  "exp7-desc": `Web-based flight booking system with React on the frontend and Node.js on the backend
              that <strong>digitized and streamlined the booking process</strong>.`,

  "exp8-date": `Mar 2021 – May 2021`,
  "exp8-title": `Java Developer — Direct Client`,
  "exp8-place": `Freelance · Holguín, Cuba`,
  "exp8-desc": `Desktop system in Java (Swing) with MySQL to manage users and services on an intranet
              network, <strong>centralizing its administration</strong>; and a real-time network monitoring
              app based on MAC addresses that <strong>quickly detected network failures</strong>, such as a
              switch going down.`,

  "proj-title": `Projects`,
  "proj-hint": `Choose a category and swipe each gallery to see more images`,
  "tab-odoo": `Odoo Development`,
  "tab-web": `Web Development`,
  "filter-all": `All`,

  "proj1-title": `Krossbooking + Odoo Integration`,
  "proj1-desc": `The property owners renting out their rooms spent hours manually copying
                reservations and reconciling payments between Krossbooking and the ERP. I built a
                REST API integration that syncs
                reservations, invoices automatically and reconciles payments, cutting the time spent
                on these tasks by around 30% compared to the manual process.`,

  "proj2-title": `Data Migration from Excel`,
  "proj2-desc": `Manually setting up a new business in Odoo (hundreds of products, images, employees,
                customers, vendors, categories, accounting entries) could take days and was
                error-prone. I built an import wizard with 20+ dedicated actions per data type
                directly from Excel, getting a client's full catalog operational in hours instead of
                days.`,

  "proj3-title": `Restaurant POS Customization — Glop`,
  "proj3-desc": `Waiters and kitchen staff communicated orders by shouting, with no visibility into
                which dishes were pending, in progress or ready. I designed a per-station kitchen
                display system (KDS) with a "To cook → Cooking → Ready" board and automatic routing
                of each product to its kitchen, speeding up service and reducing order mistakes.`,

  "proj4-title": `Attendance &amp; Absences Module`,
  "proj4-desc": `HR had no reliable way to distinguish between a finished shift, breaks and
                incident-related absences when calculating hours worked. I implemented a clock-in
                flow that requires selecting the exact reason for each check-out (end of shift,
                break, rest or medical/personal incident), rolled up into a grid view with total
                hours per employee and day, ready for payroll.`,

  "proj5-title": `Invoicing &amp; POS — Honduras Tax Localization`,
  "proj5-desc": `The business needed to invoice legally per Honduras' SAR requirements (C.A.I.
                authorization, 15%/18% ISV breakdown, authorized ranges), both on the invoice and the
                Point of Sale receipt. I built the fiscal document engine that generates invoices and
                POS receipts in the required format, ensuring regulatory compliance with no extra
                manual steps.`,

  "proj6-title": `Tax Localization — El Salvador`,
  "proj6-desc": `The Ministry of Finance requires signed electronic invoices (DTE), but its system
                can go down at any moment and halt sales. I integrated the DIGIFACT API
                (authentication, sealing and DTE submission) with an automatic contingency mode for
                when the MH system is unavailable, ensuring the business never stops invoicing or
                stays compliant with the law.`,

  "proj7-title": `DTE/FEL Tax Localization — Guatemala`,
  "proj7-desc": `Guatemala's SAT requires every sale to issue a certified Electronic Tax Document
                (FEL), even from the Point of Sale. I implemented the full FEL integration (test and
                production environments, issuer NIT, subsidiaries) so every POS ticket and invoice
                comes out already certified, with its authorization code visible on the customer's
                own receipt.`,

  "proj8-title": `Manager Authorization for Discounts`,
  "proj8-desc": `Cashiers could apply any discount in the POS with no control, risking the business'
                margin. I developed a mechanism that compares the discount against a configurable
                limit (e.g. 45%) and, when exceeded, blocks the sale until an authorized manager
                enters their PIN, giving real control over who can approve larger markdowns.`,

  "proj9-title": `Fixed-Price Loyalty Program`,
  "proj9-desc": `Odoo's standard loyalty engine only rewards with discounts or free products, but
                the client wanted to let customers redeem points for specific products at a fixed
                price. I added a new "Fixed Price" reward type with eligible-product rules,
                integrated into the POS ticket, enabling a promotion that was previously impossible
                with the out-of-the-box configuration.`,

  "proj10-title": `Social Media Buttons Widget`,
  "proj10-desc": `The marketing team needed to add and adjust direct-contact buttons (call,
                WhatsApp) on the site without depending on a developer every time. I built a native
                block for Odoo's Website Builder, configurable from the editor itself (position,
                shape, social network and multiple WhatsApp numbers), giving the marketing team full
                autonomy.`,

  "proj11-title": `Interactive Popup Widget`,
  "proj11-desc": `Generic lead-capture popups tend to be invasive and end up annoying visitors. I
                designed a "Smart Popup" for Odoo's Website Builder with configurable position, size
                and reappearance frequency, plus two direct-contact buttons (WhatsApp and email),
                achieving a useful touchpoint without overloading the browsing experience.`,

  "proj12-title": `Google Reviews Widget`,
  "proj12-desc": `A business with great Google reviews wasn't leveraging them on its own site,
                missing out on social proof for new visitors. I developed a widget that pulls real
                reviews (via SerpApi, with Google Places/Business Profile as alternatives) and
                displays them on the online store, with a settings panel and manual sync from
                Settings, reinforcing trust on the business' page.`,

  "proj16-title": `Barcode Tool Tracking`,
  "proj16-desc": `The workshop had no way to know which tool each employee currently had, or to
                catch when a tool came back from someone other than who the records said had taken it.
                I built a Barcode app for Tool Tracking inside Odoo — a full-screen OWL screen,
                following the same logic as Odoo's native Barcode app: pick the operation type and
                employee, scan the tool's serial number with a USB/Bluetooth reader or the device's
                camera, and on confirm the matching internal transfer is created and validated
                automatically. If a tool comes back from a different employee than the one on record, it
                doesn't block the operation but instantly flags the mismatch, giving full traceability of
                loans and returns without slowing down daily work. Covered by automated tests
                (TransactionCase).`,

  "proj13-title": `Flight Booking Web System`,
  "proj13-desc": `The agency managed bookings, passengers and payments by hand, with no clear
                visibility into profits or debt owed to wholesalers. I built a fullstack platform —
                React, Vite and Tailwind CSS with TanStack Query and Axios on the frontend; Node.js,
                Express and Prisma over PostgreSQL on the backend, with JWT auth and admin/salesperson
                roles — with a real-time dashboard for sales, costs, profit, pending bookings,
                customer balances and vendor debt. Its core is an append-only accounting ledger (every
                movement locks the entity's row before reading its balance, preventing race
                conditions between simultaneous sales).`,

  "proj14-title": `JobRadar — AI-Powered Job Search Automation`,
  "proj14-desc": `Manually checking dozens of job boards every day, without missing offers that
                truly match your profile, is a job in itself. I built a hybrid app — a Python desktop
                client (PySide6 + qt-material) and a React web app, sharing the same SQLite database
                through a Node.js/Express API (better-sqlite3) — that automates the job search with
                artificial intelligence: it crawls RemoteOK, WeWorkRemotely, Computrabajo, InfoJobs
                and Google Custom Search, extracts the resume text (pypdf, python-docx) and scores
                each listing by combining keyword matching with AI (Anthropic Claude API), notifying
                only real matches via Telegram. A market-analysis panel scans live job postings and
                shows which technologies recruiters ask for most and which ones are worth learning.`,

  "proj15-title": `MultiDown — Cross-Platform Video &amp; Audio Downloader`,
  "proj15-desc": `Downloading a video or an entire playlist from YouTube, Facebook, Instagram or
                TikTok usually means pasting the link into ad-filled, untrustworthy third-party
                sites. I built MultiDown, a web app (React with Vite on the frontend, Node.js and
                Express on the backend) that wraps yt-dlp to list the available video and audio
                qualities, automatically mux a video with no audio with the best available track
                (FFmpeg), and download entire playlists packed into a ZIP (archiver). It includes
                keyword or hashtag search depending on the platform, and a local download history
                with thumbnail, quality and date.`,

  "skills-title": `Skills`,
  "skills-hint": `Technologies and skills applied in real projects`,
  "skill-label-frontend": `Frontend &amp; Web`,
  "skill-label-backend": `Backend &amp; Databases`,
  "skill-label-odoo": `Odoo Specialization`,
  "skill-label-vc": `Version Control &amp; AI`,
  "skill-label-methodologies": `Methodologies`,
  "skill-label-soft": `Soft Skills`,
  "chip-odoo-orm": `Odoo ORM`,
  "chip-pos": `Point of Sale (POS)`,
  "chip-migrations": `Migrations (Odoo 14 to 19)`,
  "chip-tax-loc": `Tax Localizations`,
  "chip-ext-int": `External Integrations`,
  "chip-adv-reports": `Advanced Reports`,
  "chip-ai-agents": `AI Agents`,
  "chip-async-remote": `Asynchronous Remote Work`,
  "chip-client-comm": `Client Communication`,
  "chip-self-mgmt": `Self-management`,
  "chip-user-training": `User Training`,
  "chip-problem-solving": `Problem Solving`,
  "chip-adaptability": `Adaptability`,

  "edu-title": `Education`,
  "edu1-title": `Self-Taught in Development and Programming`,
  "edu1-meta": `Holguín, Cuba · Since September 2020`,
  "edu1-desc": `Continuous learning through online courses, tutorials and hands-on projects:
            programming logic, data structures and Java, web development (HTML, CSS, JavaScript,
            React) and, since 2024, specialization in Python and JavaScript applied to the Odoo
            ecosystem. More recently, studying artificial intelligence applied to software
            development, including AI agents and tools like Claude Code.`,
  "edu2-title": `Computer Science Engineering`,
  "edu2-meta": `University of Informatics Sciences (UCI) · Havana, Cuba · 2021–2023`,
  "edu2-desc": `Training in programming logic, data structures, databases and software engineering
            fundamentals.`,

  "contact-page-title": `Let's talk about your project`,
  "contact-page-hint": `Pick whichever channel you prefer — email or WhatsApp — and I'll get back to you as soon as possible.`,

  "footer-title": `Interested in turning your idea into a digital or software solution?`,
  "footer-subtitle": `Available for freelance projects and full-time collaborations, 100% remote,
      in Odoo, web development and process automation.`,
  "footer-email-btn": `Email me`,
  "footer-whatsapp-btn": `Message me on WhatsApp`,
  "aria-whatsapp-float": `Message me on WhatsApp`,
  "aria-mail-float": `Email me`,
  "aria-modal-label": `Project details`,
  "aria-modal-close": `Close`,
  "aria-carousel-prev": `Previous image`,
  "aria-carousel-next": `Next image`,
  "back-to-top": `Back to top`,
  "cursor-view": `View`,
};

function applyI18nText(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (lang === "en") {
      if (el.dataset.esOriginal === undefined) el.dataset.esOriginal = el.innerHTML;
      if (TRANSLATIONS_EN[key] !== undefined) el.innerHTML = TRANSLATIONS_EN[key];
    } else if (el.dataset.esOriginal !== undefined) {
      el.innerHTML = el.dataset.esOriginal;
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (lang === "en") {
      if (el.dataset.esAria === undefined) el.dataset.esAria = el.getAttribute("aria-label") || "";
      if (TRANSLATIONS_EN[key] !== undefined) el.setAttribute("aria-label", TRANSLATIONS_EN[key]);
    } else if (el.dataset.esAria !== undefined) {
      el.setAttribute("aria-label", el.dataset.esAria);
    }
  });
}

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  applyI18nText(lang);
  refreshAllTagChips();
  document.querySelectorAll(".tech-filter__btn[data-tag]").forEach((btn) => {
    btn.textContent = translateTag(btn.dataset.tag);
  });
  try {
    localStorage.setItem("lang", lang);
  } catch (e) {}
  document.dispatchEvent(new CustomEvent("languagechange:app", { detail: { lang } }));
}

function initLangToggle() {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;
  function refresh() {
    const lang = currentLang();
    btn.textContent = lang === "en" ? "EN" : "ES";
    btn.setAttribute("aria-label", lang === "en" ? "Cambiar a español" : "Switch to English");
  }
  btn.addEventListener("click", () => {
    applyLanguage(currentLang() === "en" ? "es" : "en");
    refresh();
  });
  if (currentLang() === "en") applyLanguage("en");
  refresh();
}

/* ---------- Filtro de tecnologías en Proyectos ---------- */
function initTechFilters() {
  document.querySelectorAll(".tech-filter[data-panel]").forEach((bar) => {
    const panel = document.getElementById(bar.dataset.panel);
    if (!panel) return;
    const cards = Array.from(panel.querySelectorAll(".project-card"));
    const tagSet = new Set();
    cards.forEach((card) => {
      const raw = card.querySelector(".project-card__tags")?.dataset.raw || "";
      raw.split(/\s+/).filter(Boolean).forEach((t) => tagSet.add(t));
    });
    if (tagSet.size <= 1) return;

    bar.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "tech-filter__btn is-active";
    allBtn.dataset.i18n = "filter-all";
    allBtn.textContent = "Todos";
    bar.appendChild(allBtn);

    const tagButtons = Array.from(tagSet).sort().map((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tech-filter__btn";
      btn.dataset.tag = tag;
      btn.textContent = translateTag(tag);
      bar.appendChild(btn);
      return btn;
    });

    function setActive(target) {
      [allBtn, ...tagButtons].forEach((b) => b.classList.toggle("is-active", b === target));
    }

    function applyFilter(tag) {
      cards.forEach((card) => {
        const raw = card.querySelector(".project-card__tags")?.dataset.raw || "";
        card.style.display = !tag || raw.split(/\s+/).includes(tag) ? "" : "none";
      });
    }

    allBtn.addEventListener("click", () => { setActive(allBtn); applyFilter(null); });
    tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => { setActive(btn); applyFilter(btn.dataset.tag); });
    });
  });
}

/* ---------- Máquina de escribir del rol en el hero ---------- */
const HERO_ROLES = {
  es: ["Desarrollador Fullstack", "Desarrollador Odoo Fullstack"],
  en: ["Fullstack Developer", "Odoo Fullstack Developer"],
};

function initHeroTypewriter() {
  const container = document.querySelector(".hero__role");
  const textEl = document.getElementById("hero-role-text");
  if (!container || !textEl) return;

  function updateAriaLabel() {
    container.setAttribute("aria-label", HERO_ROLES[currentLang()].join(" — "));
  }

  if (PREFERS_REDUCED_MOTION) {
    function renderStatic() {
      textEl.textContent = HERO_ROLES[currentLang()].join("   |   ");
      updateAriaLabel();
    }
    renderStatic();
    document.addEventListener("languagechange:app", renderStatic);
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timer = null;

  function tick() {
    const roles = HERO_ROLES[currentLang()];
    const current = roles[roleIndex % roles.length];
    if (!deleting) {
      charIndex++;
      textEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        timer = setTimeout(tick, 1800);
        return;
      }
      timer = setTimeout(tick, 55);
    } else {
      charIndex--;
      textEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex++;
        timer = setTimeout(tick, 400);
        return;
      }
      timer = setTimeout(tick, 30);
    }
  }

  function restart() {
    clearTimeout(timer);
    charIndex = 0;
    deleting = false;
    updateAriaLabel();
    tick();
  }

  updateAriaLabel();
  tick();
  document.addEventListener("languagechange:app", restart);
}

/* ---------- Copiar correo ---------- */
function initCopyEmail() {
  const btn = document.getElementById("copy-email-btn");
  if (!btn) return;
  const email = "macdielagm@gmail.com";
  let resetTimer = null;
  btn.innerHTML = ICON_COPY;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch (e) {
      return;
    }
    playCopySound();
    btn.classList.add("is-copied");
    btn.innerHTML = ICON_CHECK;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      btn.classList.remove("is-copied");
      btn.innerHTML = ICON_COPY;
    }, 1600);
  });
}

/* ---------- Parallax sutil del avatar ---------- */
function initAvatarParallax() {
  if (PREFERS_REDUCED_MOTION) return;
  const hero = document.querySelector(".hero");
  const wrap = document.querySelector(".hero__avatar-wrap");
  if (!hero || !wrap) return;
  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
    const dy = (e.clientY - (rect.top + rect.height / 3)) / rect.height;
    wrap.style.setProperty("--px", `${dx * 10}px`);
    wrap.style.setProperty("--py", `${dy * 10}px`);
  });
  hero.addEventListener("mouseleave", () => {
    wrap.style.setProperty("--px", "0px");
    wrap.style.setProperty("--py", "0px");
  });
}

/* ---------- Cursor personalizado "Ver" en carruseles ---------- */
function initCustomCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const cursor = document.getElementById("custom-cursor");
  if (!cursor) return;
  let raf = null;
  let x = 0;
  let y = 0;

  document.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      raf = null;
    });
  });

  document.querySelectorAll(".project-card .carousel__track").forEach((track) => {
    track.addEventListener("mouseenter", () => cursor.classList.add("is-visible"));
    track.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
  });
}

/* ---------- Volver arriba ---------- */
/* ---------- Animación del logo "</>" -> "<macdydev21/>" ---------- */
function initBrandAnimation() {
  const brand = document.getElementById("navbar-brand");
  if (!brand) return;
  const delay = PREFERS_REDUCED_MOTION ? 0 : 500;
  setTimeout(() => brand.classList.add("is-expanded"), delay);
}

/* ---------- Menú móvil (hamburguesa) ---------- */
function initMobileNav() {
  const toggle = document.getElementById("navbar-toggle");
  const navbar = document.querySelector(".navbar");
  const links = document.getElementById("navbar-links");
  if (!toggle || !navbar || !links) return;

  function labelFor(open) {
    if (open) return currentLang() === "en" ? "Close menu" : "Cerrar menú";
    return currentLang() === "en" ? "Open menu" : "Abrir menú";
  }

  function setOpen(open) {
    navbar.classList.toggle("is-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open ? ICON_MENU_CLOSE : ICON_MENU;
    toggle.setAttribute("aria-label", labelFor(open));
  }

  setOpen(false);

  toggle.addEventListener("click", () => {
    setOpen(!navbar.classList.contains("is-menu-open"));
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  const ctaLink = document.querySelector(".navbar__cta");
  if (ctaLink) ctaLink.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (e) => {
    if (navbar.classList.contains("is-menu-open") && !navbar.contains(e.target)) setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) setOpen(false);
  });

  document.addEventListener("languagechange:app", () => {
    toggle.setAttribute("aria-label", labelFor(navbar.classList.contains("is-menu-open")));
  });
}

/* ---------- Resalta el enlace de la página actual en el navbar ---------- */
function initActiveNavLink() {
  const links = document.querySelectorAll(".navbar__links a");
  if (!links.length) return;
  const current = window.location.pathname.split("/").pop() || "index.html";
  links.forEach((a) => {
    const hrefPage = (a.getAttribute("href") || "").split("#")[0] || "index.html";
    if (hrefPage === current) a.classList.add("is-active");
  });
}

function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      btn.classList.toggle("is-visible", window.scrollY > 500);
      ticking = false;
    });
  }, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: PREFERS_REDUCED_MOTION ? "auto" : "smooth" });
  });
}

/* ---------- Barra de progreso de scroll ---------- */
function initScrollProgress() {
  const bar = document.getElementById("scroll-progress-bar");
  if (!bar) return;
  let ticking = false;
  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
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

function initTimelineToggle() {
  const timeline = document.querySelector(".timeline");
  const buttons = document.querySelectorAll(".timeline-toggle__btn");
  if (!timeline || !buttons.length) return;

  const items = Array.from(timeline.children);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-active")) return;
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      const ordered = btn.dataset.order === "asc" ? [...items].reverse() : items;
      ordered.forEach((item) => timeline.appendChild(item));
    });
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });

  items.forEach((el) => observer.observe(el));
}

function initStatsCounters() {
  const stats = document.querySelectorAll(".stat__value");
  if (!stats.length) return;

  function animateStat(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (!("IntersectionObserver" in window)) {
    stats.forEach(animateStat);
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateStat(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  stats.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".carousel").forEach(initCarousel);
  document.querySelectorAll(".project-card__tags").forEach(renderTagChips);
  initTechFilters();
  initSoundEffects();
  initSoundToggle();
  initThemeToggle();
  initLangToggle();
  initCategoryTabs();
  initProjectModal();
  initTimelineToggle();
  initScrollReveal();
  initStatsCounters();
  initVisitNotifier();
  initHeroTypewriter();
  initCopyEmail();
  initAvatarParallax();
  initCustomCursor();
  initBackToTop();
  initScrollProgress();
  initBrandAnimation();
  initMobileNav();
  initActiveNavLink();

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
