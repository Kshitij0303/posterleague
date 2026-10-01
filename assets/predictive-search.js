/**
 * POSTERLEAGUE — Global search overlay.
 * Opens from the header search icon on every page and shows results live
 * without navigating. Results come from the same full search engine as the
 * /search page (via the Section Rendering API + sections/search-overlay-results
 * .liquid), so the overlay never shows fewer matches than the full search
 * would, and prices use the store's own money format.
 */
(function () {
  'use strict';

  var DEBOUNCE_MS = 300;
  var MIN_CHARS = 2;
  var SECTION_ID = 'search-overlay-results';

  var trigger, overlay, panel, form, input, resultsEl, closeBtn;
  var debounceTimer = null;
  var activeController = null;
  var lastQuery = '';

  function buildUrl(query, page) {
    return '/search?q=' + encodeURIComponent(query) +
      '&type=product&section_id=' + SECTION_ID +
      (page > 1 ? '&page=' + page : '');
  }

  function showLoading() {
    resultsEl.innerHTML = '<div class="search-panel__loading"><span class="search-panel__spinner" aria-hidden="true"></span> Searching&hellip;</div>';
  }

  function showHint() {
    resultsEl.innerHTML = '<p class="search-panel__hint">Start typing to search posters, stickers &amp; more.</p>';
  }

  function showError() {
    resultsEl.innerHTML = '<p class="search-panel__empty">Something went wrong. Please try again.</p>';
  }

  function moreButtonHtml(nextPage) {
    if (!nextPage) return '';
    return '<button type="button" class="search-panel__more" data-load-more data-page="' + nextPage + '">Show more results</button>';
  }

  function fetchFragment(query, page) {
    if (activeController) activeController.abort();
    activeController = typeof AbortController !== 'undefined' ? new AbortController() : null;

    return fetch(buildUrl(query, page), activeController ? { signal: activeController.signal } : {})
      .then(function (res) { return res.ok ? res.text() : Promise.reject(res.status); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('[data-search-results]');
      });
  }

  function runSearch(query) {
    lastQuery = query;

    if (!query || query.length < MIN_CHARS) {
      if (activeController) activeController.abort();
      showHint();
      input.setAttribute('aria-expanded', 'false');
      return;
    }

    showLoading();
    input.setAttribute('aria-expanded', 'true');

    fetchFragment(query, 1)
      .then(function (fragment) {
        if (query !== lastQuery) return; // a newer query is in flight
        if (!fragment) { showError(); return; }
        resultsEl.innerHTML = fragment.innerHTML + moreButtonHtml(fragment.getAttribute('data-next-page'));
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        showError();
      });
  }

  function loadMore(button) {
    var page = parseInt(button.getAttribute('data-page'), 10);
    var query = lastQuery;
    if (!page || !query) return;

    button.disabled = true;
    button.textContent = 'Loading…';

    fetchFragment(query, page)
      .then(function (fragment) {
        if (query !== lastQuery || !fragment) return;
        var list = resultsEl.querySelector('[data-results-list]');
        var newList = fragment.querySelector('[data-results-list]');
        if (list && newList) {
          while (newList.firstChild) list.appendChild(newList.firstChild);
        }
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

  function openSearch() {
    // Only one overlay open at a time.
    var mobileNav = document.getElementById('mobile-nav-drawer');
    var mobileOverlay = document.getElementById('mobile-nav-overlay');
    if (mobileNav) mobileNav.classList.remove('is-open');
    if (mobileOverlay) mobileOverlay.classList.remove('is-open');
    document.body.classList.remove('mobile-nav-open');
    if (window.plWishlist && window.plWishlist.closeDrawer) window.plWishlist.closeDrawer();

    overlay.classList.add('is-open');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    window.setTimeout(function () { input.focus(); }, 50);
  }

  function closeSearch() {
    overlay.classList.remove('is-open');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (trigger) trigger.focus();
  }

  function isOpen() {
    return panel.classList.contains('is-open');
  }

  function init() {
    trigger = document.getElementById('search-trigger');
    overlay = document.getElementById('search-overlay');
    panel = document.getElementById('search-panel');
    form = document.getElementById('PredictiveSearchForm');
    input = document.getElementById('PredictiveSearchInput');
    resultsEl = document.getElementById('PredictiveSearchResults');
    closeBtn = document.getElementById('search-panel-close');

    if (!trigger || !overlay || !panel || !form || !input || !resultsEl) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (isOpen()) closeSearch(); else openSearch();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeSearch();
    });

    // Never navigate to /search — Enter just runs the search in place.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.clearTimeout(debounceTimer);
      runSearch(input.value.trim());
    });

    input.addEventListener('input', function () {
      window.clearTimeout(debounceTimer);
      var query = input.value.trim();
      if (!query) { runSearch(''); return; } // cleared (incl. via the clear button) — reset immediately
      debounceTimer = window.setTimeout(function () { runSearch(query); }, DEBOUNCE_MS);
    });

    // input-clear.js empties the field without firing an 'input' event.
    var clearBtn = form.querySelector('.t-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        window.clearTimeout(debounceTimer);
        runSearch('');
      });
    }

    resultsEl.addEventListener('click', function (e) {
      var more = e.target.closest('[data-load-more]');
      if (more) {
        e.preventDefault();
        loadMore(more);
        return;
      }
      // Clicking a product is a deliberate choice to visit it — let it navigate.
      if (e.target.closest('[data-predictive-result]')) {
        overlay.classList.remove('is-open');
        panel.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
