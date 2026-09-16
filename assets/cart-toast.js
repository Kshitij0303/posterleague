/**
 * POSTERLEAGUE — Bottom-right add-to-cart toast (2s, brand palette).
 */
(function () {
  'use strict';

  var VISIBLE_MS = 2000;
  var hideTimer = null;
  var animTimer = null;
  var toastEl = null;

  function getToast() {
    if (toastEl) return toastEl;

    toastEl = document.createElement('div');
    toastEl.id = 'pl-cart-toast';
    toastEl.className = 'pl-cart-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.hidden = true;
    toastEl.innerHTML =
      '<div class="pl-cart-toast__accent" aria-hidden="true"></div>' +
      '<div class="pl-cart-toast__thumb"><img alt="" width="52" height="52" loading="lazy"></div>' +
      '<div class="pl-cart-toast__body">' +
        '<p class="pl-cart-toast__label">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<polyline points="20 6 9 17 4 12"></polyline>' +
          '</svg>' +
          'Added to cart' +
        '</p>' +
        '<p class="pl-cart-toast__name"></p>' +
        '<p class="pl-cart-toast__variant"></p>' +
      '</div>';

    document.body.appendChild(toastEl);
    return toastEl;
  }

  function clearTimers() {
    window.clearTimeout(hideTimer);
    window.clearTimeout(animTimer);
    hideTimer = null;
    animTimer = null;
  }

  function hideToast() {
    var el = getToast();
    el.classList.remove('is-visible');
    el.classList.add('is-hiding');

    animTimer = window.setTimeout(function () {
      el.classList.remove('is-hiding');
      el.hidden = true;
    }, 240);
  }

  function showToast(item) {
    if (!item) return;

    var el = getToast();
    var img = el.querySelector('.pl-cart-toast__thumb img');
    var name = el.querySelector('.pl-cart-toast__name');
    var variant = el.querySelector('.pl-cart-toast__variant');

    var title = item.product_title || item.title || 'Item';
    var variantTitle = item.variant_title || '';
    var image = item.image || (item.featured_image && item.featured_image.url) || '';

    if (img) {
      if (image) {
        img.src = image;
        img.alt = title;
      } else {
        img.removeAttribute('src');
        img.alt = '';
      }
    }

    if (name) name.textContent = title;

    if (variant) {
      if (variantTitle && variantTitle !== 'Default Title') {
        variant.textContent = variantTitle;
        variant.hidden = false;
      } else {
        variant.textContent = '';
        variant.hidden = true;
      }
    }

    clearTimers();
    el.classList.remove('is-hiding');
    el.hidden = false;

    requestAnimationFrame(function () {
      el.classList.add('is-visible');
    });

    hideTimer = window.setTimeout(hideToast, VISIBLE_MS);
  }

  window.plCartToast = {
    show: showToast,
    hide: hideToast
  };
})();
