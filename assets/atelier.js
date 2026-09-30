(() => {
  const hero = document.querySelector('.atelier-bee-hero');
  if (!hero) return;
  const video = hero.querySelector('video');
  const button = hero.querySelector('.atelier-video-toggle');
  const update = () => {
    button.textContent = video.paused ? 'Смотреть видео' : 'Пауза';
    button.setAttribute('aria-label', video.paused ? 'Воспроизвести видео с адресами' : 'Приостановить видео');
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.autoplay = false;
    video.pause();
  }
  button.addEventListener('click', () => {
    if (video.paused) video.play().catch(update);
    else video.pause();
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  update();
})();
