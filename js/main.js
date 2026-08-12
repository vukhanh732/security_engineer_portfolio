// 3D page transitions for same-origin navigation
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.body.classList.add('page-enter');

  window.addEventListener('pageshow', function () {
    document.body.classList.remove('page-exit');
    document.body.classList.add('page-enter');
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

    event.preventDefault();
    document.body.classList.remove('page-enter');
    document.body.classList.add('page-exit');
    window.setTimeout(function () { window.location.href = url.href; }, 390);
  });
})();

// Mobile nav toggle
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');
  if (!toggle || !panel) return;

  function closeMenu() {
    panel.classList.remove('open');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    toggle.textContent = open ? '✕' : '☰';
    toggle.setAttribute('aria-expanded', String(open));
  });

  panel.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
})();

// Scroll-reveal for sections
(function () {
  var targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(function (el) { observer.observe(el); });
})();

// Cursor-following ambient glow + per-card spotlight hover
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var glow = document.querySelector('.ambient-cursor-glow');
  if (glow) {
    document.addEventListener('pointermove', function (e) {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
  }

  var spotlightEls = document.querySelectorAll('.project-card, .skill-card, .blog-card, .extra-card, .edu-card');
  spotlightEls.forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', (e.clientX - rect.left) + 'px');
      el.style.setProperty('--spot-y', (e.clientY - rect.top) + 'px');
    }, { passive: true });
  });
})();

// Study notes photo lightbox
(function () {
  var triggers = document.querySelectorAll('.notes-photo-btn');
  var lightbox = document.querySelector('.lightbox');
  if (!triggers.length || !lightbox) return;

  var lightboxImg = lightbox.querySelector('img');
  var closeBtn = lightbox.querySelector('.lightbox-close');

  function open(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('open');
  }

  function close() {
    lightbox.classList.remove('open');
  }

  triggers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      open(img.src, img.alt);
    });
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

// Role-based hero variants - reached via /it-support, /software-engineer,
// /security-engineer (rewritten to this page by netlify.toml) or ?role=
// query param for local testing. Root path keeps the neutral hero in the HTML.
(function () {
  var eyebrow = document.querySelector('.hero-eyebrow');
  var title = document.querySelector('.hero-title');
  var lead = document.querySelector('.hero-lead');
  if (!eyebrow || !title || !lead) return;

  var variants = {
    'it-support': {
      pageTitle: 'Vu Luu - IT Support',
      description: 'Vu Luu is an IT support engineer with hands-on Active Directory, Entra ID, and networking experience, backed by a live SOC lab and a distributed SIEM.',
      eyebrow: 'IT SUPPORT · SYSTEMS & SECURITY',
      heroTitle: 'Vu Luu supports real systems.',
      heroLead: 'IT support experience across identity, endpoints, and networking, backed by a live SOC lab and distributed SIEM.'
    },
    'software-engineer': {
      pageTitle: 'Vu Luu - Software Engineer',
      description: 'Vu Luu is a software engineer building tested systems: a distributed SIEM backend, a CI/CD pipeline, and full-stack apps.',
      eyebrow: 'SOFTWARE ENGINEER',
      heroTitle: 'Vu Luu builds real systems.',
      heroLead: 'Software developer building tested systems end to end, from distributed backends to production full-stack applications.'
    },
    'security-engineer': {
      pageTitle: 'Vu Luu - Security Engineer',
      description: 'Vu Luu combines software development with hands-on depth across detection engineering, identity security, and DevSecOps automation.',
      eyebrow: 'SECURITY ENGINEERING GRADUATE',
      heroTitle: 'Vu Luu engineers secure systems.',
      heroLead: 'Software developer with hands-on depth in detection engineering, identity security, and DevSecOps automation.'
    }
  };

  var params = new URLSearchParams(window.location.search);
  var key = params.get('role') || window.location.pathname.replace(/^\/|\/$/g, '');
  var variant = variants[key];
  if (!variant) return;

  document.title = variant.pageTitle;
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', variant.description);

  eyebrow.textContent = variant.eyebrow;
  var cursor = document.createElement('span');
  cursor.className = 'hero-cursor';
  eyebrow.appendChild(cursor);

  title.textContent = variant.heroTitle;
  lead.textContent = variant.heroLead;
})();
