/* Progressive enhancement: content remains readable without JavaScript. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 931px) and (hover: hover) and (pointer: fine)');
  let cleanup = () => {};

  function setup() {
    cleanup();
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    const animations = new Set();
    const seen = new WeakSet();
    const delays = new WeakMap();
    document.querySelectorAll('.screen-pair, .tour-grid, .journey-track, .points, .highlight-list').forEach(group => {
      [...group.children].forEach((child, index) => delays.set(child, index * 85));
    });
    document.querySelectorAll('.hero-copy > *').forEach((child, index) => delays.set(child, index * 110));
    const heroPhone = document.querySelector('.hero-phone-wrap');
    if (heroPhone) delays.set(heroPhone, 340);
    const targets = document.querySelectorAll('.hero-copy > *, .hero-phone-wrap, .journey-heading, .journey-track > li, .copy > *, .phone-stack, .screen-device, .app-showcase figcaption, .linger-grid article > :not(.app-showcase), .impact-copy > *, .section-head, .tour-card, .about-grid > div, .featured-journey, .preview-copy > :not(.highlight-list), .highlight-list > details, .preview-map, .more-journeys-heading');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        observer.unobserve(entry.target);
        // Never hide the element currently being used from the keyboard.
        if (entry.target.contains(document.activeElement)) return;
        const animation = entry.target.animate([
          { opacity: 0, translate: '0 18px' },
          { opacity: 1, translate: '0 0' }
        ], { duration: 650, delay: delays.get(entry.target) || 0, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.08 });
    targets.forEach(target => observer.observe(target));

    const route = document.querySelector('.journey-track');
    const routeObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        route.classList.add('route-arrived');
        routeObserver.disconnect();
      }
    }, { threshold: 0.2 });
    if (route) routeObserver.observe(route);

    let frame = 0;
    const active = new Set();
    const backgrounds = [...document.querySelectorAll('.hero-bg, .impact-bg')];
    const paint = () => {
      frame = 0;
      active.forEach(background => {
        const rect = background.parentElement.getBoundingClientRect();
        const distance = (innerHeight / 2 - rect.top - rect.height / 2) * 0.035;
        background.style.translate = `0 ${Math.max(-18, Math.min(18, distance)).toFixed(2)}px`;
      });
    };
    const schedule = () => { if (!frame && active.size) frame = requestAnimationFrame(paint); };
    const backgroundObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const background = entry.target.querySelector('.hero-bg, .impact-bg');
        if (entry.isIntersecting) active.add(background); else active.delete(background);
      });
      schedule();
    });
    if (desktop.matches) {
      backgrounds.forEach(background => backgroundObserver.observe(background.parentElement));
      addEventListener('scroll', schedule, { passive: true });
      addEventListener('resize', schedule, { passive: true });
    }
    const focus = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    document.addEventListener('focusin', focus);
    cleanup = () => {
      observer.disconnect();
      routeObserver.disconnect();
      backgroundObserver.disconnect();
      focus();
      cancelAnimationFrame(frame);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      document.removeEventListener('focusin', focus);
      backgrounds.forEach(background => background.style.removeProperty('translate'));
      route?.classList.remove('route-arrived');
    };
  }
  reduced.addEventListener('change', setup);
  desktop.addEventListener('change', setup);
  setup();
})();

/* Sticky chapter companion: native scroll, one scheduled update, no scroll trapping. */
(() => {
  const container = document.querySelector('.journey-chapters');
  if (!container || !('IntersectionObserver' in window)) return;
  const layout = matchMedia('(min-width: 1100px) and (min-height: 740px)');
  const chapters = ['on-the-road','worth-a-stop','bonus-stories','places-to-stay'].map(id => document.getElementById(id));
  const screens = [...container.querySelectorAll('.companion-phone img')];
  const markers = [...container.querySelectorAll('.companion-route span')];
  const caption = container.querySelector('.companion-caption');
  const names = ['On the Road','Worth a Stop','When You Arrive','Stay the Night'];
  let frame = 0, current = -1, visible = false;
  function update() {
    frame = 0;
    if (!layout.matches) return;
    const line = innerHeight * 0.5;
    let next = 0;
    chapters.forEach((chapter, index) => { if (chapter.getBoundingClientRect().top <= line) next = index; });
    if (next === current) return;
    current = next;
    container.classList.toggle('chapter-night', next === 3);
    screens.forEach((screen,index) => screen.classList.toggle('is-current', index === next));
    markers.forEach((marker,index) => {
      marker.classList.toggle('is-current',index === next);
      marker.classList.toggle('is-past',index < next);
    });
    container.style.setProperty('--chapter-progress', next / 3);
    caption.textContent = names[next];
  }
  function schedule() { if (visible && !frame) frame = requestAnimationFrame(update); }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) schedule();
  });
  function configure() {
    cancelAnimationFrame(frame); frame = 0;
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    observer.disconnect();
    container.classList.toggle('chapters-enhanced', layout.matches);
    if (layout.matches) {
      observer.observe(container);
      addEventListener('scroll',schedule,{passive:true});
      addEventListener('resize',schedule,{passive:true});
      update();
    }
  }
  layout.addEventListener('change', configure);
  configure();
})();

