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

  // Formats cents with the shop's own money format (e.g. "Rs. {{amount}}").
  function formatMoney(cents, format) {
    var value = (parseInt(cents, 10) || 0) / 100;
    function withDelimiters(decimals, thousands, decimal) {
      var parts = value.toFixed(decimals).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return parts.join(decimal);
    }
    var match = (format || '').match(/\{\{\s*(\w+)\s*\}\}/);
    var amount;
    switch (match ? match[1] : 'amount') {
      case 'amount_no_decimals': amount = withDelimiters(0, ',', '.'); break;
      case 'amount_with_comma_separator': amount = withDelimiters(2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': amount = withDelimiters(0, '.', ','); break;
      default: amount = withDelimiters(2, ',', '.');
    }
    return match ? format.replace(match[0], amount) : amount;
  }

  // Updates the header cart subtotal ("Subtotal Rs. 0.00").
  function setCartSubtotal(cents) {
    var el = document.getElementById('HeaderCartTotal');
    if (!el) return;
    var text = formatMoney(cents, el.getAttribute('data-money-format'));
    el.textContent = text;
    var link = el.closest('a');
    if (link) link.setAttribute('aria-label', 'Cart, subtotal ' + text);
  }

  window.plNotificationBadge = setBadge;
  window.plCartBadge = setCartBadges;
  window.plCartSubtotal = setCartSubtotal;
})();
