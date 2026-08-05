(() => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const stories = document.querySelectorAll('[data-platform-story]');

  stories.forEach((story) => {
    const tabs = Array.from(story.querySelectorAll('[data-platform-story-tab]'));
    const panels = Array.from(story.querySelectorAll('[data-platform-story-panel]'));
    const tabList = story.querySelector('.platform-story__tabs');
    const previousButton = story.querySelector('[data-platform-story-previous]');
    const nextButton = story.querySelector('[data-platform-story-next]');
    const position = story.querySelector('[data-platform-story-position]');
    const interval = Number(story.dataset.autoplayInterval) || 7000;

    if (!tabs.length || tabs.length !== panels.length) return;

    let activeIndex = Math.max(0, tabs.findIndex((tab) => tab.classList.contains('is-active')));
    let timer = null;
    let cycleStartedAt = 0;
    let remaining = interval;
    let inViewport = typeof IntersectionObserver === 'undefined';
    let hoverPaused = false;
    let keyboardFocusPaused = false;
    let keyboardInteraction = false;
    let autoplayEnabled = true;

    story.style.setProperty('--platform-story-duration', `${interval}ms`);

    const motionAllowed = () => !reducedMotionQuery.matches;
    const canRun = () => motionAllowed() && autoplayEnabled && inViewport && !hoverPaused && !keyboardFocusPaused && !document.hidden;

    const clearTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };

    const stopAutoplay = () => {
      autoplayEnabled = false;
      clearTimer();
      remaining = interval;
      story.classList.remove('is-auto-playing', 'is-paused');
    };

    const resetProgress = () => {
      story.classList.remove('is-auto-playing');
      story.classList.remove('is-paused');
      void story.offsetWidth;
      if (motionAllowed() && autoplayEnabled) story.classList.add('is-auto-playing');
      if (!canRun() && autoplayEnabled) story.classList.add('is-paused');
    };

    const pauseCycle = () => {
      if (!autoplayEnabled) return;
      if (timer) {
        const elapsed = window.performance.now() - cycleStartedAt;
        remaining = Math.max(80, remaining - elapsed);
      }
      clearTimer();
      if (motionAllowed()) story.classList.add('is-paused');
    };

    const startOrResumeCycle = () => {
      clearTimer();
      if (!canRun()) {
        if (motionAllowed() && autoplayEnabled) story.classList.add('is-paused');
        return;
      }

      story.classList.add('is-auto-playing');
      story.classList.remove('is-paused');
      cycleStartedAt = window.performance.now();
      timer = window.setTimeout(() => {
        activate((activeIndex + 1) % tabs.length, { origin: 'auto', moveFocus: false });
      }, remaining);
    };

    const restartCycle = () => {
      if (!autoplayEnabled) {
        story.classList.remove('is-auto-playing', 'is-paused');
        clearTimer();
        remaining = interval;
        return;
      }
      clearTimer();
      remaining = interval;
      resetProgress();
      startOrResumeCycle();
    };

    const scrollActiveTabIntoView = () => {
      const activeTab = tabs[activeIndex];
      if (!activeTab || !tabList) return;

      const tabLeft = activeTab.offsetLeft;
      const tabRight = tabLeft + activeTab.offsetWidth;
      const visibleLeft = tabList.scrollLeft;
      const visibleRight = visibleLeft + tabList.clientWidth;
      let nextLeft = null;

      if (tabLeft < visibleLeft) nextLeft = Math.max(0, tabLeft - 8);
      if (tabRight > visibleRight) nextLeft = tabRight - tabList.clientWidth + 8;

      if (nextLeft !== null) {
        tabList.scrollTo({ left: nextLeft, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
      }
    };

    const activate = (nextIndex, { origin = 'manual', moveFocus = false } = {}) => {
      activeIndex = (nextIndex + tabs.length) % tabs.length;

      tabs.forEach((tab, index) => {
        const active = index === activeIndex;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel, index) => {
        const active = index === activeIndex;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);

        if (active && motionAllowed()) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      });

      if (position) position.textContent = `${activeIndex + 1} of ${tabs.length}`;
      if (moveFocus) tabs[activeIndex].focus();
      if (origin !== 'initial') scrollActiveTabIntoView();

      if (origin === 'manual') stopAutoplay();
      else if (origin === 'initial') restartCycle();
      else restartCycle();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(index, { origin: 'manual' }));

      tab.addEventListener('keydown', (event) => {
        let nextIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = activeIndex + 1;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = activeIndex - 1;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;

        if (nextIndex !== null) {
          event.preventDefault();
          keyboardInteraction = true;
          activate(nextIndex, { origin: 'manual', moveFocus: true });
        }
      });
    });

    previousButton?.addEventListener('click', () => activate(activeIndex - 1, { origin: 'manual' }));
    nextButton?.addEventListener('click', () => activate(activeIndex + 1, { origin: 'manual' }));

    story.addEventListener('pointerdown', () => {
      keyboardInteraction = false;
    });

    if (hoverQuery.matches) {
      story.addEventListener('pointerenter', () => {
        if (!autoplayEnabled) return;
        hoverPaused = true;
        pauseCycle();
      });

      story.addEventListener('pointerleave', () => {
        if (!autoplayEnabled) return;
        hoverPaused = false;
        startOrResumeCycle();
      });
    }

    story.addEventListener('focusin', () => {
      if (!keyboardInteraction || !autoplayEnabled) return;
      keyboardFocusPaused = true;
      pauseCycle();
    });

    story.addEventListener('focusout', (event) => {
      if (!autoplayEnabled) return;
      if (!story.contains(event.relatedTarget)) {
        keyboardFocusPaused = false;
        startOrResumeCycle();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') keyboardInteraction = true;
    });

    document.addEventListener('visibilitychange', () => {
      if (!autoplayEnabled) return;
      if (document.hidden) pauseCycle();
      else startOrResumeCycle();
    });

    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            inViewport = entry.isIntersecting && entry.intersectionRatio >= 0.4;
            if (!autoplayEnabled) return;
            if (inViewport) startOrResumeCycle();
            else pauseCycle();
          });
        }, { threshold: [0, 0.4, 0.75] })
      : null;

    observer?.observe(story);

    const handleReducedMotionChange = () => {
      clearTimer();
      remaining = interval;
      story.classList.remove('is-auto-playing', 'is-paused');
      if (motionAllowed() && autoplayEnabled) restartCycle();
    };

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }

    activate(activeIndex, { origin: 'initial' });
  });
})();
