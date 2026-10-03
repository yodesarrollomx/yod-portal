'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const P = require('./protocol.js');
const nonce = '0123456789abcdef0123456789abcdef';
const fragment = '#token=' + 'a'.repeat(40);
const origin = 'https://synthetic-123.googleusercontent.com';
const endpoint = 'https://script.google.com/macros/s/SYNTHETIC_DEPLOYMENT/exec';
const data = type => ({ channel: P.CHANNEL, nonce, type });
function sender() {
  return { calls: [], postMessage(payload, targetOrigin) { this.calls.push({ payload, targetOrigin }); } };
}

test('fragment grammar accepts empty and one exact generated access value', () => {
  for (const key of ['token', 'reviewer']) {
    for (const length of [40, 200]) assert.ok(P.validFragment('#' + key + '=' + 'a'.repeat(length)));
  }
  assert.ok(P.validFragment(''));
  assert.ok(P.validFragment('#reviewer=' + 'A0-b'.repeat(10)));
  for (const bad of ['#', '#token=', '#token=' + 'a'.repeat(39), '#token=' + 'a'.repeat(201),
    fragment + '&reviewer=' + 'b'.repeat(40), fragment + '&x=1', fragment + '\n',
    '#token=' + '%61'.repeat(40), '#token=' + '_'.repeat(40), '#other=' + 'a'.repeat(40), null]) {
    assert.equal(P.validFragment(bad), false);
  }
});

test('trusted origins require exact HTTPS Google hosts', () => {
  assert.ok(P.validOrigin(origin));
  assert.ok(P.validOrigin('https://script.google.com'));
  for (const bad of ['null', 'http://script.google.com', 'https://script.google.com.evil.test',
    'https://googleusercontent.com', 'https://a.b.googleusercontent.com',
    'https://a.googleusercontent.com:443', 'https://a.googleusercontent.com/path',
    'https://a_b.googleusercontent.com', 'https://evil.test']) assert.equal(P.validOrigin(bad), false);
});

test('nonce uses sixteen random bytes; iframe URL contains only embed and nonce', () => {
  let size;
  const value = P.createNonce({ getRandomValues(bytes) { size = bytes.length; return bytes.fill(171); } });
  assert.equal(size, 16);
  assert.equal(value, 'ab'.repeat(16));
  assert.match(P.createNonce(webcrypto), /^[a-f0-9]{32}$/);
  const url = new URL(P.frameURL(endpoint, nonce));
  assert.equal(url.hash, '');
  assert.equal(url.search, '?embed=1&nonce=' + nonce);
  for (const bad of [endpoint + '#token=synthetic', endpoint + '?token=synthetic',
    'https://evil.test/exec', 'https://script.google.com/other']) assert.throws(() => P.frameURL(bad, nonce));
  assert.throws(() => P.frameURL(endpoint, 'bad'));
});

test('ready pins nested sender, delivers access once, and requires matching authorized', () => {
  let reveals = 0;
  const source = sender();
  const other = sender();
  const session = P.createSession(nonce, fragment, () => reveals++);
  const event = type => ({ data: data(type), source, origin });
  assert.equal(session.receive(event('authorized')), false);
  assert.equal(session.receive({ ...event('ready'), origin: 'https://evil.test' }), false);
  assert.equal(session.receive({ ...event('ready'), data: { ...data('ready'), nonce: 'f'.repeat(32) } }), false);
  assert.equal(session.receive({ ...event('ready'), data: { ...data('ready'), channel: 'wrong' } }), false);
  assert.equal(session.receive({ ...event('ready'), source: null }), false);
  assert.equal(source.calls.length, 0);
  assert.equal(session.receive(event('ready')), true);
  assert.deepEqual(source.calls, [{ payload: { ...data('access'), fragment }, targetOrigin: origin }]);
  assert.equal(reveals, 0);
  assert.equal(session.receive(event('ready')), false);
  assert.equal(session.receive({ ...event('ready'), source: other }), false);
  assert.equal(session.receive({ ...event('authorized'), source: other }), false);
  assert.equal(session.receive({ ...event('authorized'), origin: 'https://script.google.com' }), false);
  assert.equal(session.receive(event('authorized')), true);
  assert.equal(session.receive(event('authorized')), false);
  assert.equal(reveals, 1);
  assert.equal(source.calls.length, 1);
  assert.equal(other.calls.length, 0);
});

