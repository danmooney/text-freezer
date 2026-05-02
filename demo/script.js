// Demo bootstrap. All DOM mutations happen BEFORE freeze() — once a zone is
// frozen, programmatic edits inside it get reverted by the observer too.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // OS-aware DevTools shortcut hint.
    var kbd = document.getElementById('kbd-devtools');
    if (kbd) {
      var ua = (navigator.userAgent || '') + ' ' + (navigator.platform || '');
      var isMac = /Mac|iPhone|iPad|iPod/.test(ua);
      kbd.textContent = isMac ? '⌘⌥I' : 'Ctrl+Shift+I';
    }

    // Frozen-at timestamp for the topbar chip — set once, then frozen forever.
    var t = document.getElementById('frozen-time');
    if (t) {
      var now = new Date();
      var pad = function (n) { return String(n).padStart(2, '0'); };
      t.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    }

    // Assemble the contact email at runtime to slow naive scrapers.
    var slot = document.getElementById('email-slot');
    if (slot) {
      var user = 'dan';
      var domain = 'scamfreezer.com';
      var addr = user + '@' + domain;
      var a = document.createElement('a');
      a.href = 'mailto:' + addr;
      a.textContent = addr;
      a.rel = 'noopener';
      slot.replaceChildren(a);
    }

    // Contact form: AJAX submit to Formsubmit so the visitor stays on
    // scamfreezer.com instead of bouncing to formsubmit.co's thank-you page.
    // Success/error states are pre-rendered with `hidden` and toggled via
    // attribute changes — which the freeze observer ignores (it only reverts
    // characterData and childList mutations), so the page stays frozen but
    // the form state still updates after submit.
    var form = document.querySelector('.contact__form');
    if (form) {
      var successEl = document.querySelector('.contact__success');
      var errorEl = form.querySelector('.contact__feedback--error');
      var submitBtn = form.querySelector('button[type="submit"]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Anti-spam: a hidden field humans don't see — if it has a value,
        // a bot filled it; drop silently.
        var trap = form.querySelector('input[name="website"]');
        if (trap && trap.value) return;

        if (errorEl) errorEl.setAttribute('hidden', '');
        if (submitBtn) submitBtn.disabled = true;

        fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        })
          .then(function (response) {
            if (!response.ok) throw new Error('non-2xx');
            return response.json();
          })
          .then(function () {
            form.setAttribute('hidden', '');
            if (successEl) successEl.removeAttribute('hidden');
          })
          .catch(function () {
            if (errorEl) errorEl.removeAttribute('hidden');
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }

    // Freeze the whole document body as a single root. Section-level freezes
    // leave a deletion attack open: a scammer could remove a section element
    // from its parent, and a section-scoped observer can't see its own
    // detachment. Freezing body means *every* childList mutation under body —
    // including section deletion — is reverted.
    //
    // The contact form continues to work because typing into <input> or
    // <textarea> updates the element's `value` property, not its child text
    // nodes. No characterData or childList mutation fires, so the observer
    // never sees keystrokes. Submit posts to Formspree as a normal browser
    // navigation, also outside the observer's scope. Browser extensions that
    // inject DOM near the form (Grammarly, password managers) will have their
    // injections reverted — an accepted tradeoff for this page's threat model.
    window.textfreezer.freeze(document.body);
  });
})();
