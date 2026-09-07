/* OnDevice — shared behaviour: theme, scroll reveal, nav shadow, terminal scenes.
   No dependencies. Every effect degrades to a static page without JS. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  // The inline boot script in <head> already set data-theme from storage, so
  // there is no flash. Here we only wire the controls and keep them in sync.
  var THEME_KEY = 'ondevice-theme';
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute('data-theme') || 'system';
  }
  function setTheme(mode) {
    root.setAttribute('data-theme', mode);
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
    syncThemeButtons();
  }
  function syncThemeButtons() {
    var mode = currentTheme();
    var btns = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var on = b.getAttribute('data-theme-set') === mode;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  var themeBtns = document.querySelectorAll('[data-theme-set]');
  for (var t = 0; t < themeBtns.length; t++) {
    themeBtns[t].addEventListener('click', function () {
      setTheme(this.getAttribute('data-theme-set'));
    });
  }
  syncThemeButtons();

  /* ---------- nav shadow on scroll ---------- */
  var nav = document.querySelector('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      for (var r = 0; r < revealables.length; r++) revealables[r].classList.add('in');
    } else {
      // Stagger siblings inside the same container so grids cascade.
      var seen = {};
      for (var s = 0; s < revealables.length; s++) {
        var el = revealables[s];
        var parent = el.parentElement;
        var key = parent ? (parent.className || parent.tagName) + '' : 'root';
        seen[key] = (seen[key] || 0);
        el.style.setProperty('--i', Math.min(seen[key], 6));
        seen[key]++;
      }
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('in');
            io.unobserve(entries[i].target);
          }
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      for (var q = 0; q < revealables.length; q++) io.observe(revealables[q]);
    }
  }

  /* ---------- terminal scenes ----------
     Pages can localise the terminal by defining window.ONDEVICE_SCENES
     before this file loads; otherwise the English defaults below apply. */
  var term = document.getElementById('term');
  var out = document.getElementById('term-out');
  var title = document.getElementById('term-title');
  var tabs = [].slice.call(document.querySelectorAll('.term-tab'));

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

  if (term && out && tabs.length) {
    var current = 'studio';
    var timer = null;

    var escapeHtml = function (s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    var streamIndex = function (scene) {
      for (var i = 0; i < scene.lines.length; i++) if (scene.lines[i].c === 'stream') return i;
      return -1;
    };
    var render = function (scene, upto, tokenCount) {
      var acc = scene === scenes.studio ? 'c-acc' : 'c-amb';
      var s = '';
      for (var i = 0; i < upto && i < scene.lines.length; i++) {
        var l = scene.lines[i];
        if (l.c === 'stream') {
          var shown = scene.tokens.slice(0, tokenCount).join('');
          if (!shown) continue;
          s += '<span class="' + acc + '">' + escapeHtml(shown) + '</span>\n';
        } else if (l.c) {
          s += '<span class="' + l.c + '">' + escapeHtml(l.t) + '</span>\n';
        } else {
          s += escapeHtml(l.t) + '\n';
        }
      }
      out.innerHTML = s + '<span class="caret"></span>';
    };
    var play = function (name) {
      current = name;
      var scene = scenes[name];
      term.setAttribute('data-scene', name);
      if (title) title.textContent = scene.title;
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].setAttribute('aria-selected', String(tabs[i].getAttribute('data-scene') === name));
      }
      if (timer) clearTimeout(timer);
      if (reduced) { render(scene, scene.lines.length, scene.tokens.length); return; }

      var si = streamIndex(scene);
      var line = 0, tok = 0;
      render(scene, 0, 0);
      var tick = function () {
        if (line < si) { line++; render(scene, line, 0); timer = setTimeout(tick, 300); return; }
        if (tok < scene.tokens.length) { tok++; render(scene, si + 1, tok); timer = setTimeout(tick, 62); return; }
        render(scene, scene.lines.length, tok);
        timer = setTimeout(function () { line = 0; tok = 0; render(scene, 0, 0); timer = setTimeout(tick, 620); }, 4200);
      };
      timer = setTimeout(tick, 420);
    };

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var scene = this.getAttribute('data-scene');
        if (scene === current) return;
        // Blur-fade the swap so the two states never visibly overlap.
        out.classList.add('switching');
        setTimeout(function () {
          play(scene);
          out.classList.remove('switching');
        }, reduced ? 0 : 140);
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && timer) { clearTimeout(timer); timer = null; }
      else if (!document.hidden && !timer && !reduced) play(current);
    });

    play('studio');
  }
})();
