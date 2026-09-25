(function () {
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'assets/hero-motion.css';
  document.head.appendChild(css);

  function loadParts(prefix, count, done) {
    var parts = new Array(count);
    var left = count;
    for (var i = 0; i < count; i++) {
      (function (n) {
        fetch('assets/media/' + prefix + '-p' + n + '.txt').then(function (r) {
          if (!r.ok) throw new Error('missing');
          return r.text();
        }).then(function (t) {
          parts[n] = t.replace(/\s+/g, '');
          if (--left === 0) done(parts.join(''));
        }).catch(function () { done(null); });
      })(i);
    }
  }

  function applyJpeg(b64, nodes) {
    if (!b64) return;
    var url = 'data:image/jpeg;base64,' + b64;
    nodes.forEach(function (el) { if (el) el.src = url; });
  }

  loadParts('hero', 4, function (b64) {
    applyJpeg(b64, [
      document.querySelector('.hero-visual img.hero-photo'),
      document.querySelector('.hero-visual video.hero-video')
    ]);
    var v = document.querySelector('.hero-visual video.hero-video');
    if (v && b64) v.poster = 'data:image/jpeg;base64,' + b64;
  });

  loadParts('master', 4, function (b64) {
    applyJpeg(b64, [document.querySelector('.approach-portrait img')]);
  });

  var visual = document.querySelector('.hero-visual');
  if (visual && !visual.querySelector('video.hero-video')) {
    var img = visual.querySelector('img.hero-photo');
    var video = document.createElement('video');
    video.className = 'hero-photo hero-video';
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('aria-hidden', 'true');
    video.poster = 'assets/img/hero.jpg';
    var source = document.createElement('source');
    source.src = 'assets/img/hero.mp4';
    source.type = 'video/mp4';
    video.appendChild(source);
    visual.insertBefore(video, visual.firstChild);
    if (img) img.classList.add('hero-photo-fallback');
    video.addEventListener('error', function () { video.style.display = 'none'; });
    var play = video.play();
    if (play && play.catch) play.catch(function () {});
  }
})();
