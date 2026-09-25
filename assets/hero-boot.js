(function () {
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'assets/hero-motion.css';
  document.head.appendChild(css);

  var visual = document.querySelector('.hero-visual');
  if (!visual) return;
  if (visual.querySelector('video.hero-video')) return;
  var img = visual.querySelector('img.hero-photo');
  var video = document.createElement('video');
  video.className = 'hero-photo hero-video';
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
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
})();
