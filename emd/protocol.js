(function (root) {
  'use strict';
  const CHANNEL = 'emd-github-v1';
  const TIMEOUT_MS = 35000;
  const validFragment = value => typeof value === 'string' &&
    (value === '' || /^#(?:token|reviewer)=[A-Za-z0-9-]{40,200}$/.test(value));
  const validOrigin = origin => origin === 'https://script.google.com' ||
    /^https:\/\/[A-Za-z0-9-]+\.googleusercontent\.com$/.test(origin);

  function createNonce(crypto) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function frameURL(endpoint, nonce) {
    const url = new URL(endpoint);
    if (url.origin !== 'https://script.google.com' ||
        !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) ||
        url.search || url.hash || !/^[a-f0-9]{32}$/.test(nonce)) {
      throw new Error('Invalid portal endpoint or nonce');
    }
    url.searchParams.set('embed', '1');
    url.searchParams.set('nonce', nonce);
    return url.href;
  }

  // Google HTMLService may send from a nested frame, not iframe.contentWindow.
  // The first trusted ready pins the actual inner source and its exact origin.
  function createSession(nonce, fragment, onAuthorized) {
    if (!/^[a-f0-9]{32}$/.test(nonce) || !validFragment(fragment)) {
      throw new Error('Invalid access session');
    }
    let source = null;
    let origin = null;
    let phase = 'waiting';
    return {
      receive(event) {
        const data = event.data;
        if (phase === 'closed' || phase === 'authorized' || !data ||
            data.channel !== CHANNEL || data.nonce !== nonce ||
            !validOrigin(event.origin) || !event.source ||
            typeof event.source.postMessage !== 'function') return false;
        if (phase === 'waiting' && data.type === 'ready') {
          source = event.source;
          origin = event.origin;
          phase = 'access-sent';
          source.postMessage({ channel: CHANNEL, nonce, type: 'access', fragment }, origin);
          return true;
        }
        if (phase === 'access-sent' && data.type === 'authorized' &&
            event.source === source && event.origin === origin) {
          phase = 'authorized';
          onAuthorized();
          return true;
        }
        return false;
      },
      close() { phase = 'closed'; source = null; origin = null; fragment = ''; }
    };
  }
  const api = { CHANNEL, TIMEOUT_MS, validFragment, validOrigin, createNonce, frameURL, createSession };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EMDProtocol = api;
})(typeof globalThis === 'object' ? globalThis : this);
