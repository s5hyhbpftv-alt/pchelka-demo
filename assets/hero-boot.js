(function () {
  var MOTION = { rate: 1 };

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'assets/hero-motion.css?v=motion-6';
  document.head.appendChild(css);

  function arm(video) {
    if (!video || video.dataset.autoplayReady) return;
    video.dataset.autoplayReady = '1';
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.playbackRate = MOTION.rate;
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');

    function play() {
      if (video.paused === false) return;
      video.muted = true;
      video.playbackRate = MOTION.rate;
      var pending = video.play();
      if (pending && pending.catch) pending.catch(function () {});
    }

    video.addEventListener('loadedmetadata', play);
    video.addEventListener('canplay', play);
    video.addEventListener('playing', function () {
      var visual = video.closest('.hero-visual');
      if (visual) visual.classList.add('is-playing');
    });
    video.addEventListener('error', function () {
      var visual = video.closest('.hero-visual');
      video.style.display = 'none';
      if (visual) visual.classList.remove('is-playing');
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) play();
          else if (!video.paused) video.pause();
        });
      }, { threshold: 0.15 }).observe(video);
    }

    play();
  }

  var visual = document.querySelector('.hero-visual');
  if (visual && !visual.querySelector('video.hero-video')) {
    var img = visual.querySelector('img.hero-photo');
    var video = document.createElement('video');
    video.className = 'hero-photo hero-video';
    video.poster = 'assets/img/hero.jpg';
    var source = document.createElement('source');
    source.src = 'assets/img/hero.mp4?v=hero-live-2';
    source.type = 'video/mp4';
    video.appendChild(source);
    visual.insertBefore(video, visual.firstChild);
    if (img) img.classList.add('hero-photo-fallback');
    arm(video);
  }

  document.querySelectorAll('video.pricing-hero-video, video[autoplay]').forEach(arm);

  function kick() {
    document.querySelectorAll('video[data-autoplay-ready]').forEach(function (video) {
      if (video.paused) {
        var pending = video.play();
        if (pending && pending.catch) pending.catch(function () {});
      }
    });
  }
  window.addEventListener('pointerdown', kick, { once: true, passive: true });
  window.addEventListener('keydown', kick, { once: true });
})();
