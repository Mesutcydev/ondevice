(function () {
  'use strict';
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mobile menu is a native <details>; close it after choosing a link */
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { a.closest('details').open = false; });
  });

  /* reveal on scroll */
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });

  /* showcase tabs: auto-advance until the visitor picks one */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var shots = [].slice.call(root.querySelectorAll('.stage-shots > img'));
    var i = 0, timer = null, auto = !calm;
    function show(n, fromUser) {
      i = (n + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
        t.classList.remove('run');
      });
      shots.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      if (fromUser) auto = false;
      clearTimeout(timer);
      if (auto) {
        void tabs[i].offsetWidth; /* restart the progress bar */
        tabs[i].classList.add('run');
        timer = setTimeout(function () { show(i + 1); }, 5500);
      }
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k, true); });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); show(i + d, true); tabs[i].focus(); }
      });
    });
    /* only run while on screen */
    if (io) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (auto && !timer) show(i); }
        else { clearTimeout(timer); timer = null; }
      }).observe(root);
    }
    show(0);
    clearTimeout(timer); timer = null;
  });

  /* copy example request */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.dataset.copy).textContent;
      var label = btn.textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = btn.dataset.done || '✓';
        setTimeout(function () { btn.textContent = label; }, 1400);
      });
    });
  });
})();
