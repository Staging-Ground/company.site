'use strict';

const LAUNCH_DATE = new Date('2026-06-01T00:00:00Z');
const CLOCK_INTERVAL_MS = 1000;
const NAV_INTERSECT_THRESHOLD = 0.25;

const $ = (selector, root = document) => {
  try { return root.querySelector(selector); }
  catch { return null; }
};

const $$ = (selector, root = document) => {
  try { return root.querySelectorAll(selector); }
  catch { return document.createDocumentFragment().childNodes; }
};

const pad2 = (n) => String(n).padStart(2, '0');

const formatUptime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${pad2(hours)}h ${pad2(minutes)}m ${pad2(seconds)}s`;
};

const initClock = () => {
  const el = $('#clock-value');
  if (!el) return null;

  const tick = () => {
    const now = new Date();
    el.textContent = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())} UTC`;
  };

  tick();
  return setInterval(tick, CLOCK_INTERVAL_MS);
};

const initUptime = () => {
  const el = $('#uptime-value');
  if (!el) return null;

  const tick = () => {
    el.textContent = formatUptime(Date.now() - LAUNCH_DATE.getTime());
  };

  tick();
  return setInterval(tick, CLOCK_INTERVAL_MS);
};

const initMobileNav = () => {
  const toggle = $('#nav-toggle');
  const menu   = $('#nav-menu');
  if (!toggle || !menu) return;

  const open  = () => { menu.classList.add('is-open');    toggle.setAttribute('aria-expanded', 'true'); };
  const close = () => { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  const isOpen = () => menu.classList.contains('is-open');

  toggle.addEventListener('click', () => isOpen() ? close() : open());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { close(); toggle.focus(); }
  });

  document.addEventListener('click', (e) => {
    if (isOpen() && !toggle.contains(e.target) && !menu.contains(e.target)) close();
  });

  $$('a', menu).forEach((link) => link.addEventListener('click', close));
};

const initActiveNav = () => {
  if (!('IntersectionObserver' in window)) return;

  const navLinks = $$('.nav__link[href^="#"]');
  if (!navLinks.length) return;

  const linkMap = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (id) linkMap.set(id, link);
  });

  const setActive = (id) => {
    navLinks.forEach((link) => link.classList.remove('is-active'));
    const active = linkMap.get(id);
    if (active) active.classList.add('is-active');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { threshold: NAV_INTERSECT_THRESHOLD }
  );

  linkMap.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });

  return observer;
};

const initFooterYear = () => {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
};

const initScrollReveal = () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) return;

  const targets = $$(
    '.audience-card, .service-card, .process-step, .why-card, ' +
    '.principle-card, .contact-card, .cta-banner'
  );

  targets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 500ms ease, transform 500ms ease';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  targets.forEach((el) => observer.observe(el));
  return observer;
};

const _handles = {
  clockInterval:  null,
  uptimeInterval: null,
  navObserver:    null,
  revealObserver: null,
};

const init = () => {
  _handles.clockInterval  = initClock();
  _handles.uptimeInterval = initUptime();
  _handles.navObserver    = initActiveNav();
  _handles.revealObserver = initScrollReveal();
  initMobileNav();
  initFooterYear();
};

const teardown = () => {
  if (_handles.clockInterval)  clearInterval(_handles.clockInterval);
  if (_handles.uptimeInterval) clearInterval(_handles.uptimeInterval);
  if (_handles.navObserver)    _handles.navObserver.disconnect();
  if (_handles.revealObserver) _handles.revealObserver.disconnect();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') teardown();
});
