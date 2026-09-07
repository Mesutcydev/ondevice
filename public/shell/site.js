/* OnDevice — behaviour layer. No dependencies.
   Everything degrades: without JS the page is fully readable (the .js class
   gates all entrance animation), disclosures are plain <details>-like regions
   left open, and tabs fall back to stacked panels. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
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

  /* ---------- header: steady height, scroll state, active section ---------- */
  var nav = document.querySelector('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var navLinks = [].slice.call(document.querySelectorAll('.nav-mid a'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = byId[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          navLinks.forEach(function (x) { x.classList.remove('active'); });
          a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) secIO.observe(s);
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.nav-menu');
  var drop = document.getElementById('nav-drop');
  if (menuBtn && drop) {
    var setDrop = function (open) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      drop.hidden = !open;
    };
    menuBtn.addEventListener('click', function () { setDrop(drop.hidden); });
    drop.addEventListener('click', function (e) { if (e.target.closest('a')) setDrop(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drop.hidden) { setDrop(false); menuBtn.focus(); } });
  }

  /* ---------- generic tabs (W3C APG pattern) ----------
     [role=tablist] > [role=tab][data-panel|#panelId]
     Optional: data-imgs="selector" for crossfade groups,
               data-caption="selector" + data-cap-title/data-cap-sub. */
  function initTablist(list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    /* without JS every panel stays visible; with JS, hide panels that no
       selected tab references (panels shared by several tabs stay visible) */
    var selectedPanels = {};
    tabs.forEach(function (x) {
      if (x.getAttribute('aria-selected') === 'true') selectedPanels[x.getAttribute('aria-controls')] = 1;
    });
    tabs.forEach(function (x) {
      if (x.getAttribute('aria-selected') !== 'true') {
        var pid0 = x.getAttribute('aria-controls');
        if (pid0 && !selectedPanels[pid0]) {
          var p0 = document.getElementById(pid0);
          if (p0) p0.hidden = true;
        }
      }
    });

    function index(tab) { return tabs.indexOf(tab); }

    function select(tab, focus) {
      var prev = tabs.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; })[0];
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        var pid = x.getAttribute('aria-controls');
        if (pid) {
          var p = document.getElementById(pid);
          /* shared panels (referenced by more than one tab) never hide */
          var shared = tabs.some(function (y) { return y !== x && y.getAttribute('aria-controls') === pid; });
          if (p && !shared) p.hidden = !on;
        }
      });

      /* crossfade group: stable frame, 6–10px directional movement */
      var imgsSel = tab.getAttribute('data-imgs');
      if (imgsSel) {
        var box = document.querySelector(imgsSel);
        if (box) {
          var imgs = [].slice.call(box.querySelectorAll('img[data-scene]'));
          var ni = index(tab);
          var pi = prev ? index(prev) : ni;
          box.setAttribute('data-dir', ni >= pi ? 'fwd' : 'back');
          imgs.forEach(function (im, i) {
            if (i === ni) {
              im.classList.remove('exit-left', 'exit-right');
              im.classList.add('is-active');
            } else if (im.classList.contains('is-active')) {
              im.classList.remove('is-active');
              im.classList.add(ni >= pi ? 'exit-left' : 'exit-right');
              setTimeout(function () { im.classList.remove('exit-left', 'exit-right'); }, reduced ? 0 : 300);
            }
          });
        }
      }

      /* caption swap, same beat as the screen */
      var capSel = tab.getAttribute('data-caption');
      if (capSel) {
        var cap = document.querySelector(capSel);
        if (cap) {
          var b = cap.querySelector('b'), s = cap.querySelector('span');
          if (b && tab.getAttribute('data-cap-title')) b.textContent = tab.getAttribute('data-cap-title');
          if (s && tab.getAttribute('data-cap-sub')) s.textContent = tab.getAttribute('data-cap-sub');
          if (!reduced) { cap.classList.remove('fade'); void cap.offsetWidth; cap.classList.add('fade'); }
        }
      }
      /* keep an "enlarge" button in sync with the selected showcase screen */
      var stage = tab.getAttribute('aria-controls') ? document.getElementById(tab.getAttribute('aria-controls')) : null;
      var sync = stage && stage.querySelector('[data-viewer-sync]');
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
  }
  [].slice.call(document.querySelectorAll('[role="tablist"]')).forEach(initTablist);

  /* ---------- disclosures: natural-height expansion ---------- */
  [].slice.call(document.querySelectorAll('.disclosure-btn')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      var d = btn.closest('.disclosure');
      if (d) d.classList.toggle('open', !open);
    });
  });

  /* ---------- screenshot viewer: accessible modal ---------- */
  var viewer = document.getElementById('viewer');
  if (viewer) {
    var vImg = viewer.querySelector('img');
    var vCap = viewer.querySelector('.viewer-cap');
    var vTitle = viewer.querySelector('.viewer-bar span');
    var vClose = viewer.querySelector('[data-viewer-close]');
    var lastFocus = null;

    function openViewer(src, cap, title, trigger) {
      lastFocus = trigger || document.activeElement;
      vImg.src = src;
      vImg.alt = cap || '';
      if (vCap) vCap.textContent = cap || '';
      if (vTitle) vTitle.textContent = title || '';
      viewer.hidden = false;
      requestAnimationFrame(function () { viewer.classList.add('open'); });
      vClose.focus();
      document.body.style.overflow = 'hidden';
    }
    function closeViewer() {
      viewer.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { viewer.hidden = true; }, reduced ? 0 : 200);
      if (lastFocus) lastFocus.focus();
    }
    [].slice.call(document.querySelectorAll('[data-viewer-src]')).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        openViewer(b.getAttribute('data-viewer-src'), b.getAttribute('data-viewer-cap'), b.getAttribute('data-viewer-title'), b);
      });
    });
    vClose.addEventListener('click', closeViewer);
    viewer.addEventListener('mousedown', function (e) { if (e.target === viewer) closeViewer(); });
    document.addEventListener('keydown', function (e) {
      if (viewer.hidden) return;
      if (e.key === 'Escape') { closeViewer(); return; }
      if (e.key === 'Tab') { /* keep focus inside: single focusable, so trap it */
        e.preventDefault(); vClose.focus();
      }
    });
  }

  /* ---------- copy buttons: instant state change, fixed width ---------- */
  [].slice.call(document.querySelectorAll('.copy')).forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var block = btn.closest('.code-block');
      var pre = block && block.querySelector('pre');
      if (!pre) return;
      var text = pre.textContent;
      var done = function () {
        btn.textContent = btn.getAttribute('data-done') || '✓';
        btn.classList.add('done');
        setTimeout(function () { btn.textContent = label; btn.classList.remove('done'); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });

  /* ---------- scroll reveal: 12px once, staggered, stops offscreen ---------- */
  var revealables = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (revealables.length && !reduced && 'IntersectionObserver' in window) {
    revealables.forEach(function (el) {
      var kids = [].slice.call(el.children);
      kids.forEach(function (k, i) { k.style.setProperty('--i', Math.min(i, 6)); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- terminal: localised scenes, paused offscreen & hidden ---------- */
  var term = document.getElementById('term');
  var out = document.getElementById('term-out');
  var title = document.getElementById('term-title');
  var scenes = window.ONDEVICE_SCENES || {
    studio: {
      title: 'ondevice llm — local session',
      lines: [
        { t: '$ ondevice llm run --model qwen3.5-4b --ctx 65536', c: '' },
        { t: '', c: '' },
        { t: 'resident  MLX  4-bit  weights 2.4 GB  kv 1.1 GB @ 65,536 ctx', c: 'c-dim' },
        { t: 'admitted  memory ok  thermal nominal  entitlements ok', c: 'c-dim' },
        { t: '', c: '' },
        { t: '> What actually stays on this device?', c: 'c-txt' },
        { t: '', c: '' },
        { t: 'ANSWER', c: 'stream' },
        { t: '', c: '' },
        { t: '42.1 tok/s  ·  0 network calls  ·  history in app storage', c: 'c-acc' }
      ],
      tokens: ['Everything', '.', ' Weights', ' are', ' memory', '-', 'mapped', ' from',
               ' local', ' storage', ' and', ' decoded', ' on', ' the', ' GPU', ' —',
               ' the', ' prompt', ',', ' the', ' KV', ' cache', ',', ' and', ' this',
               ' answer', ' never', ' leave', ' the', ' phone', '.']
    },
    server: {
      title: 'bash — streaming from 192.168.1.8:11434',
      lines: [
        { t: '$ curl -N .../v1/chat/completions -d \'{"stream":true,...}\'', c: '' },
        { t: '', c: '' },
        { t: 'data: {"choices":[{"delta":{"role":"assistant"}}]}', c: 'c-dim' },
        { t: 'STREAM', c: 'stream' },
        { t: '', c: '' },
        { t: 'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}', c: 'c-dim' },
        { t: 'data: [DONE]', c: 'c-vio' }
      ],
      tokens: ['Server', '-', 'sent', ' events', ' stream', ' one', ' chunk',
               ' per', ' token', ' over', ' a', ' single', ' open', ' HTTP',
               ' response', '.']
    }
  };

  if (term && out) {
    var current = 'studio';
    var timer = null;
    var onScreen = true;

    var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var sIdx = function (sc) { for (var i = 0; i < sc.lines.length; i++) if (sc.lines[i].c === 'stream') return i; return -1; };
    var render = function (sc, upto, tok) {
      var acc = sc === scenes.studio ? 'c-acc' : 'c-amb';
      var s = '';
      for (var i = 0; i < upto && i < sc.lines.length; i++) {
        var l = sc.lines[i];
        if (l.c === 'stream') {
          var shown = sc.tokens.slice(0, tok).join('');
          if (!shown) continue;
          s += '<span class="' + acc + '">' + esc(shown) + '</span>\n';
        } else if (l.c) s += '<span class="' + l.c + '">' + esc(l.t) + '</span>\n';
        else s += esc(l.t) + '\n';
      }
      out.innerHTML = s + '<span class="caret"></span>';
    };
    var play = function (name) {
      current = name;
      var sc = scenes[name];
      term.setAttribute('data-scene', name);
      if (title) title.textContent = sc.title;
      if (timer) clearTimeout(timer);
      if (reduced || !onScreen) { render(sc, sc.lines.length, sc.tokens.length); return; }
      var si = sIdx(sc), line = 0, tok = 0;
      render(sc, 0, 0);
      var tick = function () {
        if (!onScreen || document.hidden) { timer = setTimeout(tick, 500); return; }
        if (line < si) { line++; render(sc, line, 0); timer = setTimeout(tick, 300); return; }
        if (tok < sc.tokens.length) { tok++; render(sc, si + 1, tok); timer = setTimeout(tick, 62); return; }
        render(sc, sc.lines.length, tok);
        timer = setTimeout(function () { line = 0; tok = 0; render(sc, 0, 0); timer = setTimeout(tick, 620); }, 4200);
      };
      timer = setTimeout(tick, 420);
    };

    /* the hero device selector drives the terminal too, when present */
    [].slice.call(document.querySelectorAll('[data-term-scene]')).forEach(function (el) {
      el.addEventListener('click', function () { play(el.getAttribute('data-term-scene')); });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        onScreen = es[0].isIntersecting;
        if (onScreen && !timer && !reduced) play(current);
      }, { threshold: 0.05 }).observe(term);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !timer && !reduced && onScreen) play(current);
    });
    play('studio');
  }
})();
