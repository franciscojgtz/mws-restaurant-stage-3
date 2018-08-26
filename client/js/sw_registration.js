'use strict';

/**
 * Notify service worker updates
 * @param {object} reg 
 */
function notifySWUpdates(reg) {
  console.log('There is a new Service Worker available');
  // create button
  var buttonSW = document.createElement('button');
  buttonSW.classList.add('sw-button');
  buttonSW.innerHTML = 'Update Available';
  // append button
  var docBody = document.getElementsByTagName('body')[0];
  docBody.appendChild(buttonSW);
  // onclick, post message
  buttonSW.addEventListener('click', function () {
    reg.postMessage({ activate: 'true' });
  });
}

/**
 * Track service worker states
 * @param {object} reg 
 */
function trackSWStates(reg) {
  var _this = this;

  reg.addEventListener('statechange', function () {
    if (_this.state === 'installed') {
      notifySWUpdates(reg);
    }
  });
}

/**
 * Register service worker
 */
function registerServiceWorker() {
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    // refers to the SW that controls this page
    if (!navigator.serviceWorker.controller) {
      // page didn't load using a SW
      // loaded from the network
      return;
    }

    if (reg.waiting) {
      // there's an update ready!
      notifySWUpdates(reg.waiting);
    }

    if (reg.installing) {
      // there's an update in progress
      trackSWStates(reg.installing);
    }

    reg.addEventListener('updatefound', function () {
      trackSWStates(reg.installing);
    });

    var reloading = void 0;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return;
      window.location.reload();
      reloading = true;
    });
  }).catch(function (err) {
    console.log('SW failed: ', err);
  });
}

/**
 * register service worker
 */
registerServiceWorker();