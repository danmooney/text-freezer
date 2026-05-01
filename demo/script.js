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
    // REPLACE the user/domain values before deploy.
    var slot = document.getElementById('email-slot');
    if (slot) {
      var user = 'YOUR_CONTACT_EMAIL';
      var domain = 'example.com';
      var addr = user + '@' + domain;
      var a = document.createElement('a');
      a.href = 'mailto:' + addr;
      a.textContent = addr;
      a.rel = 'noopener';
      slot.replaceChildren(a);
    }

    // Honeypot: real users will not fill the hidden "website" field.
    var form = document.querySelector('.contact__form');
    if (form) {
      form.addEventListener('submit', function (e) {
        var trap = form.querySelector('input[name="website"]');
        if (trap && trap.value) {
          // Silently drop. Don't tell the bot why.
          e.preventDefault();
        }
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
    window.textFreezer.freeze(document.body);
  });
})();
