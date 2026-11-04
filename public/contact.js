// Progressive enhancement for the contact form: submit with fetch and show
// the result inline. Without this script the form still posts normally and
// the Worker redirects to /thanks/.
(function () {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector("[data-status]");
  const button = form.querySelector('button[type="submit"]');

  function show(state, text) {
    status.dataset.state = state;
    status.textContent = text;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    show("", "Sending…");
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        show("ok", "Thanks, your message is on its way. I'll reply within two business days.");
      } else {
        show("error", data.error || "Something went wrong. Please email me instead.");
      }
    } catch {
      show("error", "Couldn't reach the server. Please email me instead.");
    } finally {
      button.disabled = false;
      if (window.turnstile) window.turnstile.reset();
    }
  });
})();
