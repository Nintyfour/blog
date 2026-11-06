(function () {
  var root = document.documentElement;
  var theme = 'light';
  try {
    var stored = localStorage.getItem('jiushengsi-theme');
    var prefersDark = window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
    theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
  } catch (error) {
    theme = 'light';
  }
  root.dataset.theme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0e0e0d' : '#ffffff');
  }
})();
