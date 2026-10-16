/* STAYDROP — a-magazine
   GSAP ScrollTrigger(scrub) + position:sticky + Lenis
   연출 초기 상태는 전부 JS에서만 건다(html.js-anim). JS 실패/모션 축소 시 본문은 그대로 보인다. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 900px)').matches;
  var lenis = null;

  /* ───────── 항상 동작하는 것 ───────── */

  // machine_cut 이 아직 없으면 machine_master 로 대체
  (function () {
    var img = $('#careMachine'), panel = $('#carePanel');
    if (!img) return;
    var swap = function () {
      if (img.dataset.swapped) return;
      img.dataset.swapped = '1';
      panel.classList.add('is-fallback');
      img.src = img.dataset.fallback;
    };
    img.addEventListener('error', swap);
    if (img.complete && img.naturalWidth === 0) swap();
  })();

  // 문의 폼: 화면만
  (function () {
    var form = $('#inquiry'), msg = $('#formMsg');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = '데모 화면입니다. 실제 전송은 이루어지지 않습니다.';
    });
  })();

  // 페이지 내 이동(문의 섹션으로)
  $$('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = $(btn.dataset.goto);
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { duration: 1.8 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  var video = $('.hero__video');
  if (video) {
    if (reduce) { video.removeAttribute('autoplay'); video.pause(); }
    else { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  /* ───────── 연출 시작 ───────── */
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('js-anim');

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var vw = function (n) { return window.innerWidth * n / 100; };

  /* 헤더·플로팅 버튼 색 반전 (어두운 구간 위에서 흰색) */
  (function () {
    var hd = $('#hd'), fab = $('#fab');
    var on = { logo: [], nav: [], fab: [] };
    var set = function (key, el, active) {
      var i = on[key].indexOf(el);
      if (active && i < 0) on[key].push(el);
      if (!active && i >= 0) on[key].splice(i, 1);
      hd.classList.toggle('logo-light', on.logo.length > 0);
      hd.classList.toggle('nav-light', on.nav.length > 0);
      fab.classList.toggle('is-light', on.fab.length > 0);
    };
    $$('[data-dark]').forEach(function (sec) {
      var full = sec.dataset.dark === 'full';
      if (!full && isMobile) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 44px', end: 'bottom 44px',
        onToggle: function (s) { set('logo', sec, s.isActive); if (full) set('nav', sec, s.isActive); }
      });
      if (full) {
        ScrollTrigger.create({
          trigger: sec, start: 'top bottom-=70', end: 'bottom bottom-=70',
          onToggle: function (s) { set('fab', sec, s.isActive); }
        });
      }
    });
    ScrollTrigger.create({
      start: 120, end: 'max',
      onToggle: function (s) { fab.classList.toggle('is-small', s.isActive); },
      // 내려갈 때는 메뉴를 접고(로고만 남김), 올라올 때 다시 보인다
      onUpdate: function (s) { hd.classList.toggle('nav-hide', s.direction > 0 && s.scroll() > window.innerHeight * 0.6); },
      onLeaveBack: function () { hd.classList.remove('nav-hide'); }
    });
    ScrollTrigger.create({
      trigger: '#contact', start: 'top 75%', end: 'bottom top',
      onToggle: function (s) { fab.classList.toggle('is-hidden', s.isActive); }
    });
  })();

  /* 01 HERO */
  gsap.from('.hero__label span, .hero__title .ln > span, .hero__sub span', {
    yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: 0.12, delay: 0.25
  });
  gsap.from('.hero__foot', { autoAlpha: 0, duration: 1.2, delay: 1.2 });
  gsap.to('.hero__body', {
    yPercent: -14, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: true }
  });
  gsap.to('.hero__media', {
    scale: 1.14, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* 02 NAVY — 아웃라인 글자가 가로로 흐른다 */
  gsap.fromTo('.navy__ghost', { xPercent: 12 }, {
    xPercent: -78, ease: 'none',
    scrollTrigger: { trigger: '.navy', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
  });
  gsap.from('.navy__copy > *', {
    y: 60, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.navy', start: 'top 45%', once: true }
  });

  /* 공통 fade-up */
  var revealIn = function (els, stagger) {
    gsap.to(els, {
      autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: stagger, overwrite: true,
      clearProps: 'transform'
    });
  };
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 50 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: function (batch) { revealIn(batch, 0.12); }
  });
  $$('[data-reveal-group]').forEach(function (group) {
    var items = Array.prototype.slice.call(group.children);
    gsap.set(items, { autoAlpha: 0, y: 70 });
    ScrollTrigger.create({
      trigger: group, start: 'top 85%', once: true,
      onEnter: function () { revealIn(items, 0.16); }
    });
  });

  /* 04 화보 — clip 리빌 + 사진별 패럴랙스 + 배경 글자 */
  $$('.ch').forEach(function (ch) {
    $$('.fig', ch).forEach(function (fig) {
      var clip = $('.fig__clip', fig), img = $('img', fig);
      var speed = parseFloat(fig.dataset.speed || 0) * (isMobile ? 1.6 : 1);
      gsap.fromTo(clip, { clipPath: 'inset(0% 0% 100% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut',
        scrollTrigger: { trigger: fig, start: 'top 82%', once: true },
        onComplete: function () { gsap.set(clip, { clearProps: 'clipPath' }); }
      });
      gsap.fromTo(img, { scale: 1.18 }, {
        scale: 1, duration: 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: fig, start: 'top 82%', once: true }
      });
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      if (speed) {
        gsap.fromTo(fig, { y: function () { return vw(-speed); } }, {
          y: function () { return vw(speed); }, ease: 'none',
          scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
        });
      }
    });
    var word = $('.bigword', ch);
    if (word) {
      gsap.fromTo(word, { xPercent: 8 }, {
        xPercent: -8, ease: 'none',
        scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: 0.4 }
      });
    }
    var badge = $('.badge', ch);
    if (badge) {
      gsap.from(badge, {
        scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: badge, start: 'top 88%', once: true }
      });
    }
  });

  /* 05 BRIDGE — scale 2→1, opacity 0→1 */
  gsap.timeline({
    scrollTrigger: { trigger: '.bridge', start: 'top 85%', end: 'bottom bottom', scrub: 0.4 }
  })
    .fromTo('.bridge__txt', { scale: 2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, ease: 'power1.out', duration: 0.7 })
    .to({}, { duration: 0.3 });

  /* 06 PRODUCT FILM — 프레임 시퀀스 스크럽 */
  (function () {
    var film = $('#film'), stage = $('.film__stage'), canvas = $('#filmCanvas');
    if (!film || !canvas) return;
    var ctx = canvas.getContext('2d');
    var FRAME_DIR = '../assets/frames/orbit_';
    var STEP = isMobile ? 2 : 1;                // 모바일은 60장만
    var TOTAL = Math.floor(120 / STEP);
    var frames = new Array(TOTAL);
    var mode = 'pending';                       // pending | frames | still
    var still = null;
    var st = { p: 0 };
    var lastKey = '';

    var pad = function (n) { return ('00' + n).slice(-3); };
    var srcOf = function (i) { return FRAME_DIR + pad(i * STEP + 1) + '.webp'; };

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; lastKey = ''; }
      render();
    }

    function pick() {
      if (mode === 'frames') {
        var want = Math.round(st.p * (TOTAL - 1)), i;
        for (i = want; i >= 0; i--) if (frames[i]) return { img: frames[i], key: 'f' + i, zoom: 1, pan: 0 };
        for (i = want + 1; i < TOTAL; i++) if (frames[i]) return { img: frames[i], key: 'f' + i, zoom: 1, pan: 0 };
      }
      if (still) {
        // 프레임이 없을 때: 한 장을 천천히 당겨 보는 정도의 움직임
        return { img: still, key: 's' + st.p.toFixed(4), zoom: 1 + 0.26 * st.p, pan: (0.5 - st.p) * 0.05 };
      }
      return null;
    }

    function render() {
      var f = pick();
      if (!f) return;
      var cw = canvas.width, ch = canvas.height;
      var key = f.key + '|' + cw + 'x' + ch;
      if (key === lastKey) return;
      lastKey = key;
      var ir = f.img.naturalWidth / f.img.naturalHeight, cr = cw / ch;
      var portrait = cr < 0.8;
      var w, h, cy = 0.5;
      if (portrait) { w = cw * 2.2; h = w / ir; cy = 0.36; }
      else if (ir > cr) { h = ch; w = h * ir; }
      else { w = cw; h = w / ir; }
      w *= f.zoom; h *= f.zoom;
      var x = (cw - w) / 2 + f.pan * cw, y = ch * cy - h / 2;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(f.img, x, y, w, h);
      if (portrait) {
        var fade = h * 0.22, g;
        g = ctx.createLinearGradient(0, y, 0, y + fade);
        g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, y - 1, cw, fade + 1);
        g = ctx.createLinearGradient(0, y + h - fade, 0, y + h);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000');
        ctx.fillStyle = g; ctx.fillRect(0, y + h - fade, cw, fade + 1);
      }
    }

    function loadStill() {
      mode = 'still';
      var img = new Image();
      img.onload = function () { still = img; lastKey = ''; render(); };
      img.src = '../assets/img/machine_master.webp';
    }

    function loadRest() {
      var next = 1, active = 0, MAX = 6;
      (function pump() {
        while (active < MAX && next < TOTAL) {
          (function (i) {
            active++;
            var img = new Image();
            img.decoding = 'async';
            img.onload = function () { frames[i] = img; active--; lastKey = ''; render(); pump(); };
            img.onerror = function () { active--; pump(); };
            img.src = srcOf(i);
          })(next++);
        }
      })();
    }

    // 첫 프레임으로 시퀀스 존재 여부 확인
    var first = new Image();
    first.onload = function () { frames[0] = first; mode = 'frames'; lastKey = ''; render(); loadRest(); };
    first.onerror = loadStill;
    first.src = srcOf(0);

    resize();
    window.addEventListener('resize', resize);
    ScrollTrigger.addEventListener('refresh', resize);

    var callouts = $$('.callout', film);
    var nowEl = $('#filmNow');
    var T0 = 0.13, GAP = 0.215;
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: film, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: function (self) {
          var i = Math.max(0, Math.min(callouts.length - 1, Math.floor((self.progress - T0) / GAP)));
          var txt = ('0' + (i + 1)).slice(-2);
          if (nowEl.textContent !== txt) nowEl.textContent = txt;
        }
      }
    });
    tl.to(st, { p: 1, duration: 1, ease: 'none', onUpdate: render }, 0);
    tl.to('#filmBar', { scaleX: 1, duration: 1, ease: 'none' }, 0);
    tl.to('.film__intro', { autoAlpha: 0, y: -50, duration: 0.06, ease: 'power1.in' }, 0.05);
    callouts.forEach(function (c, i) {
      var s = T0 + i * GAP;
      tl.fromTo(c, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.055, ease: 'power2.out' }, s);
      if (i < callouts.length - 1) tl.to(c, { autoAlpha: 0, y: -60, duration: 0.055, ease: 'power2.in' }, s + 0.155);
    });
  })();

  /* 07 FULL-CARE — 제품 컷 레이어 시차 */
  gsap.fromTo('.care__machine', { yPercent: 5 }, {
    yPercent: -3, ease: 'none',
    scrollTrigger: { trigger: '.care__panel', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.fromTo('.care__ghost', { xPercent: 8 }, {
    xPercent: -8, ease: 'none',
    scrollTrigger: { trigger: '.care__panel', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.from('.care__panel', {
    clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut', clearProps: 'clipPath',
    scrollTrigger: { trigger: '.care__panel', start: 'top 80%', once: true }
  });

  /* 08 SPLIT — 우측 블록이 중앙에 오면 좌측 비주얼 교체 */
  (function () {
    var slides = $$('.split__slide'), blocks = $$('.blk[data-slide]');
    var now = $('#splitNow'), total = $('#splitTotal'), label = $('#splitLabel');
    var current = -1;
    function show(blk) {
      var i = parseInt(blk.dataset.slide, 10);
      if (i === current) return;
      current = i;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      blocks.forEach(function (b) { b.classList.toggle('is-active', b === blk); });
      now.textContent = blk.dataset.count || '';
      total.style.visibility = blk.dataset.count ? 'visible' : 'hidden';
      label.textContent = blk.dataset.label;
    }
    blocks.forEach(function (blk) {
      ScrollTrigger.create({
        trigger: blk, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (s) { if (s.isActive) show(blk); }
      });
    });
    if (blocks[0]) blocks[0].classList.add('is-active');
  })();

  /* 09 CONTACT */
  gsap.fromTo('.contact__ghost', { xPercent: 10 }, {
    xPercent: -6, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: 0.4 }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
