// Mobile nav toggle
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');
  if (!toggle || !panel) return;

  function closeMenu() {
    panel.classList.remove('open');
    toggle.textContent = 'Menu';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    toggle.textContent = open ? 'Close' : 'Menu';
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.setAttribute('aria-expanded', String(open));
  });

  panel.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
})();

// Spatial hero depth. Pointer movement shifts the existing visual layers without
// introducing a continuous render loop; reduced-motion and coarse pointers stay static.
(function () {
  var scene = document.querySelector('[data-spatial-scene]');
  if (!scene) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    scene.classList.add('is-entering');
    requestAnimationFrame(function () {
      scene.classList.add('is-ready');
      window.setTimeout(function () { scene.classList.remove('is-entering'); }, 1100);
    });
  }

  if (reduceMotion) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  scene.addEventListener('pointermove', function (event) {
    var rect = scene.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    var y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    scene.style.setProperty('--scene-shift-x', (x * 8).toFixed(2) + 'px');
    scene.style.setProperty('--scene-shift-y', (y * 6).toFixed(2) + 'px');
    scene.style.setProperty('--scene-tilt-x', (y * -2.2).toFixed(2) + 'deg');
    scene.style.setProperty('--scene-tilt-y', (x * 3).toFixed(2) + 'deg');
  }, { passive: true });

  scene.addEventListener('pointerleave', function () {
    scene.style.setProperty('--scene-shift-x', '0px');
    scene.style.setProperty('--scene-shift-y', '0px');
    scene.style.setProperty('--scene-tilt-x', '0deg');
    scene.style.setProperty('--scene-tilt-y', '0deg');
  });
})();

// Accessible 3D project deck. The static two-column grid remains the no-JS and
// reduced-motion fallback; enhancement is limited to wide, precise-pointer screens.
(function () {
  var deck = document.querySelector('[data-project-deck]');
  if (!deck) return;

  var slides = Array.prototype.slice.call(deck.querySelectorAll('.project-feature'));
  var previous = deck.querySelector('[data-deck-prev]');
  var next = deck.querySelector('[data-deck-next]');
  var activeLabel = deck.querySelector('[data-deck-label]');
  var canEnhance = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
  var active = 0;

  function render() {
    slides.forEach(function (slide, index) {
      var offset = index - active;
      var clamped = Math.max(-2, Math.min(2, offset));
      var distance = Math.abs(clamped);
      slide.style.setProperty('--deck-x', (clamped * 54) + '%');
      slide.style.setProperty('--deck-z', (distance * -150) + 'px');
      slide.style.setProperty('--deck-rotate', (clamped * -8) + 'deg');
      slide.style.setProperty('--deck-scale', String(1 - distance * 0.055));
      slide.style.setProperty('--deck-opacity', distance === 0 ? '1' : (distance === 1 ? '0.42' : '0'));
      slide.style.zIndex = String(10 - distance);
      slide.classList.toggle('is-active', offset === 0);
      slide.classList.toggle('is-before', offset < 0);
      slide.classList.toggle('is-after', offset > 0);
      slide.setAttribute('aria-hidden', offset === 0 ? 'false' : 'true');
      slide.tabIndex = offset === 0 ? 0 : -1;
    });
    activeLabel.textContent = slides[active].querySelector('h3').textContent;
  }

  function setActive(index) {
    active = (index + slides.length) % slides.length;
    render();
  }

  function updateMode() {
    if (canEnhance.matches) {
      deck.classList.add('is-enhanced');
      render();
    } else {
      deck.classList.remove('is-enhanced');
      slides.forEach(function (slide) {
        slide.removeAttribute('aria-hidden');
        slide.removeAttribute('tabindex');
        slide.removeAttribute('style');
      });
    }
  }

  previous.addEventListener('click', function () { setActive(active - 1); });
  next.addEventListener('click', function () { setActive(active + 1); });
  deck.addEventListener('keydown', function (event) {
    if (!canEnhance.matches) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); setActive(active - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setActive(active + 1); }
  });
  canEnhance.addEventListener('change', updateMode);
  updateMode();
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
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var glow = document.querySelector('.ambient-cursor-glow');
  if (glow) {
    var pointerFrame = 0;
    var pointerX = 0;
    var pointerY = 0;
    document.addEventListener('pointermove', function (e) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(function () {
        document.documentElement.style.setProperty('--mx', pointerX + 'px');
        document.documentElement.style.setProperty('--my', pointerY + 'px');
        pointerFrame = 0;
      });
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
      open(btn.dataset.full || img.src, img.alt);
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
