(function () {
  'use strict';
  var root = document.documentElement;
  var system = window.matchMedia('(prefers-color-scheme: dark)');
  var preference = null;
  try {
    var stored = localStorage.getItem('ondevice-theme');
    if (stored === 'light' || stored === 'dark') preference = stored;
  } catch (error) { /* The toggle still works when storage is unavailable. */ }

  function apply() {
    var dark = preference ? preference === 'dark' : system.matches;
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
      meta.removeAttribute('media');
      meta.content = dark ? '#111113' : '#ffffff';
    });
    var button = document.querySelector('.theme-toggle');
    if (button) {
      var label = dark ? button.dataset.lightLabel : button.dataset.darkLabel;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.hidden = false;
    }
  }
  apply();
  system.addEventListener('change', function () { if (!preference) apply(); });
  document.addEventListener('DOMContentLoaded', function () {
    apply();
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.addEventListener('click', function () {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('ondevice-theme', preference); } catch (error) { /* Optional persistence. */ }
      apply();
    });
  });
})();
