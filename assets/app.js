/* Швейная мастерская «Золотая пчёлка» — поведение страницы.
   Значения (сдвиг карточек 95px, подъём 30px, масштаб 1.035, счётчик 1400 мс
   с easeOutCubic) сняты с эталонной страницы, а не выдуманы. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- вопросы и ответы ---------- */
  function setupFaq() {
    var items = document.querySelectorAll('.faq-item > button[aria-controls]');
    Array.prototype.forEach.call(items, function (button) {
      button.addEventListener('click', function () {
        var open = button.getAttribute('aria-expanded') === 'true';
        Array.prototype.forEach.call(items, function (other) {
          var answer = document.getElementById(other.getAttribute('aria-controls'));
          other.setAttribute('aria-expanded', 'false');
          if (answer) answer.hidden = true;
        });
        if (!open) {
          button.setAttribute('aria-expanded', 'true');
          var answer = document.getElementById(button.getAttribute('aria-controls'));
          if (answer) answer.hidden = false;
        }
      });
    });
  }

  /* ---------- выпадающее меню «Ещё» ---------- */
  function setupMoreMenu() {
    var toggle = document.querySelector('.site-more-toggle');
    var panel = document.getElementById('site-more-pages');
    if (!toggle || !panel) return;

    function close() {
      toggle.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    }

    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });
    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.site-header-menu')) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
  }

  /* ---------- счётчики в блоке «О мастерской» ---------- */
  function setupCounters() {
    var nodes = document.querySelectorAll('.about-stats strong[aria-label]');
    if (!nodes.length) return;

    function run(strong) {
      var span = strong.querySelector('span');
      if (!span) return;
      var target = parseInt((strong.getAttribute('aria-label') || '').replace(/\D/g, ''), 10);
      if (!target) return;
      var suffix = (strong.getAttribute('aria-label') || '').replace(/[\d\s]/g, '');
      if (reduced) {
        span.textContent = target + suffix;
        return;
      }
      span.textContent = '0' + suffix;
      var duration = 1400;
      var started = null;
      window.setTimeout(function () {
        window.requestAnimationFrame(function step(now) {
          if (started === null) started = now;
          var p = Math.min(1, (now - started) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          span.textContent = Math.round(target * eased) + suffix;
          if (p < 1) window.requestAnimationFrame(step);
        });
      }, 200);
    }

    var seen = new WeakSet();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          run(entry.target);
        }
      });
    }, { threshold: 0.4 });

    Array.prototype.forEach.call(nodes, function (strong) {
      var span = strong.querySelector('span');
      if (span && !reduced) span.textContent = '0' + (strong.getAttribute('aria-label') || '').replace(/[\d\s]/g, '');
      observer.observe(strong);
    });
  }

  /* ---------- веер отзывов ---------- */
  function setupStack() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.hover-stack-card'));
    if (!cards.length) return;

    var base = cards.map(function (card) {
      return {
        rotation: card.style.getPropertyValue('--card-rotation') || '0deg',
        zIndex: card.style.zIndex || ''
      };
    });

    function rest() {
      cards.forEach(function (card, i) {
        card.style.transform = 'translate(0px, 0px) rotate(' + base[i].rotation + ') scale(1)';
        card.style.zIndex = base[i].zIndex;
      });
    }

    function lift(index) {
      cards.forEach(function (card, i) {
        if (i === index) {
          card.style.transform = 'translate(0px, -30px) rotate(0deg) scale(1.035)';
          card.style.zIndex = '20';
        } else {
          var shift = i < index ? '-95px' : '95px';
          card.style.transform = 'translate(' + shift + ', 0px) rotate(' + base[i].rotation + ') scale(1)';
          card.style.zIndex = base[i].zIndex;
        }
      });
    }

    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () { lift(i); });
      card.addEventListener('focus', function () { lift(i); });
      card.addEventListener('mouseleave', rest);
      card.addEventListener('blur', rest);
    });
    rest();
  }

  /* ---------- спираль фотографий в тёмной полосе ----------
     Тот же алгоритм, что в оригинале: спираль с убывающим радиусом,
     точки расставлены равномерно по длине дуги, плитка повёрнута
     по касательной и уменьшается к центру. Параметры секции —
     turns 3.5, speed .7, spacing 7, spread 5, размер 180, радиус 8. */
  function setupSpiral() {
    var hosts = document.querySelectorAll('.community-spiral');
    Array.prototype.forEach.call(hosts, function (host) {
      var list = (host.getAttribute('data-photos') || '').split(',').filter(Boolean);
      if (!list.length) return;
      var box = host.querySelector('div');
      if (!box) return;
      var canvas = box.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        box.appendChild(canvas);
      }
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var TURNS = 3.5, SPEED = 0.7, SPACING = 7, SPREAD = 5,
          ATTENUATION = 2, IMAGE_SIZE = 180, FADE_IN = 20, CORNER = 8;

      var images = list.map(function (src) {
        var img = new Image();
        img.src = src.trim();
        return img;
      });

      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var width = 0, height = 0;
      function resize() {
        width = box.clientWidth || 600;
        height = box.clientHeight || 600;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }
      resize();
      if (window.ResizeObserver) new ResizeObserver(resize).observe(box);
      else window.addEventListener('resize', resize);

      var TAU = Math.PI * 2;
      function point(t, radius) {
        var angle = t * TURNS * TAU, r = radius * (1 - t);
        return { x: r * Math.cos(angle), y: -r * Math.sin(angle) };
      }

      // равномерная расстановка по длине дуги: таблица длин и обратная к ней
      var STEPS = 2000, cum = new Float32Array(STEPS + 1), prev = point(0, 1);
      for (var s = 1; s <= STEPS; s++) {
        var p = point(s / STEPS, 1), dx = p.x - prev.x, dy = p.y - prev.y;
        cum[s] = cum[s - 1] + Math.sqrt(dx * dx + dy * dy);
        prev = p;
      }
      var arcTotal = cum[STEPS] || 1;
      var lut = new Float32Array(1025), cursor = 0;
      for (var k = 0; k <= 1024; k++) {
        var target = k / 1024 * arcTotal;
        while (cursor < STEPS && cum[cursor + 1] < target) cursor++;
        var span = cum[cursor + 1] - cum[cursor];
        lut[k] = (cursor + (span > 0 ? (target - cum[cursor]) / span : 0)) / STEPS;
      }
      function byArc(u) {
        var t = Math.max(0, Math.min(1024, 1024 * u));
        var i = Math.floor(t), v = lut[i];
        return v + (lut[Math.min(i + 1, 1024)] - v) * (t - i);
      }

      function roundedPath(c, x, y, w, h, r) {
        var rr = Math.min(r, w / 2, h / 2);
        c.beginPath();
        c.moveTo(x + rr, y);
        c.arcTo(x + w, y, x + w, y + h, rr);
        c.arcTo(x + w, y + h, x, y + h, rr);
        c.arcTo(x, y + h, x, y, rr);
        c.arcTo(x, y, x + w, y, rr);
        c.closePath();
      }

      var offset = 0, last = 0;
      function frame(now) {
        var delta = last ? (now - last) / 1000 : 0;
        last = now;
        offset = (offset + (reduced ? 0 : SPEED * Math.min(delta, 0.1))) % 100;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        var cx = width / 2, cy = height / 2;
        var radius = 0.48 * Math.min(width, height) * (1 + (SPREAD - 1) * 0.18);
        var count = images.length || 1;
        var step = Math.max(0.005, 0.5 * SPACING / 100);
        var tiles = Math.min(400, Math.ceil(1 / step) + 2);
        var base = offset / 100;

        var items = [];
        for (var i = 0; i < tiles; i++) {
          var t = ((base + i * step) % 1 + 1) % 1;
          items.push({ tt: 100 * t, n: byArc(t), img: i % count });
        }
        items.sort(function (a, b) { return a.n - b.n; });

        for (var j = 0; j < items.length; j++) {
          var item = items[j];
          var pos = point(item.n, radius);
          var dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
          var alpha = item.tt < FADE_IN ? item.tt / FADE_IN : 1;
          if (alpha < 0.01) continue;

          var scale = ATTENUATION > 0 ? Math.pow(Math.min(dist / radius, 1), 0.5 * ATTENUATION) : 1;
          var next = point(Math.min(item.n + 0.001, 1), radius);
          var tilt = Math.atan2(next.y - pos.y, next.x - pos.x);

          var pic = images[item.img];
          if (!pic || !pic.complete || !pic.naturalWidth) continue;
          var ratio = pic.naturalWidth / pic.naturalHeight;
          var w = IMAGE_SIZE * scale, h = w / ratio;
          if (ratio < 1) { h = IMAGE_SIZE * scale; w = h * ratio; }

          ctx.save();
          ctx.translate(cx + pos.x, cy + pos.y);
          ctx.rotate(tilt);
          ctx.globalAlpha = alpha;
          roundedPath(ctx, -w / 2, -h / 2, w, h, CORNER / 20 * (Math.min(w, h) / 2));
          ctx.clip();
          ctx.drawImage(pic, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
        window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    });
  }

  /* ---------- карусель работ ----------
     Coverflow: активная карточка в центре, соседние уходят в перспективу.
     Образец — 3D Coverflow Carousel с 21st.dev, реализация своя.
     Управление: стрелки, точки, клавиши, перетаскивание, клик по соседу. */
  function setupSliders() {
    var sliders = document.querySelectorAll('[data-slider]');
    Array.prototype.forEach.call(sliders, function (root) {
      var stage = root.querySelector('[data-slider-track]');
      var slides = Array.prototype.slice.call(stage.querySelectorAll('.cf-slide'));
      if (!slides.length) return;
      var prev = root.querySelector('[data-slider-prev]');
      var next = root.querySelector('[data-slider-next]');
      var dots = Array.prototype.slice.call(root.querySelectorAll('[data-slider-go]'));
      var ambient = root.querySelector('[data-slider-ambient]');
      var counter = root.querySelector('[data-slider-count]');
      var current = 0;

      function pad(n) { return (n < 10 ? '0' : '') + n; }

      function place(drag) {
        drag = drag || 0;
        slides.forEach(function (slide, i) {
          var d = i - current - drag;
          var far = Math.abs(d) > 2.6;
          var sign = d < 0 ? -1 : 1;
          var abs = Math.abs(d);
          var shift = sign * (46 + 30 * Math.min(abs, 3)) * Math.min(abs, 3) / 3;
          var rot = -sign * Math.min(abs, 2.2) * 17;
          var scale = Math.max(0.6, 1 - abs * 0.14);
          var depth = -Math.min(abs, 3) * 130;
          slide.style.transform = 'translateX(' + shift + '%) translateZ(' + depth +
            'px) rotateY(' + rot + 'deg) scale(' + scale + ')';
          slide.style.opacity = far ? 0 : Math.max(0.25, 1 - abs * 0.3);
          slide.style.filter = abs > 0.5 ? 'saturate(.85) brightness(.9)' : 'none';
          slide.style.zIndex = String(50 - Math.round(abs * 10));
          slide.style.pointerEvents = far ? 'none' : 'auto';
          slide.setAttribute('aria-hidden', abs < 0.5 ? 'false' : 'true');
          slide.dataset.state = abs < 0.5 ? 'active' : 'side';
        });
      }

      function sync() {
        dots.forEach(function (dot, i) {
          dot.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
        if (prev) prev.disabled = current === 0;
        if (next) next.disabled = current === slides.length - 1;
        if (counter) counter.textContent = pad(current + 1) + ' / ' + pad(slides.length);
        var img = slides[current].querySelector('img');
        if (ambient && img) ambient.style.backgroundImage = 'url(' + img.getAttribute('src') + ')';
      }

      function go(i) {
        current = Math.max(0, Math.min(slides.length - 1, i));
        place();
        sync();
      }

      if (prev) prev.addEventListener('click', function () { go(current - 1); });
      if (next) next.addEventListener('click', function () { go(current + 1); });
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () { go(parseInt(dot.dataset.sliderGo, 10)); });
      });
      slides.forEach(function (slide, i) {
        slide.addEventListener('click', function () { if (i !== current) go(i); });
      });
      stage.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight') { event.preventDefault(); go(current + 1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); }
      });

      // перетаскивание
      var down = false, startX = 0, width = 1, moved = 0;
      stage.addEventListener('pointerdown', function (event) {
        down = true; moved = 0;
        startX = event.clientX;
        width = slides[current].getBoundingClientRect().width || 1;
        stage.setPointerCapture(event.pointerId);
      });
      stage.addEventListener('pointermove', function (event) {
        if (!down) return;
        var dx = event.clientX - startX;
        moved = Math.abs(dx);
        place(-dx / (width * 1.15));
      });
      function release(event) {
        if (!down) return;
        down = false;
        var dx = event.clientX - startX;
        if (Math.abs(dx) > width * 0.18) go(current + (dx < 0 ? 1 : -1));
        else place();
        if (stage.hasPointerCapture && event.pointerId !== undefined &&
            stage.hasPointerCapture(event.pointerId)) {
          stage.releasePointerCapture(event.pointerId);
        }
      }
      stage.addEventListener('pointerup', release);
      stage.addEventListener('pointercancel', release);
      stage.addEventListener('click', function (event) {
        if (moved > 8) { event.preventDefault(); event.stopPropagation(); }
      }, true);

      window.addEventListener('resize', function () { place(); });
      go(0);
    });
  }

  /* ---------- подписка на письма ---------- */
  function setupNewsletter() {
    var form = document.querySelector('.mantality-footer-newsletter form');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input');
      var note = form.querySelector('[role="status"]');
      if (note) {
        note.textContent = 'Спасибо! Письмо с подтверждением летит на ' + (input ? input.value : '') + '.';
      }
      if (input) input.value = '';
    });
  }

  // «3D Parallax Unfurling Gallery»: прогресс прокрутки секции сглаживается
  // пружиной и раскладывается на размер рамки, наклон сетки и сдвиг колонок
  function setupUnfurl() {
    document.querySelectorAll('.unfurl').forEach(function (root) {
      var banner = root.querySelector('.unfurl-banner');
      var grid = root.querySelector('.unfurl-grid');
      var cols = root.querySelectorAll('.unfurl-col');
      if (!banner || !grid) return;
      // колонки: откуда и куда едут, в процентах своей высоты
      var shift = [[0, -40], [-40, 10], [0, -40], [-30, 20]];
      var target = 0, cur = 0, vel = 0, raf = 0, last = 0;

      function lerp(a, b, t) { return a + (b - a) * t; }
      function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

      function measure() {
        var r = root.getBoundingClientRect();
        var run = r.height - window.innerHeight;
        target = run > 0 ? clamp(-r.top / run) : 0;
      }

      function draw(p) {
        var b = clamp(p / 0.15);                  // рамка раскрывается на первых 15%
        var t = clamp((p - 0.15) / 0.85);         // остальное — разворот сетки
        banner.style.setProperty('--b', b.toFixed(4));
        banner.style.setProperty('--p', p.toFixed(4));
        grid.style.transform =
          'translateZ(' + lerp(-800, 0, t).toFixed(1) + 'px) ' +
          'rotateX(' + lerp(25, 4, t).toFixed(2) + 'deg) ' +
          'rotateY(' + lerp(-45, -8, t).toFixed(2) + 'deg) ' +
          'rotateZ(' + lerp(15, 2, t).toFixed(2) + 'deg)';
        for (var i = 0; i < cols.length; i++) {
          var s = shift[i % shift.length];
          cols[i].style.transform = 'translateY(' + lerp(s[0], s[1], t).toFixed(2) + '%)';
        }
      }

      // пружина как у framer-motion: stiffness 100, damping 20, mass 0.5
      function tick(now) {
        var dt = Math.min(0.05, ((now - (last || now)) / 1000) || 0.016);
        last = now;
        if (reduced) {
          cur = target; vel = 0;
        } else {
          var force = 100 * (target - cur) - 20 * vel;
          vel += force / 0.5 * dt;
          cur += vel * dt;
        }
        draw(cur);
        if (Math.abs(target - cur) > 0.0005 || Math.abs(vel) > 0.0005) {
          raf = requestAnimationFrame(tick);
        } else {
          cur = target; vel = 0; draw(cur); raf = 0; last = 0;
        }
      }

      function kick() {
        measure();
        if (!raf) raf = requestAnimationFrame(tick);
      }

      measure(); cur = target; draw(cur);
      window.addEventListener('scroll', kick, { passive: true });
      window.addEventListener('resize', kick);
    });
  }

  // «Radial Orbital Timeline»: адреса кружат по орбите вокруг знака;
  // клик уводит точку наверх, останавливает вращение и открывает карточку
  function setupOrbit() {
    document.querySelectorAll('.orbit').forEach(function (root) {
      var nodes = Array.prototype.slice.call(root.querySelectorAll('.orbit-node'));
      var n = nodes.length;
      if (!n) return;
      var rot = 0, auto = !reduced, hover = false, visible = true;
      var active = -1, tween = null, last = 0, r = 290, ry = 290, cy = 370, base = 760, mobile = false;

      function layout() {
        var w = root.clientWidth;
        mobile = w < 761;
        if (mobile) {
          // на телефоне крутятся мини-карточки: орбита — вытянутый овал,
          // иначе карточки по бокам налезают друг на друга
          // радиус — от ширины мини-карточки, чтобы крайние не резались о рамку
          var cw = nodes[0].querySelector('.orbit-dot').offsetWidth || 60;
          r = Math.max(96, (w - cw - 14) / 2);
          ry = Math.round(r * (w < 340 ? 1.75 : 1.5));
          cy = ry + 58;
          base = cy + ry + 84;
        } else {
          r = Math.max(110, Math.min(290, (w - 200) / 2));
          ry = r;
          cy = r + 80;
          base = cy + r + 90;
        }
        root.style.setProperty('--ry', ry + 'px');
        lut = null;
        root.style.setProperty('--r', r + 'px');
        root.style.setProperty('--cy', cy + 'px');
        fit();
      }

      // рамка растёт, если раскрытая карточка не помещается
      function fit() {
        var need = base;
        if (active >= 0) {
          var card = nodes[active].querySelector('.orbit-card');
          need = Math.max(base, cy - ry + card.offsetTop + card.offsetHeight + 40);
        }
        root.style.height = need + 'px';
      }

      // на овале точки ставим с равным шагом по длине дуги, а не по углу:
      // иначе у верха и низа карточки сбиваются в кучу. lut[k] — угол
      // эллипса для доли периметра k/LUT; на круге он совпадает с долей.
      var LUT = 360, lut = null;
      function buildLut() {
        var len = [0], t, px = r, py = 0;
        for (var k = 1; k <= LUT; k++) {
          t = k / LUT * Math.PI * 2;
          var x = r * Math.cos(t), y = ry * Math.sin(t);
          len.push(len[k - 1] + Math.hypot(x - px, y - py)); px = x; py = y;
        }
        lut = []; var j = 0, total = len[LUT];
        for (k = 0; k <= LUT; k++) {
          var want = k / LUT * total;
          while (j < LUT && len[j + 1] < want) j++;
          var f = (want - len[j]) / ((len[j + 1] - len[j]) || 1);
          lut.push((j + f) / LUT * Math.PI * 2);
        }
      }
      function angleAt(deg) {
        var u = ((deg % 360) + 360) % 360 / 360 * LUT, k = Math.floor(u), f = u - k;
        return lut[k] + (lut[Math.min(k + 1, LUT)] - lut[k]) * f;
      }

      function place() {
        if (!lut) buildLut();
        for (var i = 0; i < n; i++) {
          var a = angleAt((i / n) * 360 + rot);
          var el = nodes[i];
          el.style.transform = 'translate(' + (r * Math.cos(a)).toFixed(1) + 'px,' + (ry * Math.sin(a)).toFixed(1) + 'px)';
          if (i === active) {
            el.style.zIndex = 200; el.style.opacity = 1;
          } else if (el.classList.contains('is-dim')) {
            el.style.zIndex = 1; el.style.opacity = 0.16;
          } else {
            el.style.zIndex = Math.round(100 + 50 * Math.cos(a));
            el.style.opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(a)) / 2))).toFixed(3);
          }
        }
      }

      function frame(now) {
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        if (tween) {
          var t = Math.min(1, (now - tween.start) / 700);
          var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          rot = tween.from + tween.delta * e;
          if (t >= 1) tween = null;
        } else if (auto && !hover && visible) {
          rot = (rot + 6 * dt) % 360;     // 0,3° за 50 мс, как в оригинале
        }
        place();
        requestAnimationFrame(frame);
      }

      function open(i) {
        close(true);
        active = i;
        auto = false;
        var node = nodes[i];
        node.classList.add('is-active');
        node.querySelector('.orbit-dot').setAttribute('aria-expanded', 'true');
        node.querySelector('.orbit-card').hidden = false;
        (node.getAttribute('data-related') || '').split(',').forEach(function (j) {
          if (j !== '') nodes[+j].classList.add('is-related');
        });
        root.classList.add('has-active');
        // точку — наверх (270°) по кратчайшему пути
        var target = 270 - (i / n) * 360;
        var delta = ((target - rot) % 360 + 540) % 360 - 180;
        tween = reduced ? null : { from: rot, delta: delta, start: performance.now() };
        if (reduced) rot = target;
        fit();
      }

      function close(keep) {
        if (active >= 0) {
          var node = nodes[active];
          node.classList.remove('is-active');
          node.querySelector('.orbit-dot').setAttribute('aria-expanded', 'false');
          node.querySelector('.orbit-card').hidden = true;
        }
        nodes.forEach(function (el) { el.classList.remove('is-related'); });
        active = -1;
        if (!keep) {
          root.classList.remove('has-active');
          auto = !reduced;
          fit();
        }
      }

      nodes.forEach(function (node, i) {
        var dot = node.querySelector('.orbit-dot');
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          if (active === i) close(); else open(i);
        });
        dot.addEventListener('pointerenter', function () { hover = true; });
        dot.addEventListener('pointerleave', function () { hover = false; });
        node.querySelector('.orbit-card').addEventListener('click', function (e) { e.stopPropagation(); });
        node.querySelectorAll('.orbit-rel').forEach(function (b) {
          b.addEventListener('click', function () { open(+b.getAttribute('data-go')); });
        });
      });
      root.addEventListener('click', function () { close(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && active >= 0) close();
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
      }
      window.addEventListener('resize', layout);
      layout();
      // ссылка вида ateleye.html#tochka-4 сразу открывает нужное ателье
      var m = /^#tochka-(\d+)$/.exec(location.hash);
      if (m && nodes[m[1] - 1]) { open(m[1] - 1); rot = 270 - ((m[1] - 1) / n) * 360; tween = null; }
      // адрес из подвала на этой же странице: открываем карточку и едем к орбите
      window.addEventListener('hashchange', function () {
        var h = /^#tochka-(\d+)$/.exec(location.hash);
        if (h && nodes[h[1] - 1]) {
          open(h[1] - 1);
          root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      });
      place();
      requestAnimationFrame(frame);

      var form = root.parentNode && root.parentNode.querySelector('.addr-search');
      if (form) {
        var input = form.querySelector('input');
        var list = form.querySelector('.addr-search-list');
        var meta = form.querySelector('.addr-search-meta');
        var index = nodes.map(function (node, i) {
          var text = function (sel) {
            var el = node.querySelector(sel);
            return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
          };
          var tags = Array.prototype.map.call(node.querySelectorAll('.orbit-tags li'), function (li) {
            return li.textContent.trim();
          });
          var phone = text('a[href^="tel:"]');
          var blob = [text('.orbit-label'), text('.orbit-short'), text('.orbit-address'), tags.join(' '), phone]
            .join(' ').toLowerCase().replace(/ё/g, 'е');
          return {
            i: i,
            label: text('.orbit-label'),
            addr: text('.orbit-address'),
            tags: tags.join(' · '),
            phone: phone,
            blob: blob,
            digits: phone.replace(/\D/g, '')
          };
        });
        function fold(value) {
          return (value || '').toLowerCase().replace(/ё/g, 'е').trim();
        }
        function apply() {
          var q = fold(input.value);
          var digits = q.replace(/\D/g, '');
          var hits = [];
          index.forEach(function (item) {
            var ok = !q || item.blob.indexOf(q) !== -1 || (digits.length >= 2 && item.digits.indexOf(digits) !== -1);
            nodes[item.i].classList.toggle('is-dim', !!q && !ok);
            nodes[item.i].classList.toggle('is-hit', !!q && ok);
            if (ok) hits.push(item);
          });
          root.classList.toggle('is-filtering', !!q);
          if (q) auto = false;
          else if (active < 0) auto = !reduced;
          list.innerHTML = '';
          if (!q) {
            list.hidden = true;
            meta.textContent = '13 адресов по городу';
            return;
          }
          meta.textContent = hits.length ? ('Нашли ' + hits.length + ' из 13') : 'Ничего не нашли. Попробуйте улицу или услугу: ремонт, мех, шторы.';
          hits.forEach(function (item) {
            var li = document.createElement('li');
            var button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = '<strong></strong><span></span>';
            button.querySelector('strong').textContent = item.label;
            button.querySelector('span').textContent = item.addr + (item.tags ? ' · ' + item.tags : '');
            button.addEventListener('click', function () {
              open(item.i);
              root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
            });
            li.appendChild(button);
            list.appendChild(li);
          });
          list.hidden = hits.length === 0;
        }
        input.addEventListener('input', apply);
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          apply();
          var only = list.querySelector('button');
          if (only && list.children.length === 1) only.click();
        });
        meta.textContent = '13 адресов по городу';
      }
    });
  }

  // карточка работы из бегущей строки → окно с описанием и мини-слайдером
  function setupWorkDialog() {
    var dlg = document.querySelector('.work-dialog');
    var src = document.getElementById('works-data');
    if (!dlg || !src) return;
    var works = JSON.parse(src.textContent);
    var stage = dlg.querySelector('.wd-stage');
    var thumbs = dlg.querySelector('.wd-thumbs');
    var count = dlg.querySelector('.wd-count');
    var service = dlg.querySelector('.wd-service');
    var photos = [], idx = 0, opener = null;

    function show(i) {
      if (!photos.length) return;
      idx = (i + photos.length) % photos.length;
      Array.prototype.forEach.call(stage.children, function (el, k) {
        el.classList.toggle('is-on', k === idx);
        // ушли с ролика — ставим его на паузу
        if (el.tagName === 'VIDEO' && k !== idx && !el.paused) el.pause();
      });
      thumbs.querySelectorAll('button').forEach(function (b, k) {
        b.setAttribute('aria-current', k === idx ? 'true' : 'false');
        // только горизонтальная прокрутка ленты миниатюр — окно не двигаем
        if (k === idx) thumbs.scrollLeft = b.offsetLeft - (thumbs.clientWidth - b.offsetWidth) / 2;
      });
      count.textContent = (idx + 1) + ' / ' + photos.length;
    }

    function open(n) {
      var w = works[n];
      // фото и видео листаются одним слайдером: сначала снимки, потом ролики
      photos = w.photos.map(function (u) { return { src: u }; })
        .concat((w.videos || []).map(function (v) { return { src: v.src, poster: v.poster, label: v.label, video: true }; }));
      dlg.querySelector('.wd-tag').textContent = w.tag;
      dlg.querySelector('.wd-title').textContent = w.title;
      dlg.querySelector('.wd-note').textContent = w.note;
      service.hidden = !w.service;
      if (w.service) service.href = w.service;
      dlg.classList.toggle('is-single', photos.length < 2);
      stage.innerHTML = '';
      thumbs.innerHTML = '';
      photos.forEach(function (m, k) {
        var el;
        if (m.video) {
          el = document.createElement('video');
          el.src = m.src; el.poster = m.poster; el.controls = true;
          el.preload = 'none'; el.playsInline = true;
          el.setAttribute('playsinline', '');
          el.setAttribute('aria-label', w.title + ' — видео' + (m.label ? ': ' + m.label : ''));
        } else {
          el = document.createElement('img');
          el.src = m.src; el.alt = w.title + ' — фото ' + (k + 1); el.draggable = false;
        }
        stage.appendChild(el);
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', m.video ? 'Видео' + (m.label ? ': ' + m.label : '') : 'Фото ' + (k + 1));
        if (m.video) b.className = 'is-video';
        b.innerHTML = '<img src="' + (m.poster || m.src) + '" alt="" loading="lazy">';
        b.addEventListener('click', function () { show(k); });
        thumbs.appendChild(b);
      });
      show(0);
      dlg.scrollTop = 0;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      dlg.scrollTop = 0;
    }

    function close() {
      if (dlg.open) dlg.close();
    }

    dlg.addEventListener('close', function () {
      stage.querySelectorAll('video').forEach(function (v) { v.pause(); });
      document.documentElement.style.overflow = '';
      if (opener) opener.focus({ preventScroll: true });
    });
    document.querySelectorAll('.work-tile').forEach(function (tile) {
      tile.addEventListener('click', function () {
        opener = tile;
        open(+tile.getAttribute('data-work'));
      });
    });
    dlg.querySelector('.wd-prev').addEventListener('click', function () { show(idx - 1); });
    dlg.querySelector('.wd-next').addEventListener('click', function () { show(idx + 1); });
    dlg.querySelector('.wd-close').addEventListener('click', close);
    // клик по затемнению вокруг окна закрывает его
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    // свайп по фото
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.target.tagName === 'VIDEO' ? null : e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', function () { x0 = null; });

    document.addEventListener('pchelka:open-work', function (e) { opener = null; open(e.detail); });

    // ссылка вида raboty.html#rabota-3 сразу открывает нужную работу
    var m = /^#rabota-(\d+)$/.exec(location.hash);
    if (m && works[m[1] - 1]) open(m[1] - 1);
  }

  // «Показать все N работ» на странице направления
  function setupExpand() {
    document.querySelectorAll('[data-expand]').forEach(function (b) {
      b.addEventListener('click', function () {
        var box = b.closest('section').querySelector('.is-collapsed');
        if (box) box.classList.remove('is-collapsed');
        b.parentNode.remove();
      });
    });
  }

  // «Приходите в ближайшее ателье»: фото едут по внешней дуге, иконки —
  // навстречу по внутренней. Центр и радиусы дуг взяты из самого SVG
  // (viewBox 1000×340, центр 500;515, радиусы 472 и 392), поэтому
  // движение совпадает с нарисованными линиями на любой ширине.
  function setupOrbitCta() {
    document.querySelectorAll('.mantality-orbit-visual').forEach(function (vis) {
      var svg = vis.querySelector('.mantality-orbit-rings');
      var layer = vis.querySelector('.mantality-orbit-badge-layer');
      var outer = Array.prototype.slice.call(vis.querySelectorAll('.mantality-orbit-avatar'));
      var inner = Array.prototype.slice.call(vis.querySelectorAll('.mantality-orbit-badge'));
      if (!svg || !layer || reduced) return;
      var shift = 0, last = 0, visible = true, geo = null;

      function measure() {
        var vr = vis.getBoundingClientRect(), sr = svg.getBoundingClientRect();
        var k = sr.width / 1000;
        geo = { k: k, ox: sr.left - vr.left, oy: sr.top - vr.top, h: vr.height, w: vr.width };
      }

      // угол, ниже которого предмет полностью уходит под край полосы
      function span(r, size) {
        var cyV = geo.oy + 515 * geo.k;
        var sin = (cyV - (geo.h + size)) / r;
        var a = Math.asin(Math.max(-1, Math.min(1, sin)));
        // на узком экране дуга шире полосы: ход ограничиваем и по бокам
        var half = geo.w / 2 + size;
        if (half < r) a = Math.max(a, Math.acos(half / r));
        return [a, Math.PI - a];
      }

      function put(list, r, dir, inLayer) {
        if (!list.length) return;
        var size = list[0].offsetWidth || 40;
        var sp = span(r, size / 2 + 4), len = sp[1] - sp[0];
        for (var i = 0; i < list.length; i++) {
          var u = ((i / list.length + dir * shift) % 1 + 1) % 1;
          var a = sp[0] + u * len;
          var x = 500 * geo.k + r * Math.cos(a), y = 515 * geo.k - r * Math.sin(a);
          var el = list[i];
          // у краёв дуги предмет тает, а не обрывается
          var edge = Math.min(u, 1 - u) * len * 180 / Math.PI;
          el.style.opacity = Math.max(0, Math.min(1, edge / 10)).toFixed(3);
          if (inLayer) {
            el.style.left = x + 'px'; el.style.top = y + 'px';
          } else {
            el.style.left = (geo.ox + x - el.offsetWidth / 2) + 'px';
            el.style.top = (geo.oy + y - el.offsetHeight / 2) + 'px';
            el.style.right = 'auto';
          }
        }
      }

      function frame(now) {
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        if (visible) {
          shift += dt / 60;               // полный проход по дуге — за минуту
          if (!geo) measure();
          put(outer, 472 * geo.k, 1, false);
          put(inner, 392 * geo.k, -1, true);
        }
        requestAnimationFrame(frame);
      }

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) last = 0; }).observe(vis);
      }
      window.addEventListener('resize', function () { geo = null; });
      requestAnimationFrame(frame);
    });
  }

  // галерея «Работ»: снимок вылетает из своей карточки, фон светится цветом кадра,
  // фото листаются с разворотом в глубину, клик по фото — лупа ×2.2
  function setupLightbox() {
    var box = document.querySelector('.lbx');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.unfurl-card'));
    var src = document.getElementById('works-data');
    if (!box || !cards.length) return;
    cards.sort(function (a, b) { return a.getAttribute('data-shot') - b.getAttribute('data-shot'); });
    var works = src ? JSON.parse(src.textContent) : [];
    var stage = box.querySelector('.lbx-stage'), tilt = box.querySelector('.lbx-tilt');
    var ambient = box.querySelector('.lbx-ambient');
    var idx = 0, current = null, opener = null, zoomed = false, lastWork = -1, swiped = false;
    var touch = window.matchMedia('(hover: none)').matches;

    function workOf(i) { return +cards[i].getAttribute('data-work'); }
    function shotsOf(n) {
      var out = [];
      cards.forEach(function (c, k) { if (+c.getAttribute('data-work') === n) out.push(k); });
      return out;
    }
    function imgSrc(i) { var im = cards[i].querySelector('img'); return im.currentSrc || im.src; }

    function swapText(el, text) {
      if (el.textContent === text) return;
      el.textContent = text;
      el.classList.remove('is-swap'); void el.offsetWidth; el.classList.add('is-swap');
    }

    function caption() {
      var n = workOf(idx), w = works[n] || { title: cards[idx].querySelector('img').alt, tag: '', note: '' };
      box.querySelector('.lbx-count b').textContent = idx + 1;
      box.querySelector('.lbx-count span').textContent = '/ ' + cards.length;
      box.querySelector('.lbx-progress i').style.width = ((idx + 1) / cards.length * 100) + '%';
      swapText(box.querySelector('.lbx-tag'), w.tag || 'Работа');
      swapText(box.querySelector('.lbx-title'), w.title);
      var m = /^(.+?[.!?])(\s|$)/.exec(w.note || '');
      swapText(box.querySelector('.lbx-note'), m ? m[1] : (w.note || ''));
      var own = shotsOf(n), dots = box.querySelector('.lbx-dots');
      if (n !== lastWork) {
        dots.innerHTML = '';
        own.forEach(function (k, j) {
          var d = document.createElement('button');
          d.type = 'button'; d.setAttribute('aria-label', 'Фото ' + (j + 1) + ' из ' + own.length);
          d.addEventListener('click', function () { go(k); });
          dots.appendChild(d);
        });
        lastWork = n;
      }
      Array.prototype.forEach.call(dots.children, function (d, j) {
        d.setAttribute('aria-current', own[j] === idx ? 'true' : 'false');
      });
      dots.hidden = own.length < 2;
    }

    function setAmbient(url) {
      var im = document.createElement('img');
      im.src = url; im.alt = ''; im.style.opacity = 0;
      ambient.appendChild(im);
      requestAnimationFrame(function () { im.style.opacity = 1; });
      while (ambient.children.length > 2) ambient.removeChild(ambient.firstChild);
    }

    function makeSlide(i) {
      var slide = document.createElement('div');
      slide.className = 'lbx-slide';
      var frame = document.createElement('div');
      frame.className = 'lbx-frame';
      var im = document.createElement('img');
      im.src = imgSrc(i); im.alt = cards[i].querySelector('img').alt; im.draggable = false;
      frame.appendChild(im); slide.appendChild(frame);
      frame.addEventListener('click', function (e) { if (!swiped) toggleZoom(frame, e); });
      return slide;
    }

    function go(i, dir) {
      i = (i + cards.length) % cards.length;
      if (dir === undefined) dir = i > idx ? 1 : -1;
      unzoom();
      var old = current;
      idx = i;
      current = makeSlide(i);
      if (old && !reduced) current.classList.add(dir > 0 ? 'is-out-right' : 'is-out-left');
      tilt.appendChild(current);
      current.getBoundingClientRect();
      current.classList.remove('is-out-right', 'is-out-left');
      current.classList.add('is-current');
      if (old) {
        old.classList.remove('is-current');
        old.classList.add(dir > 0 ? 'is-out-left' : 'is-out-right');
        setTimeout(function () { old.remove(); }, reduced ? 0 : 800);
      }
      setAmbient(imgSrc(i));
      caption();
      // подгружаем соседей заранее
      [i + 1, i - 1].forEach(function (k) { var p = new Image(); p.src = imgSrc((k + cards.length) % cards.length); });
    }

    // FLIP: кадр стартует с места карточки в галерее
    function flip(frame, rect, back) {
      var im = frame.querySelector('img');
      function run() {
        var r = frame.getBoundingClientRect();
        if (!r.width || !rect || reduced) return;
        var t = 'translate(' + (rect.left - r.left) + 'px,' + (rect.top - r.top) + 'px) scale(' +
          (rect.width / r.width) + ',' + (rect.height / r.height) + ')';
        frame.style.transition = 'none';
        frame.style.transform = back ? 'none' : t;
        frame.style.borderRadius = back ? '' : '12px';
        frame.getBoundingClientRect();
        frame.style.transition = 'transform .75s cubic-bezier(.16,1,.3,1), border-radius .75s';
        frame.style.transform = back ? t : 'none';
        frame.style.borderRadius = back ? '12px' : '';
      }
      if (im.complete && im.naturalWidth) run(); else im.onload = run;
    }

    function open(card) {
      opener = card;
      box.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      tilt.innerHTML = ''; current = null; lastWork = -1;
      go(cards.indexOf(card), 0);
      current.classList.remove('is-out-right', 'is-out-left');
      flip(current.querySelector('.lbx-frame'), card.getBoundingClientRect(), false);
      requestAnimationFrame(function () { box.classList.add('is-open'); });
      box.querySelector('.lbx-close').focus({ preventScroll: true });
    }

    function close() {
      unzoom();
      var card = cards[idx], r = card.getBoundingClientRect();
      var onScreen = r.bottom > 0 && r.top < innerHeight && r.width > 0;
      if (current && onScreen) flip(current.querySelector('.lbx-frame'), r, true);
      box.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      setTimeout(function () { box.hidden = true; tilt.innerHTML = ''; ambient.innerHTML = ''; tilt.style.transform = ''; },
        reduced ? 0 : 650);
      if (opener) opener.focus({ preventScroll: true });
    }

    // лупа
    function toggleZoom(frame, e) {
      if (zoomed) { unzoom(); return; }
      zoomed = true;
      tilt.style.transform = '';
      pan(frame, e);
      frame.classList.add('is-zoomed');
    }
    function unzoom() {
      zoomed = false;
      box.querySelectorAll('.lbx-frame.is-zoomed').forEach(function (f) { f.classList.remove('is-zoomed'); });
    }
    function pan(frame, e) {
      var r = frame.getBoundingClientRect();
      var x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      var y = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
      frame.querySelector('img').style.transformOrigin = x + '% ' + y + '%';
    }

    // наклон за курсором и блик
    stage.addEventListener('pointermove', function (e) {
      if (!current) return;
      var frame = current.querySelector('.lbx-frame');
      if (zoomed) { pan(frame, e); return; }
      if (touch || reduced) return;
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      tilt.style.transform = 'rotateY(' + ((x - .5) * 10).toFixed(2) + 'deg) rotateX(' + ((.5 - y) * 8).toFixed(2) + 'deg)';
      frame.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      frame.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    stage.addEventListener('pointerleave', function () { tilt.style.transform = ''; });

    cards.forEach(function (c) {
      c.addEventListener('click', function () { open(c); });
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); }
      });
    });
    box.querySelector('.lbx-backdrop').addEventListener('click', close);
    box.querySelector('.lbx-close').addEventListener('click', close);
    stage.addEventListener('click', function (e) { if (e.target === stage || e.target.classList.contains('lbx-slide')) close(); });
    box.querySelector('.lbx-prev').addEventListener('click', function () { go(idx - 1, -1); });
    box.querySelector('.lbx-next').addEventListener('click', function () { go(idx + 1, 1); });
    box.querySelector('.lbx-open').addEventListener('click', function () {
      var n = workOf(idx);
      close();
      document.dispatchEvent(new CustomEvent('pchelka:open-work', { detail: n }));
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { if (zoomed) unzoom(); else close(); }
      if (e.key === 'ArrowLeft') go(idx - 1, -1);
      if (e.key === 'ArrowRight') go(idx + 1, 1);
    });
    // свайп (когда лупа выключена)
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = zoomed ? null : e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) {
        swiped = true; setTimeout(function () { swiped = false; }, 60);
        go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }
    });
  }

  function setupToTop() {
    document.querySelectorAll('[data-to-top]').forEach(function (b) {
      b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
    });
  }

  // «Ателье» на телефоне — Circular Gallery: цилиндр из карточек вращается сам,
  // от пальца и от прокрутки страницы; передняя карточка открывает шторку
  function setupCgal() {
    var root = document.querySelector('.cgal');
    if (!root) return;
    var scene = root.querySelector('.cgal-scene'), ring = root.querySelector('.cgal-ring');
    var cards = Array.prototype.slice.call(root.querySelectorAll('.cgal-card'));
    var sheet = root.querySelector('.cgal-sheet'), body = root.querySelector('.cgal-sheet-body');
    var n = cards.length, step = 360 / n;
    var rot = 0, vel = 0, radius = 300, dragging = false, moved = false, lastX = 0, lastT = 0;
    var target = null, visible = false, last = 0, lastScroll = window.scrollY, hold = 0;

    function layout() {
      var w = cards[0].offsetWidth || 220;
      // радиус — чтобы соседние карточки не наезжали друг на друга
      radius = Math.round(n * (w + 12) / (2 * Math.PI));
      cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)'; });
    }

    function frontIndex() { return ((Math.round(-rot / step) % n) + n) % n; }

    function draw() {
      ring.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + rot.toFixed(2) + 'deg)';
      var f = frontIndex();
      cards.forEach(function (c, i) {
        var a = ((i * step + rot) % 360 + 360) % 360;
        var d = a > 180 ? 360 - a : a;                 // угол до передней точки
        c.style.opacity = Math.max(0.3, 1 - d / 150).toFixed(3);
        c.classList.toggle('is-front', i === f);
        c.tabIndex = i === f ? 0 : -1;
      });
    }

    function snapTo(i) { target = -i * step + Math.round((rot + i * step) / 360) * 360; }

    function frame(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      if (visible && !dragging) {
        if (target !== null) {
          rot += (target - rot) * Math.min(1, dt * 7);
          if (Math.abs(target - rot) < 0.05) { rot = target; target = null; }
        } else if (Math.abs(vel) > 2) {
          rot += vel * dt; vel *= Math.pow(0.04, dt);  // инерция после броска
          if (Math.abs(vel) <= 2) snapTo(frontIndex());
        } else if (!reduced && now > hold && !sheet.open) {
          rot -= 7 * dt;                               // медленное вращение само по себе
        }
        draw();
      }
      requestAnimationFrame(frame);
    }

    // палец
    scene.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; target = null; vel = 0;
      lastX = e.clientX; lastT = performance.now();
      scene.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, t = performance.now();
      if (Math.abs(dx) > 2) moved = true;
      rot += dx * 0.32;
      vel = dx * 0.32 / Math.max(0.008, (t - lastT) / 1000);
      lastX = e.clientX; lastT = t;
      draw();
    });
    function release() {
      if (!dragging) return;
      dragging = false; scene.classList.remove('is-drag');
      hold = performance.now() + 4000;
      if (Math.abs(vel) < 60) { vel = 0; snapTo(frontIndex()); }
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    // прокрутка страницы тоже поворачивает цилиндр, как в оригинале
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (visible && !dragging && !sheet.open) { rot -= (y - lastScroll) * 0.12; target = null; }
      lastScroll = y;
    }, { passive: true });

    function openSheet(i) {
      var src = document.getElementById('orbit-card-' + i);
      if (!src) return;
      body.innerHTML = '';
      var card = src.cloneNode(true);
      card.hidden = false; card.removeAttribute('id');
      card.querySelectorAll('.orbit-rel').forEach(function (b) {
        b.addEventListener('click', function () { var j = +b.getAttribute('data-go'); snapTo(j); openSheet(j); });
      });
      body.appendChild(card);
      sheet.scrollTop = 0;
      if (sheet.open) return;
      // карточка вырастает из своего места на цилиндре и повисает по центру
      if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      flipFrom(cards[i]);
      sheet.classList.add('is-in');
    }

    function flipFrom(el) {
      var c = el.getBoundingClientRect(), r = sheet.getBoundingClientRect();
      if (!c.width || !r.width || reduced) { sheet.style.transform = ''; return; }
      sheet.style.transition = 'none';
      sheet.style.transform = 'translate(' + (c.left - r.left) + 'px,' + (c.top - r.top) + 'px) scale(' +
        (c.width / r.width) + ',' + (c.height / r.height) + ')';
      sheet.getBoundingClientRect();
      sheet.style.transition = '';
      sheet.style.transform = '';
    }

    // закрытие — обратно в карточку
    function closeSheet() {
      if (!sheet.open) return;
      sheet.classList.remove('is-in');
      var c = cards[frontIndex()].getBoundingClientRect(), r = sheet.getBoundingClientRect();
      if (c.width && !reduced) {
        sheet.style.transform = 'translate(' + (c.left - r.left) + 'px,' + (c.top - r.top) + 'px) scale(' +
          (c.width / r.width) + ',' + (c.height / r.height) + ')';
      }
      setTimeout(function () { sheet.close(); sheet.style.transform = ''; }, reduced ? 0 : 480);
    }

    cards.forEach(function (c, i) {
      c.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); return; }
        if (i === frontIndex()) openSheet(i); else { snapTo(i); hold = performance.now() + 4000; }
      });
    });
    root.querySelector('.cgal-prev').addEventListener('click', function () { snapTo((frontIndex() - 1 + n) % n); hold = performance.now() + 5000; });
    root.querySelector('.cgal-next').addEventListener('click', function () { snapTo((frontIndex() + 1) % n); hold = performance.now() + 5000; });
    root.querySelector('.cgal-close').addEventListener('click', closeSheet);
    sheet.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(); });
    sheet.addEventListener('close', function () { hold = performance.now() + 3000; });

    function fromHash(scroll) {
      var h = /^#tochka-(\d+)$/.exec(location.hash);
      if (!h || !cards[h[1] - 1] || getComputedStyle(root).display === 'none') return;
      var i = h[1] - 1;
      rot = -i * step; target = null; draw();
      if (scroll) root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      openSheet(i);
    }
    window.addEventListener('hashchange', function () { fromHash(true); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
    } else visible = true;
    window.addEventListener('resize', function () { layout(); draw(); });
    layout(); draw(); fromHash(false);
    requestAnimationFrame(frame);
  }

  function assetBase() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('app.js') !== -1) return src.replace(/app\.js.*$/, '');
    }
    return 'assets/';
  }

  function keyOnto(video, canvas) {
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    function paint() {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        var frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var d = frame.data;
        for (var i = 0; i < d.length; i += 4) {
          var r = d[i], g = d[i + 1], b = d[i + 2];
          var maxRB = r > b ? r : b;
          if (g > 110 && g > maxRB + 36) {
            var spill = g - maxRB;
            d[i + 3] = spill > 80 ? 0 : 255 - spill * 3;
            if (d[i + 1] > maxRB) d[i + 1] = maxRB;
          }
        }
        ctx.putImageData(frame, 0, 0);
        canvas.style.transform = 'translate(-50%, -26%)';
      }
      requestAnimationFrame(paint);
    }
    video.addEventListener('canplay', function () { video.play()["catch"](function () {}); });
    paint();
  }

  function setupLetters() {
    if (reduced) return;
    var base = assetBase();
    var names = document.querySelectorAll('.wordmark-name');
    Array.prototype.forEach.call(names, function (el) {
      if (el.getAttribute('data-split')) return;
      var text = (el.textContent || '').replace(/\s+/g, '');
      if (!text) return;
      el.setAttribute('data-split', '1');
      el.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var s = document.createElement('span');
        s.className = 'wm-letter';
        s.textContent = text.charAt(i);
        el.appendChild(s);
        var file = i === text.length - 1 ? 'img/sit-bee.mp4?v=sit4' : '';
        if (!file) continue;
        var video = document.createElement('video');
        video.className = 'floor-src';
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.src = base + file;
        var canvas = document.createElement('canvas');
        canvas.className = 'letter-girl';
        canvas.width = 240;
        canvas.height = 365;
        canvas.setAttribute('aria-hidden', 'true');
        s.appendChild(canvas);
        document.body.appendChild(video);
        keyOnto(video, canvas);
      }
    });
  }

  function init() {
    setupFaq();
    setupMoreMenu();
    setupCounters();
    setupStack();
    setupSpiral();
    setupSliders();
    setupUnfurl();
    setupOrbit();
    setupWorkDialog();
    setupExpand();
    setupOrbitCta();
    setupLightbox();
    setupToTop();
    setupCgal();
    setupNewsletter();
    setupLetters();
    var boot=document.createElement('script');
    boot.src='assets/hero-boot.js?v=motion-10';
    document.body.appendChild(boot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
