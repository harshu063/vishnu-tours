/* js/main.js
   Interactions: parallax, header, nav, filters, prefill, form UX, reveals, testimonials
*/
(function () {
  document.addEventListener('DOMContentLoaded', () => {

    const HEADER_OFFSET = 72;
    const HERO_PARALLAX_FACTOR = 0.22;
    const TESTIMONIAL_AUTOPLAY_MS = 4000;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const header = document.getElementById('site-header');
    const hero = document.getElementById('hero');
    const heroBg = document.querySelector('.hero-bg');
    const navToggle = document.querySelector('.nav-toggle');
    const body = document.body;

    // Smooth anchors with offset
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();

        if (body.classList.contains('nav-open')) {
          body.classList.remove('nav-open');
          navToggle?.setAttribute('aria-expanded', 'false');
        }

        const top = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
        window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
        setTimeout(() => window.scrollTo({ top, behavior: 'auto' }), prefersReduced ? 0 : 600);
      });
    });

    // Header on scroll
    function updateHeaderOnScroll() {
      const heroHeight = hero ? hero.offsetHeight : 500;
      if (window.scrollY > (heroHeight - 100)) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    updateHeaderOnScroll();
    window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });

    // Mobile nav toggle
    navToggle?.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      body.classList.toggle('nav-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        navToggle?.setAttribute('aria-expanded', 'false');
      }
    });

    // Parallax (rAF)
    if (heroBg && !prefersReduced) {
      let ticking = false;
      function parallaxTick() {
        const widthOK = window.innerWidth > 800;
        if (!widthOK) {
          heroBg.style.transform = 'translateY(0px)';
          ticking = false;
          return;
        }
        const offset = Math.max(0, window.scrollY) * HERO_PARALLAX_FACTOR;
        heroBg.style.transform = `translateY(${offset}px)`;
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(parallaxTick);
          ticking = true;
        }
      }, { passive: true });
    }

    // IntersectionObserver reveals
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

      const targets = document.querySelectorAll('.hero-content, .reveal, .reveal-stagger, .tour-card, .fleet-card, .usp-item, .testimonial');
      targets.forEach(t => revealObserver.observe(t));
    } else {
      document.querySelectorAll('.hero-content, .reveal, .reveal-stagger, .tour-card, .fleet-card, .usp-item, .testimonial')
        .forEach(el => el.classList.add('visible'));
    }

    // Make hero content visible quickly
    setTimeout(() => {
      document.querySelectorAll('.hero-content').forEach(h => h.classList.add('visible'));
    }, 200);

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.tour-card').forEach(card => {
          if (filter === 'all') card.classList.remove('hidden');
          else {
            const matches = (card.dataset.region === filter) || (card.dataset.type === filter);
            if (matches) card.classList.remove('hidden'); else card.classList.add('hidden');
          }
        });
      });
    });

    // Prefill booking form
    const packageInput = document.getElementById('package-input');
    const vehicleSelect = document.getElementById('vehicle-select');

    document.querySelectorAll('.btn-prefill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pkg = btn.dataset.package || '';
        const vehicle = btn.dataset.vehicle || '';
        if (pkg && packageInput) packageInput.value = pkg;
        if (vehicle && vehicleSelect) {
          let found = false;
          Array.from(vehicleSelect.options).forEach(opt => {
            if (opt.value.toLowerCase() === vehicle.toLowerCase()) { opt.selected = true; found = true; }
          });
          if (!found) vehicleSelect.value = vehicle;
        }
        const bookingAnchor = document.querySelector('a[href="#booking"]');
        if (bookingAnchor) bookingAnchor.click();
      });
    });

    // Form UX feedback
    const form = document.getElementById('booking-form');
    const resultEl = document.getElementById('form-result');
    if (form) {
      form.addEventListener('submit', (e) => {
        // quick inline validation for phone
        const phone = form.querySelector('input[name="phone"]');
        if (phone && !/^\d{10}$/.test(phone.value.trim())) {
          e.preventDefault();
          resultEl.textContent = 'Please enter a valid 10-digit phone number.';
          resultEl.style.opacity = 1;
          phone.focus();
          return;
        }

        resultEl.textContent = 'Sending...';
        resultEl.style.opacity = 1;
        setTimeout(() => {
          resultEl.textContent = 'Thanks! We received your request. We will contact you soon.';
          form.reset();
          setTimeout(()=> { resultEl.style.opacity = 0; }, 6000);
        }, 1200);
      });
    }

    // Testimonials carousel
    (function initTestimonials() {
      const wrap = document.querySelector('.testimonials-wrap');
      if (!wrap) return;
      const slides = Array.from(wrap.querySelectorAll('.testimonial'));
      if (slides.length <= 1) return;

      const mover = document.createElement('div');
      mover.className = 'testimonials-mover';
      mover.style.display = 'flex';
      mover.style.width = `${slides.length * 100}%`;
      mover.style.transition = 'transform 450ms ease';
      slides.forEach(sl => {
        sl.style.width = `${100 / slides.length}%`;
        sl.style.flex = `0 0 ${100 / slides.length}%`;
        mover.appendChild(sl);
      });
      wrap.innerHTML = '';
      wrap.appendChild(mover);

      let idx = 0;
      let autoplay;
      const start = () => {
        autoplay = setInterval(() => {
          idx = (idx + 1) % slides.length;
          mover.style.transform = `translateX(-${idx * 100}%)`;
        }, TESTIMONIAL_AUTOPLAY_MS);
      };
      const stop = () => clearInterval(autoplay);

      start();
      mover.addEventListener('mouseenter', stop);
      mover.addEventListener('focusin', stop);
      mover.addEventListener('mouseleave', start);
    })();

  }); // DOMContentLoaded
})();
