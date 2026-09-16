// POSTERLEAGUE Cart — AJAX add to cart, badge updates (stay on product page)

(function () {
  var ADDED_RESET_MS = 550;
  var ERROR_RESET_MS = 1200;

  function setButtonState(btn, state) {
    if (!btn) return;
    btn.classList.remove('is-pressing', 'is-adding', 'is-added');
    if (state) btn.classList.add(state);
  }

  async function refreshCartBadge() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      const count = cart.item_count || 0;
      if (window.plCartBadge) {
        window.plCartBadge(count);
      } else if (window.plNotificationBadge) {
        window.plNotificationBadge('cart-count-badge', count);
      }
      return cart;
    } catch (err) {
      console.error('Cart fetch error:', err);
      return null;
    }
  }

  async function addToCart(formData) {
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const item = await res.json();
        refreshCartBadge();
        if (window.plCartToast) {
          window.plCartToast.show(item);
        }
        return true;
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
    }
    return false;
  }

  window.plCart = {
    openDrawer: function () {
      window.location.href = '/cart';
    },
    closeDrawer: function () {},
    refreshCart: refreshCartBadge,
    addItem: addToCart
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('submit', async function (e) {
      const form = e.target.closest('form[action="/cart/add"]');
      if (!form) return;

      e.preventDefault();
      const submitBtn = form.querySelector('[type="submit"], #AddToCart');
      const submitText = form.querySelector('#AddToCartText');
      const prevText = submitText ? submitText.textContent : 'Add to Cart';

      if (submitBtn) {
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.classList.add('is-busy');
        setButtonState(submitBtn, 'is-pressing');
      }
      if (submitText) submitText.textContent = 'Adding...';

      const ok = await addToCart(new FormData(form));

      if (submitBtn) {
        submitBtn.removeAttribute('aria-busy');
        submitBtn.classList.remove('is-busy');
        setButtonState(submitBtn, ok ? 'is-added' : null);
      }

      if (ok && submitText) {
        submitText.textContent = 'Added ✓';
        window.setTimeout(function () {
          if (submitBtn) setButtonState(submitBtn, null);
          submitText.textContent = prevText;
        }, ADDED_RESET_MS);
      } else if (submitText) {
        submitText.textContent = 'Try again';
        window.setTimeout(function () {
          submitText.textContent = prevText;
        }, ERROR_RESET_MS);
      }
    });

    refreshCartBadge();
  });
})();
