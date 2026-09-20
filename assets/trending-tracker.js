/**
 * POSTERLEAGUE — lightweight product view tracking (local browser).
 * Used to supplement trending on the homepage when sales data is still building.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pl_trending_views';
  var MAX_HANDLES = 40;

  function readViews() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function writeViews(views) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    } catch (e) {}
  }

  function recordProductView(handle) {
    if (!handle) return;
    var views = readViews();
    views[handle] = (views[handle] || 0) + 1;
    views['__last__' + handle] = Date.now();
    writeViews(views);
  }

  function getTopHandles(limit) {
    var views = readViews();
    return Object.keys(views)
      .filter(function (key) {
        return key.indexOf('__last__') !== 0;
      })
      .sort(function (a, b) {
        return (views[b] || 0) - (views[a] || 0);
      })
      .slice(0, limit || 8);
  }

  if (window.location.pathname.indexOf('/products/') !== -1) {
    var handle = window.location.pathname.split('/products/')[1];
    if (handle) {
      handle = handle.split('/')[0].split('?')[0];
      recordProductView(handle);
    }
  }

  window.PLTrending = {
    recordProductView: recordProductView,
    getTopHandles: getTopHandles
  };
})();
