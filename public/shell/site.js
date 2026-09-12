(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.mast-menu');
  var menu = document.querySelector('.mobile-menu');

  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('is-open', open);
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a') || event.target === menu) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- reveal ---------- */
  if ('IntersectionObserver' in window) {
    var revealables = document.querySelectorAll('.reveal');
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .16, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(revealObserver.observe.bind(revealObserver));
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- details ---------- */
  document.querySelectorAll('.details-btn').forEach(function (btn) {
    var parent = btn.closest('.details');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (parent) parent.classList.toggle('open', !open);
    });
  });

  /* ---------- copy ---------- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var pre = btn.closest('.code-row') ? btn.closest('.code-row').querySelector('pre.example') : null;
      if (!pre) return;
      var text = pre.textContent;
      function done(ok) {
        btn.textContent = ok ? '\u2713' : '\u00d7';
        setTimeout(function () { btn.textContent = original; }, 1250);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(true); } catch (e) { done(false); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- viewer ---------- */
  var viewer = document.querySelector('#viewer');
  var viewerImg = viewer && viewer.querySelector('#viewer-image');
  var viewerCap = viewer && viewer.querySelector('.viewer-cap');
  var lastTrigger = null;

  function openViewer(trigger) {
    if (!viewer || !viewerImg) return;
    lastTrigger = trigger;
    viewerImg.src = trigger.dataset.viewerSrc;
    viewer.querySelector('#viewer-title').textContent = trigger.dataset.viewerTitle || 'Screenshot';
    viewerImg.alt = trigger.querySelector('img') ? trigger.querySelector('img').alt : '';
    viewerImg.dataset.viewerSrc = '';
    if (viewerCap) viewerCap.textContent = trigger.dataset.viewerCap || '';
    viewer.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    var close = viewer.querySelector('.viewer-close');
    if (close) close.focus();
  }

  function closeViewer() {
    if (!viewer || viewer.hasAttribute('hidden')) return;
    viewer.setAttribute('hidden', '');
    viewerImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  }

  if (viewer) {
    document.querySelectorAll('.shot-hit[data-viewer-src]').forEach(function (trigger) {
      trigger.addEventListener('click', function () { openViewer(trigger); });
    });
    viewer.addEventListener('click', function (event) {
      if (event.target === viewer) closeViewer();
    });
    viewer.querySelectorAll('[data-viewer-close]').forEach(function (btn) {
      btn.addEventListener('click', closeViewer);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeViewer();
      if (event.key !== 'Tab' || viewer.hasAttribute('hidden')) return;
      var focusables = viewer.querySelectorAll('button, [href], [tabindex="0"]');
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- anchor-only navigation lines ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (link.closest('.mobile-menu')) setTimeout(function () { setMenu(false); }, 24);
    });
  });
})();
