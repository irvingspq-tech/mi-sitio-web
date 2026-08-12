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

    var revealed = new WeakSet();

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealed.add(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });

    window.setTimeout(function () {
      items.forEach(function (el) {
        if (!revealed.has(el)) el.classList.add("is-visible");
      });
    }, 6000);
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

  document.addEventListener("DOMContentLoaded", function () {
    safe(initNavScrollState, "estado-nav-scroll");
    safe(initMobileNav, "nav-movil");
    safe(initScrollReveal, "scroll-reveal");
    safe(initSmoothScroll, "smooth-scroll");
  });
})();
