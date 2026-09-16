/**
 * POSTERLEAGUE — Secure Data Protection (JavaScript)
 * --------------------------------------------------
 * Guards elements marked with class "secure-data" against casual capture:
 *
 *   1. Blocks common print/save shortcuts (Ctrl/Cmd+P, Ctrl/Cmd+S, PrintScreen)
 *   2. Blurs secure blocks when the tab loses focus or visibility
 *   3. Pairs with secure-data-protection.css for @media print hiding
 *
 * HOW TO USE IN HTML / LIQUID
 * ---------------------------
 * Wrap sensitive content:
 *
 *   <div class="secure-data"
 *        data-shield-label="Voucher hidden"
 *        data-print-message="Voucher codes cannot be printed.">
 *     <p>Code: PL-XXXX-YYYY</p>
 *   </div>
 *
 * LIMITATIONS (be honest with stakeholders)
 * -----------------------------------------
 * - OS screenshots (Win+Shift+S, phone hardware buttons) cannot be blocked.
 * - Shopify Checkout runs on checkout.shopify.com — theme scripts do NOT apply there.
 * - Determined users can always bypass client-side deterrents.
 * - This is a casual-deterrent layer, not cryptographic protection.
 */
(function () {
  'use strict';

  var SELECTOR = '.secure-data';
  var BODY_SHIELD_CLASS = 'secure-shield-on';
  var TEMP_SHIELD_MS = 3200;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var liveRegion = null;
  var tempTimer = null;

  /** @type {{ visibility: boolean, windowBlur: boolean, keyboard: boolean, printing: boolean }} */
  var reasons = {
    visibility: false,
    windowBlur: false,
    keyboard: false,
    printing: false
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  function getSecureNodes() {
    return document.querySelectorAll(SELECTOR);
  }

  function hasSecureContent() {
    return getSecureNodes().length > 0;
  }

  function anyReasonActive() {
    return reasons.visibility || reasons.windowBlur || reasons.keyboard || reasons.printing;
  }

  function ensureLiveRegion() {
    if (liveRegion) return liveRegion;
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';
    liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  function announce(message) {
    var node = ensureLiveRegion();
    node.textContent = '';
    window.setTimeout(function () {
      node.textContent = message;
    }, 10);
  }

  function syncShield() {
    var active = hasSecureContent() && anyReasonActive();
    document.body.classList.toggle(BODY_SHIELD_CLASS, active);

    getSecureNodes().forEach(function (el) {
      if (active) {
        el.setAttribute('inert', '');
        el.setAttribute('aria-busy', 'true');
      } else {
        el.removeAttribute('inert');
        el.removeAttribute('aria-busy');
      }
    });
  }

  function setReason(key, value) {
    reasons[key] = value;
    syncShield();
  }

  function triggerTemporaryShield(message) {
    setReason('keyboard', true);
    announce(message || 'Protected content temporarily hidden.');

    window.clearTimeout(tempTimer);
    tempTimer = window.setTimeout(function () {
      setReason('keyboard', false);
      announce('Protected content restored.');
    }, reducedMotion ? 1500 : TEMP_SHIELD_MS);
  }

  function isModifierKey(event) {
    return event.ctrlKey || event.metaKey;
  }

  function isBlockedShortcut(event) {
    var key = (event.key || '').toLowerCase();

    if (key === 'printscreen') return true;

    if (!isModifierKey(event)) return false;

    // Print: Ctrl+P / Cmd+P
    if (key === 'p') return true;
    // Save page: Ctrl+S / Cmd+S
    if (key === 's') return true;

    return false;
  }

  // ── Event handlers ──────────────────────────────────────────────────────

  function onKeyDown(event) {
    if (!hasSecureContent() || !isBlockedShortcut(event)) return;

    event.preventDefault();
    event.stopPropagation();
    triggerTemporaryShield('Print and save shortcuts are disabled for protected content.');
  }

  function onVisibilityChange() {
    setReason('visibility', document.hidden);
  }

  function onWindowBlur() {
    // Fires when user alt-tabs or activates external snippet/screenshot tools
    setReason('windowBlur', true);
  }

  function onWindowFocus() {
    setReason('windowBlur', false);
    if (!document.hidden) {
      setReason('visibility', false);
    }
  }

  function onBeforePrint() {
    setReason('printing', true);
  }

  function onAfterPrint() {
    setReason('printing', false);
  }

  // ── Boot ────────────────────────────────────────────────────────────────

  function init() {
    if (!hasSecureContent()) return;

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    // Re-check when Shopify theme editor injects sections
    document.addEventListener('shopify:section:load', syncShield);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
