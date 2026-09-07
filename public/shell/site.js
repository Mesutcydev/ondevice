/* OnDevice — behaviour layer. No dependencies, no scroll-driven decoration.
   Without JS: nav links reachable, story panels all visible, disclosures open,
   viewer simply absent (its triggers are buttons that do nothing harmful). */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme (footer control only) ---------- */
  var THEME_KEY = 'ondevice-theme';
  var root = document.documentElement;
  function syncTheme() {
    var mode = root.getAttribute('data-theme') || 'system';
    var btns = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-theme-set') === mode ? 'true' : 'false');
    }
  }
  var tbs = document.querySelectorAll('[data-theme-set]');
  for (var t = 0; t < tbs.length; t++) {
    tbs[t].addEventListener('click', function () {
      var m = this.getAttribute('data-theme-set');
      root.setAttribute('data-theme', m);
      try { localStorage.setItem(THEME_KEY, m); } catch (e) {}
      syncTheme();
    });
  }
  syncTheme();

  /* ---------- masthead: steady height, border on scroll ---------- */
  var mast = document.querySelector('.mast');
  if (mast) {
    var onScroll = function () { mast.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var menuBtn = document.querySelector('.mast-menu');
  var drop = document.getElementById('mast-drop');
  if (menuBtn && drop) {
    var setDrop = function (open) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      drop.hidden = !open;
    };
    menuBtn.addEventListener('click', function () { setDrop(drop.hidden); });
    drop.addEventListener('click', function (e) { if (e.target.closest('a')) setDrop(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drop.hidden) { setDrop(false); menuBtn.focus(); }
    });
  }

  /* ---------- active section in nav ---------- */
  var navLinks = [].slice.call(document.querySelectorAll('.mast nav a'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = byId[e.target.id];
        if (!a || !e.isIntersecting) return;
        navLinks.forEach(function (x) { x.classList.remove('active'); });
        a.classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* ---------- story tabs (W3C APG): crossfade media, swap copy ---------- */
  [].slice.call(document.querySelectorAll('[role="tablist"]')).forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    /* with JS: hide panels other than the selected one (shared media boxes stay) */
    var selectedPanels = {};
    tabs.forEach(function (x) { if (x.getAttribute('aria-selected') === 'true') selectedPanels[x.getAttribute('aria-controls')] = 1; });
    tabs.forEach(function (x) {
      if (x.getAttribute('aria-selected') !== 'true') {
        var pid = x.getAttribute('aria-controls');
        if (pid && !selectedPanels[pid]) {
          var p = document.getElementById(pid);
          if (p) p.hidden = true;
        }
      }
    });

    function select(tab, focus) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        var pid = x.getAttribute('aria-controls');
        if (pid) {
          var shared = tabs.some(function (y) { return y !== x && y.getAttribute('aria-controls') === pid; });
          var p = document.getElementById(pid);
          if (p && !shared) p.hidden = !on;
        }
      });
      var imgsSel = tab.getAttribute('data-imgs');
      if (imgsSel) {
        var box = document.querySelector(imgsSel);
        if (box) {
          var idx = tabs.indexOf(tab);
          [].slice.call(box.querySelectorAll('img[data-scene]')).forEach(function (im, i) {
            im.classList.toggle('is-active', i === idx);
          });
        }
      }
      var capSel = tab.getAttribute('data-caption');
      if (capSel) {
        var cap = document.querySelector(capSel);
        if (cap) {
          var h = cap.querySelector('h3'), p2 = cap.querySelector('p.story-lead');
          if (h && tab.getAttribute('data-cap-title')) h.textContent = tab.getAttribute('data-cap-title');
          if (p2 && tab.getAttribute('data-cap-sub')) p2.textContent = tab.getAttribute('data-cap-sub');
        }
      }
      var sync = document.querySelector('[data-viewer-sync][data-sync-group="' + (tab.getAttribute('data-group') || '') + '"]');
      if (sync && tab.getAttribute('data-viewer-src')) {
        sync.setAttribute('data-viewer-src', tab.getAttribute('data-viewer-src'));
        sync.setAttribute('data-viewer-cap', tab.getAttribute('data-viewer-cap') || '');
        sync.setAttribute('data-viewer-title', tab.getAttribute('data-viewer-title') || '');
      }
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n], true); }
      });
    });
  });

  /* ---------- screenshot viewer ---------- */
  var viewer = document.getElementById('viewer');
  if (viewer) {
    var vImg = viewer.querySelector('img');
    var vCap = viewer.querySelector('.viewer-cap');
    var vTitle = viewer.querySelector('.viewer-bar span');
    var vClose = viewer.querySelector('[data-viewer-close]');
    var lastFocus = null;
    function open(src, cap, title, trigger) {
      lastFocus = trigger || document.activeElement;
      vImg.src = src; vImg.alt = cap || '';
      if (vCap) vCap.textContent = cap || '';
      if (vTitle) vTitle.textContent = title || '';
      viewer.hidden = false;
      requestAnimationFrame(function () { viewer.classList.add('open'); });
      vClose.focus();
      document.body.style.overflow = 'hidden';
    }
    function close() {
      viewer.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { viewer.hidden = true; }, reduced ? 0 : 200);
      if (lastFocus) lastFocus.focus();
    }
    [].slice.call(document.querySelectorAll('[data-viewer-src]')).forEach(function (b) {
      if (b.hasAttribute('data-viewer-sync')) return; /* synced button handled below */
      b.addEventListener('click', function () {
        open(b.getAttribute('data-viewer-src'), b.getAttribute('data-viewer-cap'), b.getAttribute('data-viewer-title'), b);
      });
    });
    [].slice.call(document.querySelectorAll('[data-viewer-sync]')).forEach(function (b) {
      b.addEventListener('click', function () {
        open(b.getAttribute('data-viewer-src'), b.getAttribute('data-viewer-cap'), b.getAttribute('data-viewer-title'), b);
      });
    });
    vClose.addEventListener('click', close);
    viewer.addEventListener('mousedown', function (e) { if (e.target === viewer) close(); });
    document.addEventListener('keydown', function (e) {
      if (viewer.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') { e.preventDefault(); vClose.focus(); }
    });
  }

  /* ---------- copy buttons: honest feedback, fixed width ---------- */
  [].slice.call(document.querySelectorAll('.copy-btn')).forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var pre = btn.parentElement.querySelector('pre');
      if (!pre) return;
      var text = pre.textContent;
      var done = function (ok) {
        btn.textContent = ok ? (btn.getAttribute('data-done') || '✓') : 'failed';
        btn.classList.toggle('done', ok);
        setTimeout(function () { btn.textContent = label; btn.classList.remove('done'); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done(ok);
      }
    });
  });

  /* ---------- disclosures ---------- */
  [].slice.call(document.querySelectorAll('.disclosure-btn')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      var d = btn.closest('.disclosure');
      if (d) d.classList.toggle('open', !open);
    });
  });
})();