/* Three real app states. No timers or automatic audio playback. */
(() => {
  const demo = document.querySelector('.driving-demo');
  if (!demo) return;
  const mobile = document.querySelector('.driving-screen img');
  const companion = document.querySelector('.companion-phone img');
  const description = demo.querySelector('.driving-description');
  const buttons = [...demo.querySelectorAll('[data-driving]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = [
    ['next', 'A glimpse of what’s ahead. See the next story as you follow the route.', 'Open Road showing Dorrington and William Farr as the next story on the route'],
    ['approaching', 'The story gets closer. The app shows you approaching Dorrington and William Farr, about 100 metres away.', 'Open Road approaching the Dorrington and William Farr story, about 100 metres away'],
    ['playing', 'The place comes to life. GPS-triggered narration begins as you reach the story along your route.', 'Open Road now playing Dorrington and William Farr']
  ];
  let current = -1, revision = 0;
  const animations = new Set();
  const stop = () => { animations.forEach(a => a.cancel()); animations.clear(); };
  reduced.addEventListener('change', stop);
  async function select(index) {
    if (current === index) return;
    current = index;
    const token = ++revision;
    const [name, copy, alt] = states[index];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    description.textContent = copy;
    const src = `/app/assets/driving-${name}.webp`;
    const preload = new Image();
    preload.src = src;
    try { await preload.decode(); } catch { return; }
    if (token !== revision) return;
    stop();
    document.querySelectorAll('.driving-surface, .companion-phone').forEach(surface => surface.classList.toggle('radar-active', index === 1));
    [mobile, companion].filter(Boolean).forEach(img => {
      img.src = src;
      if (img === mobile) img.alt = alt;
      if (!reduced.matches && img.getClientRects().length && (img === mobile || img.classList.contains('is-current'))) {
        const animation = img.animate([{opacity:.4},{opacity:1}], {duration:320, easing:'ease-out'});
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    });
  }
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  demo.querySelector('.driving-controls').hidden = false;
  // Stop the decorative pulse while its phone is outside the viewport.
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('radar-visible', entry.isIntersecting)));
    document.querySelectorAll('.driving-surface, .companion-phone').forEach(surface => visibility.observe(surface));
  }
  select(1);
})();

/* Play the real download stages only while their preview is in view. */
(() => {
  const preview = document.querySelector('.download-preview');
  if (!preview) return;
  const image = preview.querySelector('img');
  const link = preview.querySelector('.download-image-link');
  const previous = preview.querySelector('[data-download-prev]');
  const next = preview.querySelector('[data-download-next]');
  const toggle = preview.querySelector('[data-download-play]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = ['ready', 'loading', '0', '20', '64', '95', 'start'];
  const durations = [2400, 1000, 800, 1200, 1200, 1000, 3500];
  let index = 0, timer, visible = false, loaded = false, loading = false;
  let paused = reduced.matches;
  function stop() { clearTimeout(timer); }
  function schedule() {
    stop();
    if (!paused && visible && loaded && !document.hidden) {
      timer = setTimeout(() => { show((index + 1) % stages.length); schedule(); }, durations[index]);
    }
  }
  function show(value) {
    index = Math.max(0, Math.min(stages.length - 1, value));
    const stage = stages[index];
    const description = stage === 'ready' ? 'with the Download Tour button' : stage === 'start' ? 'ready with the Start Tour button' : stage === 'loading' ? 'loading tour data' : `downloading media at ${stage} percent`;
    image.src = `/app/assets/tour-download-${stage}.webp`;
    image.alt = `Ludlow and Shropshire tour ${description}`;
    link.href = image.src;
    link.setAttribute('aria-label', `View full screenshot: ${description} (opens image preview)`);
    previous.disabled = index === 0;
    next.disabled = index === stages.length - 1;
  }
  function updateToggle() {
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play download animation' : 'Pause download animation');
  }
  function manual(value) { paused = true; show(value); updateToggle(); schedule(); }
  previous.addEventListener('click', () => manual(index - 1));
  next.addEventListener('click', () => manual(index + 1));
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); schedule(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updateToggle(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  async function prepare() {
    if (loading || loaded) return;
    loading = true;
    try {
      await Promise.all(stages.map(stage => {
        const frame = new Image();
        frame.src = `/app/assets/tour-download-${stage}.webp`;
        return frame.decode();
      }));
      loaded = true;
    } catch { paused = true; updateToggle(); }
    loading = false;
    schedule();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) prepare();
      schedule();
    }, {threshold: 0.25}).observe(preview);
  } else { visible = true; prepare(); }
  preview.querySelector('.download-stages').hidden = false;
  updateToggle();
})();

