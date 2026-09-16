/**
 * Cart remove — button animation, collapse row, update cart (no full reload).
 */
(function () {
  'use strict';

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function formatMoney(cents) {
    var amount = (cents / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return 'Rs. ' + amount;
  }

  async function changeLineByKey(key, qty) {
    var res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    });
    if (!res.ok) throw new Error('Cart update failed');
    return res.json();
  }

  function collapseAndRemoveRow(row, reducedMotion) {
    return new Promise(function (resolve) {
      if (!row) {
        resolve();
        return;
      }

      if (reducedMotion) {
        row.remove();
        resolve();
        return;
      }

      var height = row.getBoundingClientRect().height;
      row.style.height = height + 'px';
      row.style.overflow = 'hidden';
      row.classList.add('is-removing-row');

      requestAnimationFrame(function () {
        row.style.height = '0';
        row.style.paddingTop = '0';
        row.style.paddingBottom = '0';
        row.style.marginTop = '0';
        row.style.marginBottom = '0';
        row.style.borderBottomWidth = '0';
        row.style.opacity = '0';
        row.style.transform = 'translateX(12px)';
      });

      var done = false;
      function finish() {
        if (done) return;
        done = true;
        row.remove();
        resolve();
      }

      row.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== row || e.propertyName !== 'height') return;
        row.removeEventListener('transitionend', onEnd);
        finish();
      });

      window.setTimeout(finish, 450);
    });
  }

  function reindexCartLines(root) {
    var items = root.querySelectorAll('#cart-page-items .cart-minimal__item');
    items.forEach(function (item, index) {
      var line = String(index + 1);
      item.setAttribute('data-line', line);
      item.querySelectorAll('[data-line]').forEach(function (el) {
        el.setAttribute('data-line', line);
      });
    });
  }

  function updateCartUI(cart) {
    var subtotal = document.getElementById('cart-page-subtotal');
    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);

    if (window.plCartBadge) {
      window.plCartBadge(cart.item_count);
    } else if (window.plNotificationBadge) {
      window.plNotificationBadge('cart-page-count-badge', cart.item_count);
      window.plNotificationBadge('cart-count-badge', cart.item_count);
    }
  }

  function bindRemoveButtons(root) {
    if (!root) return;

    root.querySelectorAll('.cart-item__remove-btn').forEach(function (btn) {
      if (btn.dataset.removeBound === 'true') return;
      btn.dataset.removeBound = 'true';

      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (btn.classList.contains('is-removing')) return;

        var row = btn.closest('.cart-minimal__item');
        var lineKey = row ? row.getAttribute('data-key') : null;
        if (!lineKey) return;

        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        btn.classList.add('is-removing');

        try {
          if (!reducedMotion) await wait(200);

          var cartPromise = changeLineByKey(lineKey, 0);
          await collapseAndRemoveRow(row, reducedMotion);

          var cart = await cartPromise;
          updateCartUI(cart);
          reindexCartLines(root);

          if (cart.item_count === 0) {
            window.location.reload();
          }
        } catch (err) {
          console.error(err);
          window.location.reload();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindRemoveButtons(document.getElementById('main-cart'));
  });
})();
