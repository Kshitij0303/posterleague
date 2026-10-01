/**
 * POSTERLEAGUE — header search bar.
 * The header search icon opens a full-width search bar under the header.
 *  - Typing: quick suggestions drop down under the bar, without leaving
 *    the page (fetched from sections/header-search-results.liquid via the
 *    Section Rendering API — same search engine as the results page).
 *  - Enter (or the search button): goes to the /search results page,
 *    which has filters and sorting (sections/main-search.liquid).
 */
(function () {
  'use strict';

  var DEBOUNCE_MS = 250;
  var MIN_CHARS = 2;
  var SUGGEST_SECTION = 'header-search-results';

  var trigger, root, form, input, panel, closeBtn, dim;
  var debounceTimer = null;
  var activeController = null;
  var lastQuery = '';   // latest query requested
  var shown = { query: '', mode: '' }; // what the panel currently holds
  var highlighted = -1;

  /* ---------- helpers ---------- */

  function buildUrl(query, mode, page) {
    return '/search?q=' + encodeURIComponent(query) +
      '&type=product&section_id=' + SUGGEST_SECTION +
      (page > 1 ? '&page=' + page : '');
  }

  function fetchFragment(query, mode, page) {
    if (activeController) activeController.abort();
    activeController = typeof AbortController !== 'undefined' ? new AbortController() : null;

    return fetch(buildUrl(query, mode, page), activeController ? { signal: activeController.signal } : {})
      .then(function (res) { return res.ok ? res.text() : Promise.reject(res.status); })
      .then(function (html) {
        return new DOMParser().parseFromString(html, 'text/html').querySelector('[data-search-results]');
      });
  }

  function moreButtonHtml(nextPage) {
    if (!nextPage) return '';
    return '<button type="button" class="header-search__more" data-load-more data-page="' + nextPage + '">Show more results</button>';
  }

  function showPanel(html, mode) {
    panel.innerHTML = html;
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (dim) dim.classList.add('is-open');
  }

  function hidePanel() {
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    if (dim) dim.classList.remove('is-open');
    setHighlight(-1);
  }

  function suggestions() {
    return Array.prototype.slice.call(panel.querySelectorAll('[data-search-result]'));
  }

  function setHighlight(index) {
    var items = suggestions();
    items.forEach(function (el, i) {
      el.classList.toggle('is-highlighted', i === index);
      el.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    highlighted = index;
    if (index >= 0 && items[index]) items[index].scrollIntoView({ block: 'nearest' });
  }

  /* ---------- searching ---------- */

  function search(query, mode) {
    lastQuery = query + '|' + mode;

    if (!query || query.length < MIN_CHARS) {
      if (activeController) activeController.abort();
      shown = { query: '', mode: '' };
      hidePanel();
      return;
    }

    // Already showing exactly this — just make sure it's visible.
    if (shown.query === query && shown.mode === mode && panel.innerHTML) {
      panel.hidden = false;
      if (dim) dim.classList.add('is-open');
      return;
    }

    var requestKey = lastQuery;
    showPanel('<div class="header-search__loading"><span class="header-search__spinner" aria-hidden="true"></span> Searching&hellip;</div>', mode);

    fetchFragment(query, mode, 1)
      .then(function (fragment) {
        if (requestKey !== lastQuery) return; // superseded by a newer search
        if (!fragment) throw new Error('missing fragment');
        shown = { query: query, mode: mode };
        highlighted = -1;
        var footer = mode === 'suggest' && fragment.querySelector('[data-search-result]')
          ? '<p class="header-search__hint">Press Enter to see all results</p>'
          : moreButtonHtml(fragment.getAttribute('data-next-page'));
        showPanel(fragment.innerHTML + footer, mode);
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        showPanel('<p class="header-search__status">Something went wrong. Please try again.</p>', mode);
      });
  }

  function loadMore(button) {
    var page = parseInt(button.getAttribute('data-page'), 10);
    var query = shown.query;
    var mode = shown.mode;
    if (!page || !query) return;

    var requestKey = lastQuery;
    button.disabled = true;
    button.textContent = 'Loading…';

    fetchFragment(query, mode, page)
      .then(function (fragment) {
        if (requestKey !== lastQuery || !fragment) return;
        var list = panel.querySelector('[data-results-list]');
        var newList = fragment.querySelector('[data-results-list]');
        if (list && newList) {
          while (newList.firstChild) list.appendChild(newList.firstChild);
        }
        if (window.plWishlist && window.plWishlist.updateUI) window.plWishlist.updateUI();
        var next = fragment.getAttribute('data-next-page');
        if (next) {
          button.setAttribute('data-page', next);
          button.disabled = false;
          button.textContent = 'Show more results';
        } else {
          button.remove();
        }
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        button.disabled = false;
        button.textContent = 'Show more results';
      });
  }

  /* ---------- open / close the search bar ---------- */

  function isOpen() { return !root.hidden; }

  function openBar() {
    // Only one thing open at a time.
    var mobileNav = document.getElementById('mobile-nav-drawer');
    var mobileOverlay = document.getElementById('mobile-nav-overlay');
    if (mobileNav && mobileNav.classList.contains('is-open')) {
      var closeMenu = document.getElementById('mobile-nav-close');
      if (closeMenu) closeMenu.click();
      else {
        mobileNav.classList.remove('is-open');
        if (mobileOverlay) mobileOverlay.classList.remove('is-open');
      }
    }
    if (window.plWishlist && window.plWishlist.closeDrawer) window.plWishlist.closeDrawer();

    root.hidden = false;
    root.classList.add('is-opening');
    window.setTimeout(function () { root.classList.remove('is-opening'); }, 260);
    trigger.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function closeBar() {
    hidePanel();
    root.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }

  /* ---------- wiring ---------- */

  function init() {
    trigger = document.getElementById('search-trigger');
    root = document.getElementById('HeaderSearch');
    form = document.getElementById('HeaderSearchForm');
    input = document.getElementById('HeaderSearchInput');
    panel = document.getElementById('HeaderSearchResults');
    closeBtn = document.getElementById('HeaderSearchClose');
    dim = document.getElementById('HeaderSearchDim');
    if (!trigger || !root || !form || !input || !panel) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (isOpen()) closeBar(); else openBar();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeBar);
    if (dim) dim.addEventListener('click', hidePanel);

    // Typing → quick suggestions.
    input.addEventListener('input', function () {
      window.clearTimeout(debounceTimer);
      var query = input.value.trim();
      if (!query) { search('', 'suggest'); return; }
      debounceTimer = window.setTimeout(function () { search(query, 'suggest'); }, DEBOUNCE_MS);
    });

    // Enter / search button → full results page (/search) with filters & sort.
    form.addEventListener('submit', function (e) {
      window.clearTimeout(debounceTimer);
      if (!input.value.trim()) {
        e.preventDefault();
        input.focus();
      }
      // otherwise let the form submit normally to /search?q=…&type=product
    });

    // Coming back to the field re-shows whatever was there.
    input.addEventListener('focus', function () {
      if (shown.query && input.value.trim() === shown.query && panel.innerHTML) {
        panel.hidden = false;
        if (dim) dim.classList.add('is-open');
      }
    });

    input.addEventListener('keydown', function (e) {
      var items = shown.mode === 'suggest' && !panel.hidden ? suggestions() : [];
      if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        setHighlight(highlighted < items.length - 1 ? highlighted + 1 : 0);
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        setHighlight(highlighted > 0 ? highlighted - 1 : items.length - 1);
      } else if (e.key === 'Enter' && highlighted >= 0 && items[highlighted]) {
        // A highlighted suggestion is a deliberate pick — open that product.
        e.preventDefault();
        window.location.href = items[highlighted].href;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !isOpen()) return;
      if (!panel.hidden) hidePanel(); else closeBar();
    });

    panel.addEventListener('click', function (e) {
      var more = e.target.closest('[data-load-more]');
      if (more) {
        e.preventDefault();
        loadMore(more);
        return;
      }
      // Clicking a product (suggestion or card) navigates normally to it.
    });

    // Click outside the search area hides the results (bar stays open).
    document.addEventListener('mousedown', function (e) {
      if (panel.hidden) return;
      if (root.contains(e.target) || trigger.contains(e.target)) return;
      hidePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
