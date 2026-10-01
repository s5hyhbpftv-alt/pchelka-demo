(() => {
  const list = document.querySelector('[data-price-reveal]');
  if (!list || !('IntersectionObserver' in window)) return;
  const rows = [...list.querySelectorAll('.price-row')];
  const mobile = window.matchMedia('(max-width: 680px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  const configure = () => {
    if (observer) observer.disconnect();
    list.classList.remove('is-scroll-reveal');
    rows.forEach(row => row.classList.remove('is-price-visible'));
    if (!mobile.matches || reduceMotion.matches) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-price-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    list.classList.add('is-scroll-reveal');
    rows.forEach(row => observer.observe(row));
  };
  configure();
  mobile.addEventListener('change', configure);
  reduceMotion.addEventListener('change', configure);
})();
