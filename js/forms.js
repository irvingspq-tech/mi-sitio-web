/* ==========================================================================
   TrackIO SaaS — forms.js
   Validación y envío real del formulario de demo (POST a enviar-demo.php),
   más el toast de confirmación. No conoce nada de scroll ni del nav.
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
    }, 4500);
  }

  function markInvalid(field) {
    if (!field) return;
    field.style.borderColor = "#c96161";
    window.setTimeout(function () {
      field.style.borderColor = "";
    }, 1600);
  }

  function setSubmitting(button, isSubmitting) {
    if (!button) return;
    if (isSubmitting) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Enviando...";
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function initDemoForm() {
    var form = document.getElementById("demo-form");
    if (!form) return;

    var submitButton = form.querySelector('button[type="submit"]');

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

      setSubmitting(submitButton, true);

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return { ok: false };
            })
            .then(function (data) {
              return { ok: response.ok && data.ok === true, data: data };
            });
        })
        .then(function (result) {
          setSubmitting(submitButton, false);

          if (result.ok) {
            showToast("Gracias, " + nombreValue.split(" ")[0] + ". Nuestro equipo te contactará muy pronto.");
            form.reset();
          } else {
            showToast("No pudimos enviar tu solicitud. Escríbenos directo a contactotrackio@viveenergia.com.");
          }
        })
        .catch(function (err) {
          console.error("[Trackio] Error de red al enviar el formulario:", err);
          setSubmitting(submitButton, false);
          showToast("No pudimos enviar tu solicitud. Escríbenos directo a contactotrackio@viveenergia.com.");
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initDemoForm, "formulario-demo");
  });
})();
