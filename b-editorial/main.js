/* STAYDROP — b-editorial
   CSS + IntersectionObserver 중심. 각 기능은 독립적으로 실행되어 하나가 실패해도 나머지는 동작한다. */
(function () {
  'use strict';

  var root = document.documentElement;
  var anim = root.classList.contains('anim');
  var fine = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[sd]', e); } }

  window.__sdReady = true;

  /* ── 로딩 인트로: body 페이드인 + 가이드라인 scaleY ── */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-loaded'); });
  });

  /* ── Lenis: 관성은 약하게 ── */
  var lenis = null;
  safe(function () {
    if (!anim || !fine || typeof window.Lenis !== 'function') return;
    lenis = new window.Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  });

  function scrollToTarget(target) {
    var el = typeof target === 'string' ? $(target) : target;
    var y = el ? el.getBoundingClientRect().top + window.pageYOffset : 0;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: anim ? 'smooth' : 'auto' });
  }

  /* ── 페이지 내 이동(카테고리 · Discover More · 바로가기 탭 · Page Top) ── */
  safe(function () {
    $$('[data-to]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.id === 'qtab' && !fine && !b.classList.contains('is-open')) { b.classList.add('is-open'); return; }
        scrollToTarget(b.getAttribute('data-to'));
        if (b.id === 'qtab') b.classList.remove('is-open');
      });
    });
    var top = $('#pageTop');
    if (top) top.addEventListener('click', function () { scrollToTarget(null); });
  });

  /* ── 헤더: 한 화면 이상 내려간 뒤 위로 스크롤하면 내려온다 ── */
  safe(function () {
    var hdr = $('#hdr');
    if (!hdr) return;
    var last = window.pageYOffset, ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset, vh = window.innerHeight;
      root.classList.toggle('is-scrolled', y > vh * 0.6);
      if (y <= 4) {
        hdr.classList.remove('is-stuck', 'is-shown');
      } else if (y > vh) {
        if (!hdr.classList.contains('is-stuck')) {
          hdr.classList.add('is-stuck');
          void hdr.offsetHeight; // translateY(-100%) 상태를 먼저 확정
        }
        if (y < last - 2) hdr.classList.add('is-shown');
        else if (y > last + 2) hdr.classList.remove('is-shown');
      } else if (y > last + 2) {
        hdr.classList.remove('is-shown');
      }
      last = y;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });

  /* ── 모바일 메뉴(이동 없음, 열고 닫기만) ── */
  safe(function () {
    var burger = $('#burger'), mnav = $('#mnav'), close = $('#mnavClose');
    if (!burger || !mnav) return;
    function set(open) {
      mnav.classList.toggle('is-open', open);
      mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { set(true); });
    if (close) close.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  });

  /* ── KV 페이드 슬라이더 ── */
  safe(function () {
    var kv = $('#kv');
    if (!kv) return;
    var slides = $$('.kv__slide', kv), dotsBox = $('#kvDots');
    var cur = 0, timer = null, prevTimer = null, dots = [];

    slides.forEach(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'kv__dot' + (i === 0 ? ' is-active' : '');
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', (i + 1) + '번째 슬라이드');
      d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      d.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(d);
      dots.push(d);
      if (i !== 0) s.setAttribute('aria-hidden', 'true');
    });

    function schedule() {
      clearTimeout(timer);
      if (!anim) return; // reduced motion: 자동 전환 없음
      var dur = parseInt(slides[cur].getAttribute('data-dur'), 10) || 6000;
      timer = setTimeout(function () { go(cur + 1); }, dur);
    }

    function go(n) {
      n = (n + slides.length) % slides.length;
      if (n === cur) return;
      var prev = slides[cur], next = slides[n];
      clearTimeout(prevTimer);
      slides.forEach(function (s) { s.classList.remove('is-prev'); });
      prev.classList.remove('is-active');
      prev.classList.add('is-prev');           // 새 장이 페이드인하는 동안 아래에서 줌을 유지
      prev.setAttribute('aria-hidden', 'true');
      next.classList.add('is-active');
      next.removeAttribute('aria-hidden');
      dots[cur].classList.remove('is-active'); dots[cur].setAttribute('aria-selected', 'false');
      dots[n].classList.add('is-active'); dots[n].setAttribute('aria-selected', 'true');
      prevTimer = setTimeout(function () { prev.classList.remove('is-prev'); }, 1100);
      cur = n;
      schedule();
    }

    $('#kvPrev').addEventListener('click', function () { go(cur - 1); });
    $('#kvNext').addEventListener('click', function () { go(cur + 1); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer); else schedule();
    });
    schedule();

    /* 마우스 위치에 따른 미세한 깊이 이동: 배경 ±10px, 텍스트 반대 방향 ±4px */
    if (anim && fine) {
      var tx = 0, ty = 0, cx = 0, cy = 0, running = false, inView = true;
      kv.addEventListener('mousemove', function (e) {
        var r = kv.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * -20;
        ty = ((e.clientY - r.top) / r.height - 0.5) * -20;
        start();
      });
      kv.addEventListener('mouseleave', function () { tx = 0; ty = 0; start(); });
      function start() { if (!running && inView) { running = true; requestAnimationFrame(tick); } }
      function tick() {
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
        kv.style.setProperty('--mx', cx.toFixed(2));
        kv.style.setProperty('--my', cy.toFixed(2));
        if (inView && (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02)) requestAnimationFrame(tick);
        else running = false;
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(kv);
      }
    }
  });

  /* ── 리빌(1회): .rv 슬라이드(IntersectionObserver), .clip 좌→우 ──
     clip-path로 가려진 요소는 IntersectionObserver가 교차 면적 0으로 보므로 .clip은 위치를 직접 잰다. */
  safe(function () {
    if (!anim) return;
    var rvs = $$('.rv'), clips = $$('.clip');
    if (!('IntersectionObserver' in window)) {
      rvs.concat(clips).forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sibs = el.parentNode ? $$(':scope > .rv', el.parentNode) : [];
        var idx = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = (Math.min(idx, 4) * 0.08) + 's';
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1600);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    rvs.forEach(function (el) { io.observe(el); });

    var ticking = false;
    function check() {
      ticking = false;
      var vh = window.innerHeight;
      clips = clips.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { el.classList.add('is-in'); return false; }
        if (r.bottom <= 0) { el.classList.add('is-in'); return false; } // 이미 지나친 것은 바로 연다
        return true;
      });
      if (!clips.length) {
        window.removeEventListener('scroll', req);
        window.removeEventListener('resize', req);
      }
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    req();
  });

  /* ── 아주 약한 스크롤 패럴랙스: 12% 큰 이미지를 translateY ── */
  safe(function () {
    if (!anim) return;
    var items = $$('.plx').map(function (el) { return { el: el, inner: $('.ph__in', el), on: false }; })
      .filter(function (it) { return it.inner; });
    if (!items.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (it) {
        if (!it.on) return;
        var r = it.el.getBoundingClientRect();
        var p = ((r.top + r.height / 2) - vh / 2) / ((vh + r.height) / 2);
        if (p < -1) p = -1; else if (p > 1) p = 1;
        it.inner.style.transform = 'translate3d(0,' + (-p * 5).toFixed(3) + '%,0)';
      });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          items.forEach(function (it) { if (it.el === en.target) it.on = en.isIntersecting; });
        });
        req();
      }, { rootMargin: '10% 0px 10% 0px' });
      items.forEach(function (it) { io.observe(it.el); });
    } else {
      items.forEach(function (it) { it.on = true; });
    }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    req();
  });

  /* ── 배경 영상: 화면에 들어왔을 때만 재생 ── */
  safe(function () {
    var v = $('.full__video');
    if (!v || !anim || !('IntersectionObserver' in window)) return;
    v.muted = true;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    }, { threshold: 0.15 }).observe(v);
  });

  /* ── 마키 일시정지 ── */
  safe(function () {
    var btn = $('#mqPause'), track = $('#mqTrack');
    if (!btn || !track) return;
    btn.addEventListener('click', function () {
      var paused = track.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? '갤러리 흐름 다시 재생' : '갤러리 흐름 일시정지');
    });
    if ('IntersectionObserver' in window) {
      // 화면 밖에서는 멈춰 둔다
      new IntersectionObserver(function (es) {
        track.style.animationPlayState = es[0].isIntersecting ? '' : 'paused';
      }).observe(track.parentNode);
    }
  });

  /* ── FAQ 아코디언 ── */
  safe(function () {
    $$('.faq__q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq__item');
        var open = item.classList.toggle('is-open');
        q.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  });

  /* ── 문의 폼: 화면만 ── */
  safe(function () {
    var form = $('#ctcForm'), note = $('#ctcNote');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (note) note.textContent = '데모 화면입니다. 실제로 전송되지 않습니다.';
    });
  });
})();
