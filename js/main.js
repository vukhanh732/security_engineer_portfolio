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

// Role-based hero variants — reached via /it-support, /software-engineer,
// /security-engineer (rewritten to this page by netlify.toml) or ?role=
// query param for local testing. Root path keeps the neutral hero in the HTML.
(function () {
  var eyebrow = document.querySelector('.hero-eyebrow');
  var title = document.querySelector('.hero-title');
  var lead = document.querySelector('.hero-lead');
  if (!eyebrow || !title || !lead) return;

  var variants = {
    'it-support': {
      pageTitle: 'Vu Luu — IT Support',
      description: 'Vu Luu — IT support engineer with hands-on Active Directory, Entra ID, and networking experience, backed by a live SOC lab and a distributed SIEM.',
      eyebrow: 'IT SUPPORT · SYSTEMS & SECURITY',
      heroTitle: 'Vu Luu — IT support, hands-on with real systems.',
      heroLead: 'UNSW Computer Science graduate (Security Engineering major), CompTIA Security+ and ISC2 CC certified. I’ve supported real users and infrastructure — Active Directory, Entra ID, Intune, networking, incident triage — and built a live SOC lab and a distributed SIEM to go past ticket-level troubleshooting.'
    },
    'software-engineer': {
      pageTitle: 'Vu Luu — Software Engineer',
      description: 'Vu Luu — software engineer building tested, production-grade systems: a distributed SIEM backend, a CI/CD pipeline, and full-stack apps.',
      eyebrow: 'SOFTWARE ENGINEER',
      heroTitle: 'Vu Luu — software engineer.',
      heroLead: 'UNSW Computer Science graduate, currently a Software Developer at Cybercore Solutions. I build real, tested systems end to end — a distributed SIEM backend (FastAPI, Elasticsearch, Redis, RabbitMQ), a CI/CD pipeline, and a full-stack app, BrainTrain (Next.js, Supabase, Vitest) — verified against real data, not mocked.'
    },
    'security-engineer': {
      pageTitle: 'Vu Luu — Security Engineering Graduate',
      description: 'Vu Luu — Security Engineering graduate building hands-on depth across detection engineering, identity security, and DevSecOps automation.',
      eyebrow: 'SECURITY ENGINEERING GRADUATE',
      heroTitle: 'Vu Luu — building toward Security Engineering.',
      heroLead: 'UNSW Computer Science graduate (Security Engineering major), CompTIA Security+ and ISC2 CC certified. I build working detection systems — a distributed SIEM, a live SOC lab, a CI/CD security gate — to earn real depth across detection engineering, identity security, and DevSecOps automation.'
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
