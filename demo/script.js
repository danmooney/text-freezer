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

    // Freeze every marked zone. The contact form is intentionally NOT marked,
    // so it remains the only editable region on the page.
    if (window.textFreezer && typeof window.textFreezer.freeze === 'function') {
      var zones = document.querySelectorAll('[data-frozen-zone]');
      zones.forEach(function (z) { window.textFreezer.freeze(z); });
    }
  });
})();
