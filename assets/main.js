(() => {
  'use strict';

  /* ========================================================================
     1. Conditional Popover Polyfill (only when native Popover API is absent)
     ======================================================================== */
  if (!Object.hasOwn(HTMLElement.prototype, 'popover')) {
    import('https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js').catch(() => {
      // Graceful fallback if offline
    });
  }

  /* ========================================================================
     2. Content-Driven Responsive Navigation Bar
        Measures natural inline row width via ResizeObserver so adding links
        later automatically shifts the collapse threshold with no hard-coded
        breakpoint.
     ======================================================================== */
  const header = document.querySelector('.site-header');
  const headerInner = header?.querySelector('.header-inner');
  const siteMenu = document.getElementById('site-menu');

  if (header && headerInner && siteMenu) {
    let lastHeaderWidth = 0;
    let rafMeasure = 0;
    const supportsPopoverPseudo = CSS.supports('selector(:popover-open)');

    const isMenuOpen = () =>
      (supportsPopoverPseudo && siteMenu.matches(':popover-open')) ||
      siteMenu.classList.contains(':popover-open');

    const syncNavbarLayout = (force = false) => {
      const currentWidth = header.getBoundingClientRect().width;
      const currentlyWide = header.classList.contains('is-wide');

      // When collapsed, only remeasure if the header grew (prevents shrink thrash)
      if (!force && !currentlyWide && currentWidth <= lastHeaderWidth) {
        lastHeaderWidth = currentWidth;
        return;
      }
      lastHeaderWidth = currentWidth;

      const wasOpen = !currentlyWide && isMenuOpen();

      // Suppress transitions during measurement so the menu never flickers
      header.classList.add('is-measuring');
      header.classList.add('is-wide');
      siteMenu.removeAttribute('popover');

      const fitsInline = headerInner.scrollWidth <= headerInner.clientWidth + 1;

      if (fitsInline) {
        header.classList.add('is-wide');
        siteMenu.removeAttribute('popover');
      } else {
        header.classList.remove('is-wide');
        siteMenu.setAttribute('popover', 'auto');
        if (wasOpen && typeof siteMenu.showPopover === 'function') {
          try {
            siteMenu.showPopover();
          } catch {
            // Ignore if already open or polyfill pending
          }
        }
      }

      cancelAnimationFrame(rafMeasure);
      rafMeasure = requestAnimationFrame(() => {
        header.classList.remove('is-measuring');
      });
    };

    const navObserver = new ResizeObserver(() => syncNavbarLayout(false));
    navObserver.observe(header);
    navObserver.observe(siteMenu);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => syncNavbarLayout(true));
    }
    syncNavbarLayout(true);

    // Dismiss collapsed popover menu when clicking an in-page anchor link
    siteMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (!header.classList.contains('is-wide') && typeof siteMenu.hidePopover === 'function') {
          try {
            siteMenu.hidePopover();
          } catch {
            // Ignore if already closed
          }
        }
      });
    });
  }

  /* ========================================================================
     3. Dynamic Copyright Year & Service Quick-Select Links
     ======================================================================== */
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  document.querySelectorAll('[data-select-service]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-select-service');
      const radio = targetId ? document.getElementById(targetId) : null;
      if (radio && radio.type === 'radio') {
        radio.checked = true;
      }
    });
  });

  /* ========================================================================
     4. Scroll-Driven Animations Fallbacks
        Only runs when native CSS scroll-driven animations are absent and the
        user has no reduced-motion preference.
     ======================================================================== */
  const allowsMotion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  if (allowsMotion) {
    const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');
    const supportsViewTimeline = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

    if (!supportsScrollTimeline) {
      const progressBar = document.querySelector('.scroll-progress');
      if (progressBar) {
        let progressTicking = false;
        const updateProgress = () => {
          progressTicking = false;
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
          progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
        };
        window.addEventListener(
          'scroll',
          () => {
            if (!progressTicking) {
              progressTicking = true;
              requestAnimationFrame(updateProgress);
            }
          },
          { passive: true }
        );
        updateProgress();
      }
    }

    if (!supportsViewTimeline) {
      // Parallax layer fallback via IntersectionObserver + passive rAF scroll
      const wrappers = Array.from(document.querySelectorAll('[data-parallax-wrapper]'));
      const activeWrappers = new Set();
      let parallaxTicking = false;

      const updateParallax = () => {
        parallaxTicking = false;
        const vh = window.innerHeight;
        activeWrappers.forEach((wrapper) => {
          const rect = wrapper.getBoundingClientRect();
          const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
          wrapper.querySelectorAll('.parallax-layer').forEach((layer) => {
            const from = Number(layer.dataset.parallaxFrom || -24);
            const to = Number(layer.dataset.parallaxTo || 40);
            const y = from + (to - from) * progress;
            layer.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          });
        });
      };

      const onParallaxScroll = () => {
        if (!parallaxTicking) {
          parallaxTicking = true;
          requestAnimationFrame(updateParallax);
        }
      };

      const parallaxObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) activeWrappers.add(entry.target);
            else activeWrappers.delete(entry.target);
          });
          if (activeWrappers.size > 0) {
            window.addEventListener('scroll', onParallaxScroll, { passive: true });
            updateParallax();
          } else {
            window.removeEventListener('scroll', onParallaxScroll);
          }
        },
        { threshold: 0 }
      );

      wrappers.forEach((w) => parallaxObserver.observe(w));

      // Entry reveal fallback
      const reveals = document.querySelectorAll('.reveal-item');
      reveals.forEach((el) => el.classList.add('js-fallback-reveal'));
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      reveals.forEach((el) => revealObserver.observe(el));
    }
  }

  /* ========================================================================
     5. Accessible Netlify Form Validation & Submission (All [data-td-form])
        - Keeps aria-invalid="false" on load so required fields are never
          announced as invalid before interaction.
        - Links error message ID in aria-describedby ONLY while invalid.
        - Announces newly surfaced blur/change errors via a single polite
          live region after a short delay so speech does not collide.
        - Routes focus to the first invalid field on failed submit.
     ======================================================================== */
  const forms = Array.from(document.querySelectorAll('form[data-td-form], #contactForm'));
  const uniqueForms = Array.from(new Set(forms));

  if (uniqueForms.length > 0) {
    const supportsUserInvalid = CSS.supports('selector(:user-invalid)');

    // Single centralized polite live region for the page
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.classList.add('visually-hidden');
    document.body.append(announcer);

    let announceTimer;
    let announcedField = null;

    const spokenText = (node) => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      return copy.textContent.replace(/\s+/g, ' ').trim();
    };

    const linkError = (el, shown) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const ids = (el.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (shown) ids.push(errorId);
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
      else el.removeAttribute('aria-describedby');
    };

    const announceError = (el) => {
      const errorEl = document.getElementById(el.dataset.error);
      if (!errorEl) return;
      const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
      clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      announceTimer = setTimeout(() => {
        announcer.textContent = label + spokenText(errorEl);
      }, 500);
    };

    uniqueForms.forEach((form) => {
      const successBox =
        (form.dataset.successId && document.getElementById(form.dataset.successId)) ||
        document.getElementById('formSuccess');
      const resetBtn =
        (form.dataset.resetId && document.getElementById(form.dataset.resetId)) ||
        document.getElementById('formReset');
      const submitBtn = form.querySelector('button[type="submit"]');
      const defaultSubmitText = submitBtn ? submitBtn.textContent.trim() : 'Send Message';

      if (!successBox) return;

      const fields = Array.from(form.querySelectorAll('input[data-error], textarea[data-error], select[data-error]'));
      const flagged = new WeakSet();
      const announced = new WeakSet();
      const touched = new WeakSet();

      const isFieldVisuallyInvalid = (el, forceShow = false) => {
        if (el.validity.valid) return false;
        if (forceShow) return true;
        if (supportsUserInvalid && el.matches(':user-invalid')) return true;
        return el.classList.contains('user-invalid-fallback');
      };

      const syncAria = (el, { announce = false, forceShow = false } = {}) => {
        if (!el.matches?.('input, select, textarea')) return true;

        if (forceShow && !el.validity.valid) {
          el.classList.add('user-invalid-fallback');
        } else if (el.validity.valid) {
          el.classList.remove('user-invalid-fallback');
        }

        const invalid = isFieldVisuallyInvalid(el, forceShow);

        if (invalid) {
          if (announce && !announced.has(el)) {
            announceError(el);
            announced.add(el);
          }
          el.setAttribute('aria-invalid', 'true');
          linkError(el, true);
          flagged.add(el);
          return false;
        }

        if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
          el.setAttribute('aria-invalid', 'false');
          linkError(el, false);
          flagged.delete(el);
          announced.delete(el);
          if (announcedField === el) {
            clearTimeout(announceTimer);
            announcer.textContent = '';
          }
        }
        return true;
      };

      // Start every constrained field at aria-invalid="false"
      fields.forEach((el) => {
        el.setAttribute('aria-invalid', 'false');
        linkError(el, false);
      });

      form.addEventListener('input', (e) => {
        const el = e.target;
        if (!el.matches?.('input[data-error], textarea[data-error], select[data-error]')) return;
        touched.add(el);
        if (el.getAttribute('aria-invalid') === 'true' && el.validity.valid) {
          syncAria(el);
        }
      });

      form.addEventListener(
        'blur',
        (e) => {
          const el = e.target;
          if (!el.matches?.('input[data-error], textarea[data-error], select[data-error]')) return;
          if (touched.has(el)) {
            syncAria(el, { announce: true, forceShow: !el.validity.valid });
          }
        },
        true
      );

      form.addEventListener(
        'change',
        (e) => {
          const el = e.target;
          if (!el.matches?.('input[data-error], textarea[data-error], select[data-error]')) return;
          touched.add(el);
          syncAria(el, { announce: true, forceShow: !el.validity.valid });
        },
        true
      );

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let firstInvalid = null;
        fields.forEach((el) => {
          if (!el.validity.valid) {
            announced.add(el);
            syncAria(el, { announce: false, forceShow: true });
            if (!firstInvalid) firstInvalid = el;
          } else {
            syncAria(el);
          }
        });

        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
        }

        try {
          if (window.location.protocol.startsWith('http')) {
            await fetch(form.getAttribute('action') || '/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams(new FormData(form)).toString(),
            });
          }
        } catch {
          // Local preview falls through cleanly to confirmation state
        } finally {
          form.hidden = true;
          successBox.hidden = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = defaultSubmitText;
          }
          successBox.focus();
        }
      });

      resetBtn?.addEventListener('click', () => {
        form.reset();
        fields.forEach((el) => {
          touched.delete(el);
          announced.delete(el);
          flagged.delete(el);
          el.classList.remove('user-invalid-fallback');
          el.setAttribute('aria-invalid', 'false');
          linkError(el, false);
        });
        announcer.textContent = '';
        successBox.hidden = true;
        form.hidden = false;
        fields[0]?.focus();
      });
    });
  }
})();