test('closed session refuses late ready or authorized; empty access is delivered as empty', () => {
  const source = sender();
  const session = P.createSession(nonce, '', () => {});
  session.receive({ data: data('ready'), source, origin: 'https://script.google.com' });
  assert.equal(source.calls[0].payload.fragment, '');
  session.close();
  assert.equal(session.receive({ data: data('authorized'), source, origin: 'https://script.google.com' }), false);
  assert.equal(session.receive({ data: data('ready'), source, origin: 'https://script.google.com' }), false);
  assert.equal(source.calls.length, 1);
});

// Synthetic DOM and timers: no Google endpoint is fetched and no RPC exists.
function page({ hash = fragment, search = '', embedded = false } = {}) {
  const elements = {};
  for (const id of ['portal', 'status', 'message', 'retry']) {
    elements[id] = { hidden: id !== 'status', listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      removeAttribute(key) { delete this[key]; } };
  }
  const listeners = {};
  const timers = new Map();
  let timerId = 0;
  const document = { body: { hidden: true }, getElementById(id) { return elements[id]; } };
  const window = { EMDProtocol: P, EMD_ENDPOINT: endpoint, crypto: webcrypto,
    addEventListener(type, fn) { listeners[type] = fn; } };
  window.self = window;
  window.top = embedded ? {} : window;
  vm.runInNewContext(readFileSync(join(__dirname, 'wrapper.js'), 'utf8'), {
    window, document, location: { hash, search },
    setTimeout(fn, ms) { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout(id) { timers.delete(id); }
  });
  const send = (type, source, messageNonce, messageOrigin = origin) => listeners.message({
    data: { channel: P.CHANNEL, nonce: messageNonce, type }, source, origin: messageOrigin
  });
  return { elements, listeners, timers, document, send };
}

test('embedded parent stays invisible and loads no frame', () => {
  const p = page({ embedded: true });
  assert.equal(p.document.body.hidden, true);
  assert.equal(p.elements.portal.src, undefined);
  assert.equal(p.timers.size, 0);
  assert.deepEqual(Object.keys(p.listeners), []);
});

test('invalid fragment or parent query fails before any embed', () => {
  for (const options of [{ hash: '#token=bad' }, { search: '?token=synthetic' }]) {
    const p = page(options);
    assert.equal(p.elements.portal.src, undefined);
    assert.equal(p.elements.retry.hidden, true);
    assert.equal(p.timers.size, 0);
  }
});

test('35s timeout destroys frame; only user retry starts fresh nonce and rejects stale ACK', () => {
  const p = page();
  const first = new URL(p.elements.portal.src).searchParams.get('nonce');
  const oldSource = sender();
  p.send('ready', oldSource, first);
  assert.equal(p.elements.portal.hidden, true);
  const timer = [...p.timers.values()][0];
  assert.equal(timer.ms, 35000);
  timer.fn();
  assert.equal(p.elements.portal.src, undefined);
  assert.equal(p.elements.retry.hidden, false);
  assert.equal(p.timers.size, 0);
  p.send('authorized', oldSource, first);
  assert.equal(p.elements.portal.hidden, true);
  p.elements.retry.listeners.click();
  const second = new URL(p.elements.portal.src).searchParams.get('nonce');
  assert.notEqual(first, second);
  p.send('authorized', oldSource, first);
  assert.equal(p.elements.portal.hidden, true);
  const current = sender();
  p.send('ready', current, second);
  p.send('authorized', current, second);
  assert.equal(p.elements.portal.hidden, false);
  assert.equal(p.elements.status.hidden, true);
  assert.equal(p.timers.size, 0);
});

test('empty parent fragment completes handshake without manufacturing credentials', () => {
  const p = page({ hash: '' });
  const current = sender();
  p.send('ready', current, new URL(p.elements.portal.src).searchParams.get('nonce'));
  assert.equal(current.calls[0].payload.fragment, '');
});

test('hash changes stop the old session without automatically reloading it', () => {
  const p = page();
  p.listeners.hashchange();
  assert.equal(p.elements.portal.src, undefined);
  assert.equal(p.elements.portal.hidden, true);
  assert.equal(p.elements.retry.hidden, true);
  assert.equal(p.timers.size, 0);
});

test('HTML confines embedding and referrers; wrapper contains no storage or RPC calls', () => {
  const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /referrerpolicy="no-referrer"/);
  assert.match(html, /sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals"/);
  assert.match(html, /frame-src https:\/\/script.google.com https:\/\/\*\.googleusercontent.com;/);
  const runtime = ['wrapper.js', 'protocol.js'].map(f => readFileSync(join(__dirname, f), 'utf8')).join('\n');
  assert.doesNotMatch(runtime, /localStorage|sessionStorage|google\.script\.run|fetch\(/);
  assert.doesNotMatch(runtime, /postMessage\([^\n]*['"]\*['"]/);
});
