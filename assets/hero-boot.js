(function () {
  var MOTION = { rate: 1 };

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'assets/hero-motion.css?v=motion-5';
  document.head.appendChild(css);

  var visual = document.querySelector('.hero-visual');
  if (!visual || visual.querySelector('video.hero-video')) return;
  var img = visual.querySelector('img.hero-photo');
  var video = document.createElement('video');
  video.className = 'hero-photo hero-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.playbackRate = MOTION.rate;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('aria-hidden', 'true');
  video.poster = 'assets/img/hero.jpg';
  var source = document.createElement('source');
  source.src = 'assets/img/hero.mp4?v=hero-live-2';
  source.type = 'video/mp4';
  video.appendChild(source);
  visual.insertBefore(video, visual.firstChild);
  if (img) img.classList.add('hero-photo-fallback');
  video.addEventListener('playing', function () {
    visual.classList.add('is-playing');
  });
  video.addEventListener('error', function () {
    video.style.display = 'none';
    visual.classList.remove('is-playing');
  });
  function play() {
    video.playbackRate = MOTION.rate;
    var pending = video.play();
    if (pending && pending.catch) pending.catch(function () {});
  }
  video.addEventListener('loadedmetadata', play);
  play();
})();
