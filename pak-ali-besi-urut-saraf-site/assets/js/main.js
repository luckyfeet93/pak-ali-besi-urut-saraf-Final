(() => {
  const menuButton = document.querySelector("[data-menu-button]");
  const nav = document.querySelector("[data-nav]");
  const year = document.querySelector("[data-year]");

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    if (!nav) return;
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  if (year) year.textContent = String(new Date().getFullYear());

  const ensureStylesheet = (href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  };

  ensureStylesheet("/assets/css/branding.css");
  ensureStylesheet("/assets/css/directions.css");
  ensureStylesheet("/assets/css/mobile-hero.css?v=20260722-1608");

  const mapsUrl = "https://maps.app.goo.gl/zMe2AY3GuwKFPzXY7";
  const wazeUrl = "https://waze.com/ul?ll=1.4881719%2C103.4135948&navigate=yes&utm_source=pak-ali-besi-website";

  const heroActions = document.querySelector(".hero-actions");
  if (heroActions && !document.querySelector(".hero-direction-actions")) {
    const directions = document.createElement("div");
    directions.className = "hero-direction-actions";
    directions.setAttribute("aria-label", "Pandu arah ke Pak Ali Besi");
    directions.innerHTML = `
      <a class="button button--secondary" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>
      <a class="button button--secondary" href="${wazeUrl}" target="_blank" rel="noopener noreferrer">Waze</a>
    `;
    heroActions.insertAdjacentElement("afterend", directions);
  }

  const finalContainer = document.querySelector(".final .container");
  if (finalContainer && !finalContainer.querySelector(".final-direction-actions")) {
    const actions = document.createElement("div");
    actions.className = "final-direction-actions";
    actions.setAttribute("aria-label", "Tempahan dan pandu arah");
    actions.innerHTML = `
      <a class="button button--light" href="https://wa.me/601140485021?text=Assalamualaikum%20Pak%20Ali%2C%20saya%20ingin%20bertanya%20tentang%20slot%20urutan." target="_blank" rel="noopener noreferrer">Mulakan di WhatsApp</a>
      <a class="button button--outline-light" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>
      <a class="button button--outline-light" href="${wazeUrl}" target="_blank" rel="noopener noreferrer">Waze</a>
    `;
    finalContainer.querySelector(".button--light")?.remove();
    finalContainer.append(actions);
  }

  const footerLocation = document.querySelector(".footer-grid > div:first-child");
  if (footerLocation && !footerLocation.querySelector(".footer-direction-actions")) {
    const directions = document.createElement("div");
    directions.className = "footer-direction-actions";
    directions.setAttribute("aria-label", "Pandu arah ke Pak Ali Besi");
    directions.innerHTML = `
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>
      <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer">Waze</a>
    `;
    footerLocation.append(directions);
  }

  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
  if (slides.length < 2) return;

  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const toggleButton = carousel.querySelector("[data-carousel-toggle]");
  const previousPeek = carousel.querySelector("[data-carousel-peek-prev]");
  const nextPeek = carousel.querySelector("[data-carousel-peek-next]");
  const previousPeekImage = previousPeek?.querySelector("img");
  const nextPeekImage = nextPeek?.querySelector("img");
  const currentNumber = carousel.querySelector("[data-carousel-current]");
  const totalNumber = carousel.querySelector("[data-carousel-total]");
  const status = carousel.querySelector("[data-carousel-status]");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AUTOPLAY_DELAY = 3000;

  let currentIndex = 0;
  let isAnimating = false;
  let isPaused = false;
  let touchStartX = 0;
  let autoplayTimer = null;

  const pad = (number) => String(number).padStart(2, "0");
  const wrap = (index) => (index + slides.length) % slides.length;

  const imageSourceAt = (index) => {
    const image = slides[wrap(index)]?.querySelector("img");
    return image?.currentSrc || image?.src || "";
  };

  const updatePauseButton = () => {
    if (!toggleButton) return;
    toggleButton.textContent = isPaused ? "Main" : "Jeda";
    toggleButton.setAttribute(
      "aria-label",
      isPaused ? "Mulakan pergerakan automatik" : "Hentikan pergerakan automatik"
    );
  };

  const updateInterface = () => {
    const previousIndex = wrap(currentIndex - 1);
    const nextIndex = wrap(currentIndex + 1);

    if (currentNumber) currentNumber.textContent = pad(currentIndex + 1);
    if (totalNumber) totalNumber.textContent = pad(slides.length);
    if (status) status.textContent = `Slaid ${currentIndex + 1} daripada ${slides.length}`;
    if (previousPeekImage) previousPeekImage.src = imageSourceAt(previousIndex);
    if (nextPeekImage) nextPeekImage.src = imageSourceAt(nextIndex);
  };

  const clearAutoplay = () => {
    if (!autoplayTimer) return;
    window.clearTimeout(autoplayTimer);
    autoplayTimer = null;
  };

  const scheduleAutoplay = () => {
    clearAutoplay();
    if (isPaused || document.hidden) return;

    autoplayTimer = window.setTimeout(() => {
      showSlide(currentIndex + 1, 1);
    }, AUTOPLAY_DELAY);
  };

  const finishSlideChange = (outgoing, incoming, nextIndex) => {
    outgoing.classList.remove("is-active");
    outgoing.getAnimations?.().forEach((animation) => animation.cancel());
    incoming.getAnimations?.().forEach((animation) => animation.cancel());
    outgoing.style.zIndex = "";
    incoming.style.zIndex = "";

    currentIndex = nextIndex;
    updateInterface();
    isAnimating = false;
    scheduleAutoplay();
  };

  const showSlide = (requestedIndex, direction = 1) => {
    const nextIndex = wrap(requestedIndex);

    if (nextIndex === currentIndex || isAnimating) {
      scheduleAutoplay();
      return;
    }

    clearAutoplay();

    const outgoing = slides[currentIndex];
    const incoming = slides[nextIndex];
    const distance = direction > 0 ? 100 : -100;

    isAnimating = true;
    incoming.classList.add("is-active");
    incoming.setAttribute("aria-hidden", "false");
    outgoing.setAttribute("aria-hidden", "true");
    incoming.style.zIndex = "3";
    outgoing.style.zIndex = "2";

    if (reduceMotion || typeof incoming.animate !== "function") {
      finishSlideChange(outgoing, incoming, nextIndex);
      return;
    }

    const duration = 650;
    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

    const incomingAnimation = incoming.animate(
      [
        { transform: `translateX(${distance}%)`, opacity: 0.35 },
        { transform: "translateX(0)", opacity: 1 }
      ],
      { duration, easing, fill: "both" }
    );

    outgoing.animate(
      [
        { transform: "translateX(0)", opacity: 1 },
        { transform: `translateX(${-distance * 0.38}%)`, opacity: 0.12 }
      ],
      { duration, easing, fill: "both" }
    );

    incomingAnimation.finished
      .catch(() => {})
      .finally(() => {
        finishSlideChange(outgoing, incoming, nextIndex);
      });
  };

  const showPrevious = () => showSlide(currentIndex - 1, -1);
  const showNext = () => showSlide(currentIndex + 1, 1);

  previousButton?.addEventListener("click", showPrevious);
  nextButton?.addEventListener("click", showNext);
  previousPeek?.addEventListener("click", showPrevious);
  nextPeek?.addEventListener("click", showNext);

  toggleButton?.addEventListener("click", () => {
    isPaused = !isPaused;
    updatePauseButton();
    isPaused ? clearAutoplay() : scheduleAutoplay();
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  });

  carousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
      clearAutoplay();
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchend",
    (event) => {
      const distance = touchStartX - event.changedTouches[0].clientX;

      if (Math.abs(distance) >= 55) {
        distance > 0 ? showNext() : showPrevious();
      } else {
        scheduleAutoplay();
      }
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    document.hidden ? clearAutoplay() : scheduleAutoplay();
  });

  slides.forEach((slide, index) => {
    slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");
  });

  updatePauseButton();
  updateInterface();
  scheduleAutoplay();
})();
