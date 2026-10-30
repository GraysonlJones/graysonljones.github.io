// Scroll reveals: each [data-rid] block waits (paused) until it scrolls into view, then plays once.
// Contact uses data-link (its "transmission"); every other block uses data-seen.
// Only JS hides content: without JS, or with reduced motion, every section is static and fully visible.
(function () {
  var els = [].slice.call(document.querySelectorAll('[data-rid]'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!els.length || reduce || !('IntersectionObserver' in window)) return;

  var key = function (el) { return el.getAttribute('data-rid') === 'contact' ? 'link' : 'seen'; };
  els.forEach(function (el) { el.dataset[key(el)] = 'idle'; });

  var start = function () {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.dataset[key(e.target)] = 'on';
      });
    }, { threshold: 0.2 });
    els.forEach(function (el) { io.observe(el); });
  };

  // Start only once layout has settled (fonts loaded + two frames), so blocks
  // don't all report "visible" while the page is still laying out.
  var settle = function () { requestAnimationFrame(function () { requestAnimationFrame(start); }); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
    .then(function () { setTimeout(settle, 250); });
})();

// Starfield parallax: publish the scroll offset as --sy for body::before (see style.css).
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var queued = false;
  var update = function () {
    root.style.setProperty('--sy', window.scrollY);
    queued = false;
  };
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
})();

// "Copy email" button: copies the address shown in the contact link.
(function () {
  var btn = document.querySelector('.copy-btn');
  var link = document.querySelector('.email');
  var status = document.querySelector('.copy-status');
  if (!btn || !link) return;
  var timer;
  var say = function (msg) {
    if (!status) return;
    status.textContent = msg;
    clearTimeout(timer);
    timer = setTimeout(function () { status.textContent = ''; }, 2500);
  };
  btn.addEventListener('click', function () {
    var address = link.textContent.trim();
    var fallback = function () {
      var t = document.createElement('textarea');
      t.value = address;
      t.setAttribute('readonly', '');
      t.style.position = 'absolute';
      t.style.left = '-9999px';
      document.body.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
      say(ok ? 'Copied' : 'Press ⌘C / Ctrl+C to copy');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(address).then(function () { say('Copied'); }, fallback);
    } else {
      fallback();
    }
  });
})();

// Writeups: folder tabs, plus an in-page PDF reader on wide screens.
// Without JS every folder is listed and each entry is a plain link to its PDF.
(function () {
  var section = document.getElementById('writeups');
  if (!section) return;
  section.classList.add('wu-js');

  var tablist = section.querySelector('.wu-tabs');
  var tabs = [].slice.call(section.querySelectorAll('.wu-tab'));
  var select = function (tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tablist.hidden = false;
  select(tabs[0]);
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      select(tabs[(n + tabs.length) % tabs.length], true);
    });
  });

  // Phones show embedded PDFs badly (iOS renders only page one), so they keep the plain link.
  var wide = window.matchMedia('(min-width: 900px)');
  var reader = section.querySelector('.wu-reader');
  var frame = reader.querySelector('.wu-frame');
  var title = reader.querySelector('.wu-reader-title');
  var full = reader.querySelector('.wu-full');
  var dl = reader.querySelector('.wu-dl');
  var current;
  var close = function () {
    reader.hidden = true;
    frame.removeAttribute('src');
    if (current) { current.removeAttribute('aria-current'); current.focus(); }
    current = null;
  };
  section.querySelectorAll('.wu-open').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!wide.matches) return;
      e.preventDefault();
      if (current) current.removeAttribute('aria-current');
      current = a;
      a.setAttribute('aria-current', 'true');
      var href = a.getAttribute('href');
      frame.src = href + '#navpanes=0&view=FitH';   // hide the thumbnail sidebar, fit page width
      full.href = href;
      dl.href = href;
      title.textContent = a.querySelector('.wu-title').textContent;
      reader.hidden = false;
      reader.scrollIntoView({ block: 'nearest' });   // smooth unless reduced motion, via html's scroll-behavior
    });
  });
  reader.querySelector('.wu-close').addEventListener('click', close);
})();

// Under-construction notice: opens once per browser session. Remove at launch.
(function () {
  var d = document.getElementById('uc');
  if (!d || typeof d.showModal !== 'function') return;
  try { if (sessionStorage.getItem('uc-seen')) return; } catch (e) {}
  d.showModal();
  d.addEventListener('close', function () {
    try { sessionStorage.setItem('uc-seen', '1'); } catch (e) {}
  });
  // Click outside the card closes it too.
  d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
})();
