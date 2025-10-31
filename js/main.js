// ==============================
// js/main.js
// Vishnu Tours — main interactions (cleaned & optimized)
// ==============================

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------------- config ---------------- */
    var HEADER_OFFSET = 72;
    var HERO_PARALLAX_FACTOR = 0.22;
    var MAX_PARALLAX = 120; // px
    var TESTIMONIAL_AUTOPLAY_MS = 4000;
    var FLEET_AUTOPLAY_MS = 4500;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- elements ---------------- */
    var header = document.getElementById('site-header');
    var hero = document.getElementById('hero');
    var heroBg = document.querySelector('.hero-bg');
    var navToggle = document.querySelector('.nav-toggle');
    var navClose = document.getElementById('nav-close');
    var navBackdrop = document.getElementById('nav-backdrop');
    var body = document.body;

    /* ---------------- helpers ---------------- */
    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qAll(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ------------- smooth anchors ------------- */
    (function initAnchors() {
      var anchors = qAll('a[href^="#"]');
      anchors.forEach(function (link) {
        link.addEventListener('click', function (ev) {
          var href = link.getAttribute('href');
          if (!href || href === '#') return;
          var target = document.querySelector(href);
          if (!target) return;
          ev.preventDefault();

          // close mobile nav if open
          if (body.classList.contains('nav-open')) closeNav();

          var top = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
          window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
          // fallback to ensure final position
          setTimeout(function () { window.scrollTo({ top: top, behavior: 'auto' }); }, prefersReduced ? 0 : 600);
        });
      });
    })();

    /* -------- header scroll state (shrink) -------- */
    function updateHeader() {
      var heroHeight = hero ? hero.offsetHeight : 500;
      if (window.scrollY > (heroHeight - 100)) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    /* ---------------- mobile nav (single source) ---------------- */
    function openNav() {
      body.classList.add('nav-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
      if (navBackdrop) navBackdrop.setAttribute('aria-hidden', 'false');
      // prevent page scroll while panel is open
      document.documentElement.style.overflow = 'hidden';
      // focus first link for accessibility
      var first = document.querySelector('.primary-nav .nav-list a');
      if (first) first.focus();
    }

    function closeNav() {
      body.classList.remove('nav-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      if (navBackdrop) navBackdrop.setAttribute('aria-hidden', 'true');
      // restore scroll
      document.documentElement.style.overflow = '';
      // return focus to hamburger
      if (navToggle) navToggle.focus();
    }

    (function initMobileNav() {
      // If nav elements missing, no-op gracefully
      if (!navToggle && !navClose && !navBackdrop) return;

      navToggle && navToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (body.classList.contains('nav-open')) closeNav(); else openNav();
      });

      navClose && navClose.addEventListener('click', function (e) { e.stopPropagation(); closeNav(); });
      navBackdrop && navBackdrop.addEventListener('click', function () { closeNav(); });

      // close when any nav link clicked
      qAll('.nav-list a').forEach(function (a) {
        a.addEventListener('click', function () { closeNav(); });
      });

      // close on escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && body.classList.contains('nav-open')) closeNav();
      });

      // if window resizes to desktop, ensure nav closed
      window.addEventListener('resize', function () {
        if (window.innerWidth > 900 && body.classList.contains('nav-open')) closeNav();
      }, { passive: true });
    })();

    /* ---------------- parallax (clamped & GPU friendly) ---------------- */
    (function initParallax() {
      if (!heroBg) return;
      if (prefersReduced) { heroBg.style.transform = 'translate3d(0,0,0)'; return; }

      var ticking = false;
      function tickParallax() {
        var widthOK = window.innerWidth > 780;
        if (!widthOK) {
          heroBg.style.transform = 'translate3d(0,0,0)';
          ticking = false;
          return;
        }
        var raw = Math.max(0, window.scrollY) * HERO_PARALLAX_FACTOR;
        var off = clamp(raw, 0, MAX_PARALLAX);
        heroBg.style.transform = 'translate3d(0,' + Math.round(off) + 'px,0)';
        ticking = false;
      }

      window.addEventListener('scroll', function () {
        if (!ticking) { window.requestAnimationFrame(tickParallax); ticking = true; }
      }, { passive: true });

      // avoid image dragging (UX)
      qAll('.hero-bg img').forEach(function (img) { img.setAttribute('draggable', 'false'); });
    })();

    /* --------------- reveal observer --------------- */
    (function initReveals() {
      var selector = '.hero-content, .reveal, .reveal-stagger, .tour-card, .fleet-card, .usp-item, .testimonial';
      var nodes = qAll(selector);
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

        nodes.forEach(function (n) { obs.observe(n); });
      } else {
        nodes.forEach(function (n) { n.classList.add('visible'); });
      }

      // ensure hero content visible quickly
      setTimeout(function () {
        qAll('.hero-content').forEach(function (el) { el.classList.add('visible'); });
      }, 200);
    })();

    /* ------------------- filters ------------------- */
    (function initFilters() {
      var buttons = qAll('.filter-btn');
      if (!buttons.length) return;
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var f = btn.dataset.filter || 'all';
          var cards = qAll('.tour-card');
          cards.forEach(function (card) {
            if (f === 'all') card.classList.remove('hidden');
            else {
              var matches = (card.dataset.region === f) || (card.dataset.type === f);
              if (matches) card.classList.remove('hidden'); else card.classList.add('hidden');
            }
          });
        });
      });
    })();

    /* --------------- prefill booking --------------- */
    (function initPrefill() {
      var packageInput = document.getElementById('package-input');
      var vehicleSelect = document.getElementById('vehicle-select');
      var buttons = qAll('.btn-prefill');
      if (!buttons.length) return;
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var pkg = btn.dataset.package || '';
          var veh = btn.dataset.vehicle || '';
          if (pkg && packageInput) packageInput.value = pkg;
          if (veh && vehicleSelect) {
            var found = false;
            Array.prototype.forEach.call(vehicleSelect.options, function (opt) {
              if (opt.value && opt.value.toLowerCase() === veh.toLowerCase()) { opt.selected = true; found = true; }
            });
            if (!found) vehicleSelect.value = veh;
          }
          var anchor = document.querySelector('a[href="#booking"]');
          if (anchor) anchor.click();
        });
      });
    })();

    /* ----------------- form UX ----------------- */
    /* ----------------- form UX (WhatsApp-only) ----------------- */
