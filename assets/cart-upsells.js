// Cart glue-dot upsells — resolve product + add to cart

(function() {
  function pickVariant(product) {
    if (!product || !product.variants || !product.variants.length) return null;
    var available = product.variants.find(function(v) { return v.available; });
    return (available || product.variants[0]).id;
  }

  async function fetchVariantFromHandle(handle) {
    if (!handle) return null;
    try {
      var res = await fetch('/products/' + encodeURIComponent(handle) + '.js');
      if (!res.ok) return null;
      var product = await res.json();
      return pickVariant(product);
    } catch (err) {
      return null;
    }
  }

  async function searchVariant(term) {
    if (!term) return null;
    try {
      var res = await fetch(
        '/search/suggest.json?q=' + encodeURIComponent(term) + '&resources[type]=product&limit=8'
      );
      if (!res.ok) return null;
      var data = await res.json();
      var products = data.resources && data.resources.results && data.resources.results.products;
      if (!products || !products.length) return null;

      for (var i = 0; i < products.length; i++) {
        var id = await fetchVariantFromHandle(products[i].handle);
        if (id) return id;
      }
    } catch (err) {
      return null;
    }
    return null;
  }

  async function resolveVariant(btn) {
    var vid = parseInt(btn.getAttribute('data-variant-id') || '', 10);
    if (vid) return vid;

    var handle = btn.getAttribute('data-handle');
    var fromHandle = await fetchVariantFromHandle(handle);
    if (fromHandle) return fromHandle;

    return await searchVariant(btn.getAttribute('data-search'));
  }

  async function addUpsell(btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    var prev = btn.textContent;
    btn.textContent = 'Adding...';

    try {
      var variantId = await resolveVariant(btn);
      if (!variantId) {
        btn.textContent = 'Unavailable';
        setTimeout(function() {
          btn.textContent = prev;
          btn.disabled = false;
        }, 2000);
        return;
      }

      var res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });

      if (res.ok) {
        window.location.reload();
        return;
      }

      btn.textContent = 'Error';
    } catch (err) {
      console.error('Upsell add error:', err);
      btn.textContent = 'Error';
    }

    setTimeout(function() {
      btn.textContent = prev;
      btn.disabled = false;
    }, 2000);
  }

  function bindUpsellButtons() {
    document.querySelectorAll('.cart-upsell-add').forEach(function(btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        addUpsell(btn);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', bindUpsellButtons);
  document.addEventListener('shopify:section:load', bindUpsellButtons);
})();
