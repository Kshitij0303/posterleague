// POSTERLEAGUE — Transitions.dev notification badge helper
(function() {
  function setBadge(wrapperId, count) {
    var wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    var dot = wrapper.querySelector('.t-badge-dot');
    var n = Math.max(0, parseInt(count, 10) || 0);
    var open = n > 0;

    if (dot) {
      dot.textContent = n > 99 ? '99+' : String(n);
    }

    wrapper.setAttribute('data-open', open ? 'true' : 'false');
    wrapper.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function setCartBadges(count) {
    setBadge('cart-count-badge', count);
    setBadge('cart-page-count-badge', count);
  }

  window.plNotificationBadge = setBadge;
  window.plCartBadge = setCartBadges;
})();
