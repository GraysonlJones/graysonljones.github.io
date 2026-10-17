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
