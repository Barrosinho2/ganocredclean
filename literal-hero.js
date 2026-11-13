(() => {
  const root = document.querySelector('.literal-hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...root.querySelectorAll('video')];
  function playback() {
    videos.forEach(video => {
      video.muted = true;
      if (reduced.matches || document.hidden) video.pause();
      else video.play().catch(() => {});
    });
  }
  const horse = root.querySelector('.hero__horse');
  const horseVideo = root.querySelector('.hero__horse-video');
  horse.classList.remove('is-live');
  horseVideo.addEventListener('playing', () => horse.classList.add('is-live'));
  horseVideo.addEventListener('error', () => horse.classList.remove('is-live'));
  playback();
  reduced.addEventListener('change', playback);
  document.addEventListener('visibilitychange', playback);
})();