(function initForm() {
  var form = document.getElementById('booking-form');
  var resultEl = document.getElementById('form-result');
  if (!form) return;

  // Change this to your WhatsApp number in international format (no +, no spaces)
  var WHATSAPP_NUMBER = '919414196282';

  // Helper: simple trim + safe text
  function val(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function showStatus(msg, isError) {
    if (!resultEl) return;
    resultEl.textContent = msg;
    resultEl.style.opacity = 1;
    resultEl.style.color = isError ? '#b00020' : ''; // optional color
    if (!isError) {
      setTimeout(function () { resultEl.style.opacity = 0; }, 5000);
    }
  }

  function buildMessage() {
    var name = val('name') || '—';
    var phone = val('phone') || '—';
    var email = val('email') || '—';
    var pickup = val('pickup') || '—';
    var drop = val('drop') || '—';
    var from_date = val('from_date') || '—';
    var to_date = val('to_date') || '—';
    var vehicle = val('vehicle') || '—';
    var pkg = val('package') || '—';
    var msg = val('message') || '—';

    var lines = [
      'New booking request — Vishnu Tours',
      '',
      'Name: ' + name,
      'Phone: ' + phone,
      'Email: ' + email,
      'Pickup city: ' + pickup,
      'Destination: ' + drop,
      'From: ' + from_date,
      'To: ' + to_date,
      'Vehicle: ' + vehicle,
      'Package: ' + pkg,
      'Message: ' + msg,
      '',
      '— Sent from website'
    ];
    return lines.join('\n');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    // basic validation
    var name = val('name'), phone = val('phone'), pickup = val('pickup'), drop = val('drop'), from_date = val('from_date');
    if (!name) { showStatus('Please enter your name.', true); form.querySelector('[name="name"]').focus(); return; }
    if (!/^\d{10}$/.test(phone)) { showStatus('Please enter a valid 10-digit phone number.', true); form.querySelector('[name="phone"]').focus(); return; }
    if (!pickup) { showStatus('Please enter pickup city.', true); form.querySelector('[name="pickup"]').focus(); return; }
    if (!drop) { showStatus('Please enter destination.', true); form.querySelector('[name="drop"]').focus(); return; }
    if (!from_date) { showStatus('Please select a start date.', true); form.querySelector('[name="from_date"]').focus(); return; }

    // Build message and encode for URL
    var message = buildMessage();
    var encoded = encodeURIComponent(message);

    // WhatsApp URL (web + mobile support)
    var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encoded;

    // UX: show sending state
    showStatus('Opening WhatsApp…');

    // Try open in new tab/window
    var win = window.open(waUrl, '_blank');
    if (win) {
      // Focus the new window/tab and show success to user
      try { win.focus(); } catch (e) { /* ignore */ }
      showStatus('WhatsApp opened — please review the message and tap Send.');
      // optional: reset form after small delay
      setTimeout(function () { try { form.reset(); } catch (e) {} }, 800);
    } else {
      // Popup blocked or restricted — fallback: copy to clipboard and inform user
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(function () {
          showStatus('Could not open WhatsApp automatically — message copied to clipboard. Paste it in WhatsApp to send.');
        }, function () {
          showStatus('Could not open WhatsApp or copy message — please send this message manually: ' + message, true);
        });
      } else {
        // Old browsers: show final text for manual copy
        showStatus('Could not open WhatsApp automatically. Please copy this message and send to ' + WHATSAPP_NUMBER + ':\n\n' + message, true);
      }
    }
  });
})();


    /* ------------- testimonials carousel ------------- */
    (function initTestimonials() {
      var wrap = document.querySelector('.testimonials-wrap');
      if (!wrap) return;
      var slides = qAll('.testimonials-wrap .testimonial');
      if (slides.length <= 1) return;

      var mover = document.createElement('div');
      mover.className = 'testimonials-mover';
      mover.style.display = 'flex';
      mover.style.width = (slides.length * 100) + '%';
      mover.style.transition = 'transform 450ms ease';

      slides.forEach(function (sl) {
        sl.style.width = (100 / slides.length) + '%';
        sl.style.flex = '0 0 ' + (100 / slides.length) + '%';
        mover.appendChild(sl);
      });

      wrap.innerHTML = '';
      wrap.appendChild(mover);

      var idx = 0, autoplay;
      function start() { autoplay = setInterval(function () { idx = (idx + 1) % slides.length; mover.style.transform = 'translateX(-' + (idx * 100) + '%)'; }, TESTIMONIAL_AUTOPLAY_MS); }
      function stop() { clearInterval(autoplay); }
      start();
      mover.addEventListener('mouseenter', stop);
      mover.addEventListener('focusin', stop);
      mover.addEventListener('mouseleave', start);
    })();

    /* ---------------- fleet slider (arrows + pointer drag + autoplay) ---------------- */
    (function initFleetSlider() {
      var slider = document.querySelector('.fleet-slider');
      if (!slider) return;

      // find or create mover
      var mover = q('.fleet-mover', slider);
      if (!mover) {
        var wrapper = document.createElement('div');
        wrapper.className = 'fleet-mover';
        var children = qAll('.fleet-card', slider);
        if (!children.length) return;
        children.forEach(function (c) { wrapper.appendChild(c); });
        slider.appendChild(wrapper);
        mover = wrapper;
      }

      var prev = q('.fleet-nav.prev', slider);
      var next = q('.fleet-nav.next', slider);
      var cards = qAll('.fleet-card', mover);
      if (!cards.length) { prev && prev.remove(); next && next.remove(); return; }

      var index = 0, perView = 3, autoplayId = null;

      function updatePerView() {
        var w = window.innerWidth;
        perView = (w <= 640) ? 1 : (w <= 1000 ? 2 : 3);
      }
      updatePerView();

      function getGap() {
        var st = getComputedStyle(mover);
        var g = parseFloat(st.gap || st.columnGap || st.rowGap || 0);
        return isNaN(g) ? 16 : g;
      }

      function cardWidthPx() {
        var rect = cards[0].getBoundingClientRect();
        return rect.width + getGap();
      }

      function clampIndex(i) {
        return Math.max(0, Math.min(i, Math.max(0, cards.length - perView)));
      }

      function goTo(i, smooth) {
        index = clampIndex(i);
        var cw = cardWidthPx();
        var x = -(index * cw);
        mover.style.transition = (smooth === false) ? 'none' : 'transform 380ms cubic-bezier(.2,.9,.2,1)';
        mover.style.transform = 'translate3d(' + Math.round(x) + 'px,0,0)';
      }

      prev && prev.addEventListener('click', function () { goTo(index - 1); });
      next && next.addEventListener('click', function () { goTo(index + 1); });

      // pointer drag
      var isDown = false, startX = 0, startTransform = 0;
      function getCurrentTranslate() {
        var t = getComputedStyle(mover).transform;
        if (!t || t === 'none') return 0;
        var m = t.match(/matrix.*\((.+)\)/);
        if (m) {
          var values = m[1].split(', ');
          return parseFloat(values[4]) || 0;
        }
        return 0;
      }

      mover.addEventListener('pointerdown', function (e) {
        isDown = true;
        mover.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startTransform = getCurrentTranslate();
        mover.style.transition = 'none';
        stopAutoplay();
      });

      mover.addEventListener('pointermove', function (e) {
        if (!isDown) return;
        var dx = e.clientX - startX;
        mover.style.transform = 'translate3d(' + (startTransform + dx) + 'px,0,0)';
      });

      function endDrag(e) {
        if (!isDown) return;
        isDown = false;
        var current = getCurrentTranslate();
        var moved = current - startTransform;
        var threshold = cardWidthPx() / 4;
        if (moved < -threshold) goTo(index + 1);
        else if (moved > threshold) goTo(index - 1);
        else goTo(index);
        startAutoplay();
      }

      mover.addEventListener('pointerup', endDrag);
      mover.addEventListener('pointercancel', function () { if (isDown) { isDown = false; goTo(index); startAutoplay(); } });

      window.addEventListener('resize', function () { updatePerView(); goTo(index, false); }, { passive: true });

      // autoplay (gentle)
      function startAutoplay() {
        stopAutoplay();
        if (cards.length <= perView) return;
        autoplayId = setInterval(function () {
          var nextIndex = (index + 1) > (cards.length - perView) ? 0 : index + 1;
          goTo(nextIndex);
        }, FLEET_AUTOPLAY_MS);
      }
      function stopAutoplay() { if (autoplayId) { clearInterval(autoplayId); autoplayId = null; } }

      slider.addEventListener('mouseenter', stopAutoplay);
      slider.addEventListener('mouseleave', startAutoplay);

      // init
      setTimeout(function () { updatePerView(); goTo(0, false); startAutoplay(); }, 60);
    })();

  }); // DOMContentLoaded
})();
