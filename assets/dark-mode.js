// POSTERLEAGUE — Dark mode toggle

(function() {
  var STORAGE_KEY = 'pl-theme';

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function applyTheme(theme) {
    var dark = theme === 'dark';
    var root = document.documentElement;

    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch (e) {}

    var btn = document.getElementById('theme-toggle');
    var icons = document.getElementById('theme-toggle-icons');

    if (btn) {
      btn.setAttribute('data-on', dark ? 'true' : 'false');
      btn.setAttribute('aria-checked', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    if (icons) {
      icons.setAttribute('data-state', dark ? 'b' : 'a');
    }
  }

  function getInitialTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function init() {
    applyTheme(getInitialTheme());

    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function() {
      if (!btn.classList.contains('is-init')) {
        btn.classList.add('is-init');
      }
      applyTheme(isDark() ? 'light' : 'dark');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
