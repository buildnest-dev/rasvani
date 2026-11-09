'use client';

import { useEffect } from 'react';

/**
 * Site-wide motion orchestration for the Rasvani experience.
 * Motion is progressive enhancement: content remains visible and usable without JS.
 */
export function SiteMotionDirector() {
  useEffect(() => {
    let startTimer: number | undefined;
    let stopMotion: (() => void) | undefined;

    // App Router can hydrate streamed child segments after the parent layout's
    // effects have started. Do not annotate React-owned DOM until the document
    // has loaded and the initial hydration pass has had time to settle.
    const initialiseMotion = () => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (reducedMotion.matches || typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') {
      root.dataset.motionPreference = 'reduced';
      return () => { delete root.dataset.motionPreference; };
    }

    root.dataset.motionPreference = 'full';
    root.dataset.motionReady = 'true';

    const revealSelectors = [
      '.featured-orbit-card', '.regional-story-feature', '.home-producer-grid',
      '.better-choice-panel', '.explore-india-feature', '.explore-page-hero-grid',
      '.explore-search-section', '.region-directory', '.region-card',
      '.map-page-hero .wrap', '.map-visual-stage', '.map-region-panel',
      '.map-selection-view', '.district-selection-panel', '.map-foods-view',
      '.region-category-discovery', '.region-category-list a', '.region-food-card-premium', '.district-food-card-premium', '.regional-product-art',
      '.product-detail-panel', '.product-detail-gallery figure', '.product-regional-card',
      '.producer-public-grid', '.journal-hero-grid', '.journal-pillar-art',
      '.better-choice-pillars article', '.better-choice-boundary',
      '.district-heritage-note', '.region-heritage-note',
    ].join(',');

    const tiltSelectors = [
      '.featured-orbit-card', '.region-card', '.region-food-card-premium',
      '.district-food-card-premium', '.product-regional-card', '.journal-pillar-art', '.producer-public-art',
      '.explore-hero-art', '.product-detail-gallery figure',
    ].join(',');

    const imageSelectors = [
      '.hero-main-disc', '.hero-floating-disc', '.featured-image-orbit',
      '.regional-story-image', '.producer-image-main', '.producer-image-inset',
      '.explore-feature-image', '.explore-hero-art', '.journal-hero-image',
      '.journal-pillar-art', '.regional-product-art', '.product-detail-gallery figure',
      '.product-recovery-image', '.producer-public-art',
    ].join(',');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          element.classList.add('motion-in-view');
          revealObserver.unobserve(element);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    const tracked = new Set<HTMLElement>();
    const register = (scope: ParentNode = document) => {
      const collect = (selector: string) => {
        const found = Array.from(scope.querySelectorAll<HTMLElement>(selector));
        if (scope instanceof HTMLElement && scope.matches(selector)) found.unshift(scope);
        return Array.from(new Set(found));
      };
      collect(revealSelectors).forEach((element, index) => {
        if (element.closest('.admin-dash, .customer-orders-page, .cart-page, .checkout-form, [data-no-motion]')) return;
        if (!element.dataset.motionReveal) {
          element.dataset.motionReveal = 'true';
          element.style.setProperty('--motion-stagger', `${Math.min(index % 5, 4) * 65}ms`);
          revealObserver.observe(element);
        }
      });
      collect(tiltSelectors).forEach((element) => {
        if (!element.dataset.motionTilt) element.dataset.motionTilt = 'true';
      });
      collect(imageSelectors).forEach((element, index) => {
        if (!element.dataset.motionImage) {
          element.dataset.motionImage = ['hero', 'editorial', 'gallery'][index % 3];
          tracked.add(element);
        }
      });
    };

    register();
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) register(node);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const failsafe = window.setInterval(() => {
      document.querySelectorAll<HTMLElement>('[data-motion-reveal]:not(.motion-in-view)').forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < (window.innerHeight || 800)) element.classList.add('motion-in-view');
      });
    }, 1000);

    let activeTilt: HTMLElement | null = null;
    let scrollFrame = 0;
    const updateParallax = () => {
      scrollFrame = 0;
      const viewport = window.innerHeight || 1;
      tracked.forEach((element) => {
        if (!element.isConnected) { tracked.delete(element); return; }
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > viewport + 120) return;
        const progress = (viewport - rect.top) / (viewport + rect.height);
        const centered = Math.max(-1, Math.min(1, (progress - 0.5) * 2));
        element.style.setProperty('--motion-scroll', centered.toFixed(3));
      });
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateParallax);
    };
    // Do not write per-element inline styles during the first effect pass: in
    // streamed App Router pages, child content may still be hydrating. The
    // parallax value starts at its CSS default (0) and updates on first scroll
    // or resize, avoiding a server/client style mismatch.
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType !== 'mouse') return;
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-motion-tilt]');
      if (!target) {
        if (activeTilt) {
          activeTilt.style.setProperty('--motion-rotate-x', '0deg');
          activeTilt.style.setProperty('--motion-rotate-y', '0deg');
          activeTilt.classList.remove('motion-pointer-active');
          activeTilt = null;
        }
        return;
      }
      if (activeTilt && activeTilt !== target) {
        activeTilt.style.setProperty('--motion-rotate-x', '0deg');
        activeTilt.style.setProperty('--motion-rotate-y', '0deg');
        activeTilt.classList.remove('motion-pointer-active');
      }
      activeTilt = target;
      const rect = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      target.style.setProperty('--motion-rotate-x', `${((0.5 - y) * 5).toFixed(2)}deg`);
      target.style.setProperty('--motion-rotate-y', `${((x - 0.5) * 7).toFixed(2)}deg`);
      target.classList.add('motion-pointer-active');
    };
    const onPointerLeave = () => {
      if (!activeTilt) return;
      activeTilt.style.setProperty('--motion-rotate-x', '0deg');
      activeTilt.style.setProperty('--motion-rotate-y', '0deg');
      activeTilt.classList.remove('motion-pointer-active');
      activeTilt = null;
    };
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.clearInterval(failsafe);
      mutationObserver.disconnect();
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      delete root.dataset.motionReady;
      delete root.dataset.motionPreference;
    };
    };

    const scheduleInitialisation = () => {
      // The delay is intentional: it prevents MutationObserver/IntersectionObserver
      // from changing data-* attributes and inline styles while React is still
      // hydrating streamed route content.
      startTimer = window.setTimeout(() => {
        stopMotion = initialiseMotion();
      }, 1200);
    };

    if (document.readyState === 'complete') {
      scheduleInitialisation();
    } else {
      window.addEventListener('load', scheduleInitialisation, { once: true });
    }

    return () => {
      window.removeEventListener('load', scheduleInitialisation);
      if (startTimer !== undefined) window.clearTimeout(startTimer);
      stopMotion?.();
    };
  }, []);

  return null;
}
