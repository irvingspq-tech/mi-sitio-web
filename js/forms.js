/* ==========================================================================
   TrackIO SaaS — forms.js
   Validación y envío simulado del formulario de demo, más el toast de
   confirmación. No conoce nada de scroll ni del nav.
   ========================================================================== */

(function () {
  "use strict";

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var toastTimer = null;

  function safe(fn, label) {
    try {
      fn();
    } catch (err) {
      console.error("[Trackio] Fallo en " + label + ":", err);
    }
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    var toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add("is-visible");

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 4000);
  }

  function markInvalid(field) {
    if (!field) return;
    field.style.borderColor = "#c96161";
    window.setTimeout(function () {
      field.style.borderColor = "";
    }, 1600);
  }

  function initDemoForm() {
    var form = document.getElementById("demo-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var nombre = form.querySelector("#nombre");
      var empresa = form.querySelector("#empresa");
      var email = form.querySelector("#email");

      var nombreValue = nombre ? nombre.value.trim() : "";
      var empresaValue = empresa ? empresa.value.trim() : "";
      var emailValue = email ? email.value.trim() : "";

      var firstInvalid = null;
      if (!nombreValue) firstInvalid = firstInvalid || nombre;
      if (!empresaValue) firstInvalid = firstInvalid || empresa;
      if (!EMAIL_PATTERN.test(emailValue)) firstInvalid = firstInvalid || email;

      if (firstInvalid) {
        markInvalid(firstInvalid);
        firstInvalid.focus();
        return;
      }

      showToast("Gracias, " + nombreValue.split(" ")[0] + ". Nuestro equipo te contactará muy pronto.");
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initDemoForm, "formulario-demo");
  });
})();
