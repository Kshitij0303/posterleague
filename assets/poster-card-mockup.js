/**
 * PosterLeague — Random cinematic backgrounds for .poster-card (bg1–bg30)
 */
(function () {
  'use strict';

  var BG_MAX = 30;
  var SELECTOR = '.poster-card';
  var processed = new WeakSet();
  var listenersBound = false;

  function getThemeAssets() {
    return window.themeAssets && typeof window.themeAssets === 'object'
      ? window.themeAssets
      : null;
  }

  function normalizeAssetUrl(url) {
    if (!url) return null;
    if (url.indexOf('//') === 0) return 'https:' + url;
    return url;
  }

  function getBgUrl(bgNumber) {
    var assets = getThemeAssets();
    if (!assets) return null;
    return normalizeAssetUrl(assets['bg' + bgNumber] || null);
  }

  function pickBgNumber() {
    return Math.floor(Math.random() * BG_MAX) + 1;
  }

  function assignBackgroundToCard(card) {
    if (!card || !card.matches(SELECTOR) || processed.has(card)) return;

    var bgImg = card.querySelector('.poster-card__bg-img');
    if (!bgImg) return;

    var assigned = card.getAttribute('data-bg-assigned');
    var bgNumber = assigned ? parseInt(assigned, 10) : pickBgNumber();
    if (!bgNumber || bgNumber < 1 || bgNumber > BG_MAX) {
      bgNumber = pickBgNumber();
    }
    var url = getBgUrl(bgNumber);

    if (url) {
      bgImg.src = url;
    }

    card.setAttribute('data-bg-assigned', String(bgNumber));
    card.setAttribute('data-poster-bg-ready', 'true');
    processed.add(card);
  }

  function collectCards(root) {
    var list = [];

    if (!root) return list;

    if (root.matches && root.matches(SELECTOR) && !processed.has(root)) {
      list.push(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll(SELECTOR).forEach(function (card) {
        if (!processed.has(card)) list.push(card);
      });
    }

    return list;
  }

  function initPosterCards(root) {
    if (!getThemeAssets()) return;
    collectCards(root || document).forEach(assignBackgroundToCard);
  }

  function onSectionEvent(event) {
    if (!event || !event.target) return;
    initPosterCards(event.target);
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    document.addEventListener('DOMContentLoaded', function () {
      initPosterCards(document);
    });

    document.addEventListener('shopify:section:load', onSectionEvent);
    document.addEventListener('shopify:section:reorder', onSectionEvent);
    document.addEventListener('shopify:section:select', onSectionEvent);
  }

  window.PLPosterCard = {
    init: initPosterCards,
    assign: assignBackgroundToCard,
    getBgUrl: getBgUrl
  };

  bindListeners();

  if (document.readyState !== 'loading') {
    initPosterCards(document);
  }
})();
