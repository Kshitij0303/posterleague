/**
 * PosterLeague — site-wide right-click & image drag protection.
 * Note: OS screenshots (Print Screen, phone buttons) cannot be blocked by websites.
 */
(function () {
  'use strict';

  var MEDIA_SELECTOR = 'img, video, picture, svg';
  var ARTWORK_SELECTOR = '.pl-artwork-protected, .poster-card__poster, .pl-artwork-frame';

  function protectMedia(root) {
    (root || document).querySelectorAll(MEDIA_SELECTOR).forEach(function (el) {
      el.setAttribute('draggable', 'false');
    });
  }

  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  document.addEventListener('selectstart', function (e) {
    if (e.target && e.target.closest && e.target.closest(ARTWORK_SELECTOR)) {
      e.preventDefault();
    }
  });

  document.addEventListener('dragstart', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'IMG' || tag === 'VIDEO' || tag === 'SVG') {
      e.preventDefault();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    protectMedia(document);
  });

  document.addEventListener('shopify:section:load', function (e) {
    protectMedia(e.target);
  });

  if (document.readyState !== 'loading') {
    protectMedia(document);
  }
})();
