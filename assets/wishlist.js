// Posterleague Client-Side Wishlist Manager (LocalStorage)

(function() {
  const WISHLIST_STORAGE_KEY = 'posterleague_wishlist';

  function getWishlist() {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading wishlist from localStorage', e);
      return [];
    }
  }

  function saveWishlist(items) {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      updateWishlistUI();
    } catch (e) {
      console.error('Error saving wishlist', e);
    }
  }

  function isInWishlist(handle) {
    if (!handle) return false;
    const items = getWishlist();
    return items.some(item => item.handle === handle);
  }

  function toggleWishlist(product) {
    if (!product || !product.handle) return false;
    let items = getWishlist();
    const index = items.findIndex(item => item.handle === product.handle);
    
    let nowInWishlist = false;
    if (index > -1) {
      items.splice(index, 1);
      nowInWishlist = false;
    } else {
      items.push(product);
      nowInWishlist = true;
    }
    
    saveWishlist(items);
    return nowInWishlist;
  }

  function removeFromWishlist(handle) {
    let items = getWishlist();
    items = items.filter(item => item.handle !== handle);
    saveWishlist(items);
  }

  function clearWishlist() {
    saveWishlist([]);
  }

  function openWishlistDrawer() {
    // Close cart drawer if open
    if (window.plCart && window.plCart.closeDrawer) {
      window.plCart.closeDrawer();
    }
    const drawer = document.getElementById('wishlist-drawer');
    const overlay = document.getElementById('wishlist-overlay');
    if (drawer) drawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeWishlistDrawer() {
    const drawer = document.getElementById('wishlist-drawer');
    const overlay = document.getElementById('wishlist-overlay');
    if (drawer) drawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function setIconSwapState(root, state) {
    const swap = root && root.classList && root.classList.contains('t-icon-swap')
      ? root
      : root && root.querySelector ? root.querySelector('.t-icon-swap') : null;
    if (swap) swap.setAttribute('data-state', state);
  }

  function updateWishlistUI() {
    const items = getWishlist();
    const count = items.length;

    // 1. Update Header badge + heart icon swap
    if (window.plNotificationBadge) {
      window.plNotificationBadge('wishlist-count-badge', count);
    }

    setIconSwapState(document.getElementById('wishlist-header-icon'), count > 0 ? 'b' : 'a');

    const headerCount = document.getElementById('wishlist-count-header');
    if (headerCount) {
      headerCount.textContent = count;
    }

    // 2. Update all Heart Buttons on the current page
    document.querySelectorAll('.btn-wishlist-toggle, .card-wishlist-btn').forEach(btn => {
      const handle = btn.getAttribute('data-product-handle');
      const inWish = isInWishlist(handle);
      btn.classList.toggle('is-active', inWish);
      setIconSwapState(btn, inWish ? 'b' : 'a');

      const label = btn.querySelector('.wishlist-text');
      if (label) {
        label.textContent = inWish ? 'Saved to Wishlist' : 'Add to Wishlist';
      }
    });

    // 3. Render Drawer Items
    const container = document.getElementById('wishlist-items');
    const emptyState = document.getElementById('wishlist-empty');
    
    if (container && emptyState) {
      if (count === 0) {
        emptyState.style.display = 'block';
        container.innerHTML = '';
      } else {
        emptyState.style.display = 'none';
        container.innerHTML = items.map(item => `
          <div class="wishlist-item" data-handle="${item.handle}">
            <a href="${item.url || '#'}" style="flex-shrink:0;">
              <img src="${item.image || ''}" alt="${item.title || 'Poster'}" class="wishlist-item__img">
            </a>
            <div class="wishlist-item__info">
              <a href="${item.url || '#'}" style="text-decoration:none;color:inherit;">
                <h4 class="wishlist-item__title">${item.title || 'Product'}</h4>
              </a>
              <div class="wishlist-item__price">${item.price || ''}</div>
              <div class="wishlist-item__actions">
                <a href="${item.url || '#'}" class="wishlist-item__btn-atc">View Product</a>
                <button type="button" class="wishlist-item__btn-remove" data-remove="${item.handle}" title="Remove">&#x2715;</button>
              </div>
            </div>
          </div>
        `).join('');

        // Attach remove click handlers
        container.querySelectorAll('[data-remove]').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            const handle = this.getAttribute('data-remove');
            removeFromWishlist(handle);
          });
        });
      }
    }
  }

  // Expose Global Wishlist API
  window.plWishlist = {
    getWishlist: getWishlist,
    saveWishlist: saveWishlist,
    isInWishlist: isInWishlist,
    toggleWishlist: toggleWishlist,
    removeFromWishlist: removeFromWishlist,
    clearWishlist: clearWishlist,
    openDrawer: openWishlistDrawer,
    closeDrawer: closeWishlistDrawer,
    updateUI: updateWishlistUI
  };

  // Global initialization
  document.addEventListener('DOMContentLoaded', function() {
    updateWishlistUI();

    // Header wishlist trigger
    const trigger = document.getElementById('wishlist-trigger');
    if (trigger) {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        openWishlistDrawer();
      });
    }

    // Close triggers
    document.querySelectorAll('.wishlist-drawer__close').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        closeWishlistDrawer();
      });
    });

    const overlay = document.getElementById('wishlist-overlay');
    if (overlay) {
      overlay.addEventListener('click', function() {
        closeWishlistDrawer();
      });
    }

    // Clear button
    const clearBtn = document.getElementById('clear-wishlist-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Clear all items from your wishlist?')) {
          clearWishlist();
        }
      });
    }

    // Delegate wishlist toggle on product cards & product page
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-wishlist-toggle, .card-wishlist-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const product = {
        handle: btn.getAttribute('data-product-handle'),
        title: btn.getAttribute('data-product-title'),
        price: btn.getAttribute('data-product-price'),
        image: btn.getAttribute('data-product-image'),
        url: btn.getAttribute('data-product-url')
      };

      toggleWishlist(product);
    });
  });
})();
