/* ==========================================================================
   TrackIO SaaS — interactions.js
   UI pura: estado del nav al hacer scroll, menú móvil, scroll-reveal y
   smooth scroll de anclas.
   ========================================================================== */

(function () {
  "use strict";

  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      console.error("[Trackio] Fallo en " + label + ":", err);
    }
  }

  function initNavScrollState() {
    var nav = document.getElementById("navbar");
    if (!nav) return;

    var ticking = false;

    function update() {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var panel = document.getElementById("nav-mobile-panel");
    var close = document.getElementById("nav-mobile-close");
    var overlay = document.getElementById("nav-mobile-overlay");
    if (!toggle || !panel || !close || !overlay) return;

    function open() {
      panel.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closePanel() {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    toggle.addEventListener("click", open);
    close.addEventListener("click", closePanel);
    overlay.addEventListener("click", closePanel);

    panel.querySelectorAll(".nav-mobile-link").forEach(function (link) {
      link.addEventListener("click", closePanel);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) closePanel();
    });
  }

  function initScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    var groupCounts = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement;
      var index = groupCounts.has(parent) ? groupCounts.get(parent) : 0;
      el.style.transitionDelay = Math.min(index * 90, 360) + "ms";
      groupCounts.set(parent, index + 1);
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var showObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    // Se reinicia solo al salir por completo de la pantalla, para que vuelva a animarse al regresar.
    var resetObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) entry.target.classList.remove("is-visible");
      });
    });

    items.forEach(function (el) {
      showObserver.observe(el);
      resetObserver.observe(el);
    });
  }

  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;

        var target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initVideoAutoplay() {
    var video = document.querySelector(".video-embed-player");
    if (!video) return;

    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
  }

  function initCarousels() {
    var carousels = document.querySelectorAll("[data-carousel]");
    if (!carousels.length) return;

    carousels.forEach(function (root) {
      var viewport = root.querySelector(".carousel-viewport");
      var track = root.querySelector(".carousel-track");
      var slides = root.querySelectorAll(".carousel-slide");
      var prevBtn = root.querySelector(".carousel-btn--prev");
      var nextBtn = root.querySelector(".carousel-btn--next");
      if (!viewport || !track || !slides.length) return;

      var currentPage = 0;

      function perPage() {
        return window.innerWidth > 900 ? 2 : 1;
      }

      function totalPages() {
        return Math.max(1, Math.ceil(slides.length / perPage()));
      }

      function update() {
        var pages = totalPages();
        if (currentPage > pages - 1) currentPage = pages - 1;

        track.style.transform = "translateX(-" + currentPage * viewport.clientWidth + "px)";

        var canScroll = pages > 1;
        if (prevBtn) prevBtn.hidden = !canScroll;
        if (nextBtn) nextBtn.hidden = !canScroll;
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          var pages = totalPages();
          currentPage = currentPage <= 0 ? pages - 1 : currentPage - 1;
          update();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          var pages = totalPages();
          currentPage = currentPage >= pages - 1 ? 0 : currentPage + 1;
          update();
        });
      }

      var resizeTimer = null;
      window.addEventListener("resize", function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(update, 150);
      });

      update();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initNavScrollState, "estado-nav-scroll");
    safe(initMobileNav, "nav-movil");
    safe(initScrollReveal, "scroll-reveal");
    safe(initSmoothScroll, "smooth-scroll");
    safe(initVideoAutoplay, "video-autoplay");
    safe(initCarousels, "carruseles");
  });
})();
