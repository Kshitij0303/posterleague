// POSTERLEAGUE Theme JS

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

let mobileNavScrollY = 0;

function measureSiteNavTop() {
  const header = document.querySelector('.site-header');
  const headerBar = document.querySelector('.site-header .header-container');
  if (!header || !headerBar) return 70;

  const headerRect = header.getBoundingClientRect();
  const headerBarHeight = Math.round(headerBar.offsetHeight);

  // Sticky header is pinned to the viewport top once the announcement bar scrolls away.
  if (headerRect.top <= 1) {
    return headerBarHeight;
  }

  return Math.max(Math.round(headerRect.bottom), headerBarHeight);
}

function applySiteNavTop() {
  const top = measureSiteNavTop();
  document.documentElement.style.setProperty('--site-nav-top', top + 'px');
  return top;
}

function lockPageScroll() {
  mobileNavScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${mobileNavScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockPageScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, mobileNavScrollY);
}

function setMenuIconState(isOpen) {
  const swap = document.getElementById('mobile-menu-icon');
  const toggle = document.getElementById('mobile-menu-toggle');
  if (swap) swap.setAttribute('data-state', isOpen ? 'b' : 'a');
  if (toggle) {
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applySiteNavTop();
  window.addEventListener('resize', debounce(applySiteNavTop, 100));

  // Announcement bar close
  const annBar = document.querySelector('.announcement-bar');
  const annCloseBtn = document.querySelector('.announcement-bar__close');
  if (annBar && annCloseBtn) {
    annCloseBtn.addEventListener('click', () => {
      annBar.style.display = 'none';
      applySiteNavTop();
    });
  }

  // Mobile nav toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

  function openMobileNav() {
    lockPageScroll();
    const navTop = applySiteNavTop();

    if (mobileNavDrawer) {
      mobileNavDrawer.style.setProperty('--site-nav-top', `${navTop}px`);
      mobileNavDrawer.classList.add('is-open');
      mobileNavDrawer.setAttribute('aria-hidden', 'false');
    }
    if (mobileNavOverlay) mobileNavOverlay.classList.add('is-open');
    document.body.classList.add('mobile-nav-open');
    setMenuIconState(true);
  }

  function closeMobileNav() {
    if (mobileNavDrawer) {
      mobileNavDrawer.classList.remove('is-open');
      mobileNavDrawer.setAttribute('aria-hidden', 'true');
    }
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('is-open');
    document.body.classList.remove('mobile-nav-open');
    unlockPageScroll();
    applySiteNavTop();
    setMenuIconState(false);
  }

  function toggleMobileNav() {
    if (mobileNavDrawer && mobileNavDrawer.classList.contains('is-open')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

  const mobileNavClose = document.getElementById('mobile-nav-close');
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // Close mobile nav when a plain link is tapped
  if (mobileNavDrawer) {
    mobileNavDrawer.querySelectorAll('nav a:not([href^="#"])').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Lazy loading images
  if ('IntersectionObserver' in window) {
    const lazyImages = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          if (lazyImage.dataset.src) lazyImage.src = lazyImage.dataset.src;
          if (lazyImage.dataset.srcset) lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.removeAttribute('loading');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(lazyImage => {
      lazyImageObserver.observe(lazyImage);
    });
  }
});