(() => {
  const phone = document.querySelector('.phone-hero');
  if (!phone) return;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      phone.classList.toggle('radar-visible', entries[0].isIntersecting);
    }).observe(phone);
  } else { phone.classList.add('radar-visible'); }
})();

/* Thumbnails select a screenshot within their own chapter. */
(() => {
  const ids = ['worth-a-stop', 'bonus-stories', 'places-to-stay'];
  const companion = document.querySelectorAll('.companion-phone > img');
  ids.forEach((id, chapterIndex) => {
    const section = document.getElementById(id);
    const main = section?.querySelector('.section-selected-screen img');
    const buttons = [...(section?.querySelectorAll('.screen-pair button') || [])];
    if (!main) return;
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        const selected = button.querySelector('img');
        main.src = selected.src;
        main.alt = selected.alt;
        if (companion[chapterIndex + 1]) companion[chapterIndex + 1].src = selected.src;
        buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      });
    });
  });
})();

/* Featured journey screenshots share the large preview phone. */
(() => {
  const section = document.querySelector('#shropshire-preview');
  const main = section?.querySelector('.preview-map img');
  const link = section?.querySelector('.preview-map > a');
  const caption = section?.querySelector('.preview-map figcaption');
  if (!main) return;
  const buttons = [...section.querySelectorAll('.preview-select')];
  buttons.forEach(button => button.addEventListener('click', () => {
    const thumbnail = button.querySelector('img');
    const label = thumbnail?.alt || button.textContent.trim();
    main.src = button.dataset.screen;
    main.alt = label;
    link.href = button.dataset.screen;
    link.setAttribute('aria-label', 'Open full screenshot: ' + label + ' (opens image preview)');
    caption.textContent = label;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
})();

/* All full-size image links open in a modal preview. */
(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-lightbox';
  dialog.setAttribute('aria-label', 'Image preview');
  dialog.innerHTML = '<div class="lightbox-toolbar"><span>OPEN ROAD <small>IN FOCUS</small></span><button type="button" aria-label="Close image preview">✕</button></div><div class="lightbox-stage"><img alt=""></div><p class="lightbox-caption"></p>';
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('.lightbox-caption');
  const close = dialog.querySelector('button');
  let opener;
  const isImage = link => /\.(png|jpe?g|webp|gif|avif|svg)(?:[?#]|$)/i.test(link.href);
  document.querySelectorAll('a[href]').forEach(link => {
    if (!isImage(link)) return;
    link.removeAttribute('target');
    link.setAttribute('aria-haspopup', 'dialog');
  });
  document.addEventListener('click', event => {
    const phoneButton = event.target.closest('.companion-enlarge');
    const link = event.target.closest('a[href]');
    if (!phoneButton && (!link || !isImage(link))) return;
    event.preventDefault();
    opener = phoneButton || link;
    const current = phoneButton?.parentElement.querySelector('img.is-current');
    image.src = current ? current.src : link.href;
    image.alt = current ? (current.alt || document.querySelector('.companion-caption').textContent + ' — Open Road app') : (link.querySelector('img')?.alt || link.textContent.trim() || 'Open Road app screenshot');
    caption.textContent = image.alt;
    dialog.showModal();
    document.documentElement.classList.add('lightbox-open');
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.classList.contains('lightbox-stage')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lightbox-open');
    opener?.focus({preventScroll:true});
  });
})();
