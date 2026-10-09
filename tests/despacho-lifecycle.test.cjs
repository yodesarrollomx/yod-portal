'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const source = require('node:fs').readFileSync(require.resolve('../despacho3d/office-lifecycle.mjs'), 'utf8');
const modulePromise = import('../despacho3d/office-lifecycle.mjs');
function element(tag = 'div') {
  const events = new Map(), attrs = new Map();
  return {
    tag, children: [], dataset: {}, style: {}, textContent: '', parent: null,
    append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); },
    setAttribute(key, value) { attrs.set(key, value); }, getAttribute(key) { return attrs.get(key); },
    addEventListener(name, fn) { events.set(name, fn); }, emit(name, event = {}) { events.get(name)?.(event); },
    contains(node) { return node === this || this.children.some(child => child.contains(node)); },
    focus() { this.focused = true; },
    querySelector(selector) {
      const matches = node => selector === '[data-recovery-message]' ? 'recoveryMessage' in node.dataset : node.tag === selector;
      for (const child of this.children) { if (matches(child)) return child; const nested = child.querySelector(selector); if (nested) return nested; }
      return null;
    }
  };
}
function environment(address = 'https://office.example/despacho3d/index.html?v=126#old-project') {
  const events = new Map(), timers = new Map(), navigations = [], replacements = [];
  let serial = 0;
  const body = element('body'), original = element('main');
  original.textContent = 'Private fixture: never transported'; body.append(original);
  const doc = {body, documentElement: element('html'), createElement: element};
  const win = {
    location: {href: address},
    history: {replaceState(state, unused, url) { replacements.push({state, url}); win.location.href = url; }},
    addEventListener(name, fn) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); },
    removeEventListener(name, fn) { events.get(name)?.delete(fn); },
    setTimeout(fn) { timers.set(++serial, fn); return serial; }, clearTimeout(id) { timers.delete(id); }
  };
  for (const property of ['localStorage', 'sessionStorage', 'navigator']) Object.defineProperty(win, property, {get() { throw new Error('Unexpected private capability: ' + property); }});
  const h = {win, doc, original, navigations, replacements,
    emit(name, value = {}) { for (const fn of [...(events.get(name) || [])]) fn(value); },
    flush() { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } },
    navigate(url) { navigations.push(url); },
    get curtain() { return body.children.find(node => 'officeRecovery' in node.dataset); },
    get notice() { return body.children.find(node => 'officeRecoveryNotice' in node.dataset); }
  };
  return h;
}
test('A normal first pageshow preserves the scene and does not recreate services', async () => {
  const {installOfficeLifecycle} = await modulePromise, h = environment();
  const api = installOfficeLifecycle({window: h.win, document: h.doc, navigate: h.navigate});
  h.emit('pageshow', {persisted: false}); h.flush();
  assert.equal(h.navigations.length, 0); assert.equal(h.curtain, undefined);
  assert.equal(api.automaticVoiceAllowed(), true); assert.equal(h.replacements.length, 0);
});
test('A retired document is hidden, cannot accept stale controls, and cannot enable voice', async () => {
  const {installOfficeLifecycle} = await modulePromise, h = environment();
  const api = installOfficeLifecycle({window: h.win, document: h.doc, navigate: h.navigate});
  h.emit('pagehide', {persisted: true});
  assert.equal(api.snapshot().phase, 'retired'); assert.equal(api.automaticVoiceAllowed(), false);
  assert.equal(api.allowVoiceFromGesture(), false);
  assert.equal(h.doc.documentElement.getAttribute('data-office-recovery'), 'retired');
  assert.ok(h.curtain.focused);
  let prevented = 0, stopped = 0;
  for (const type of ['click', 'pointerdown', 'keydown', 'submit'])
    h.emit(type, {target: h.original, preventDefault() { prevented++; }, stopImmediatePropagation() { stopped++; }});
  assert.equal(prevented, 4); assert.equal(stopped, 4);
  assert.equal(h.navigations.length, 0);
});
test('History restores a fresh same-origin document once, not disposed modules or project state', async () => {
  const {installOfficeLifecycle} = await modulePromise, h = environment();
  const api = installOfficeLifecycle({window: h.win, document: h.doc, navigate: h.navigate});
  h.emit('pagehide', {persisted: true}); h.emit('pageshow', {persisted: true}); h.emit('pageshow', {persisted: true});
  assert.equal(api.snapshot().phase, 'recovering'); assert.equal(h.navigations.length, 0);
  h.flush(); assert.equal(h.navigations.length, 1);
  const target = new URL(h.navigations[0]);
  assert.equal(target.origin, 'https://office.example'); assert.equal(target.pathname, '/despacho3d/index.html');
  assert.equal(target.searchParams.get('v'), '126'); assert.equal(target.searchParams.get('office_recovery'), 'history');
  assert.equal(target.hash, ''); assert.doesNotMatch(target.href, /old-project|Private/);
  assert.equal(api.automaticVoiceAllowed(), false);
});
test('A newly reconstructed document requires explicit voice even with browser microphone permission', async () => {
  const {installOfficeLifecycle} = await modulePromise, h = environment('https://office.example/despacho3d/index.html?v=126&office_recovery=history');
  const api = installOfficeLifecycle({window: h.win, document: h.doc, navigate: h.navigate});
  assert.equal(api.snapshot().recovered, true); assert.equal(api.automaticVoiceAllowed(), false);
  assert.equal(h.replacements.length, 1); assert.equal(h.replacements[0].state, null);
  assert.equal(new URL(h.win.location.href).searchParams.has('office_recovery'), false);
  assert.match(h.notice.children[0].textContent, /Pulsa Hablar/);
  h.notice.querySelector('button').emit('click');
  assert.equal(api.automaticVoiceAllowed(), false, 'Dismissing recovery notice is not microphone consent');
  h.emit('pageshow', {persisted: false}); h.flush(); assert.equal(h.navigations.length, 0);
  assert.equal(api.allowVoiceFromGesture(), true); assert.equal(api.automaticVoiceAllowed(), true);
});
test('Failed navigation gives a working retry while keeping old private UI retired', async () => {
  const {installOfficeLifecycle} = await modulePromise, h = environment();
  let calls = 0;
  const api = installOfficeLifecycle({window: h.win, document: h.doc, navigate(url) { if (++calls === 1) throw Error('navigation unavailable'); h.navigate(url); }});
  h.emit('pagehide', {persisted: true}); h.emit('pageshow', {persisted: true}); h.flush();
  assert.match(h.curtain.querySelector('[data-recovery-message]').textContent, /no pudo recargarse/);
  const retry = h.curtain.querySelector('button');
  h.emit('click', {target: retry, preventDefault() { throw Error('Retry must remain usable'); }, stopImmediatePropagation() {}});
  retry.emit('click');
  assert.equal(h.navigations.length, 1); assert.equal(api.automaticVoiceAllowed(), false);
});
test('A second pagehide cancels a scheduled recovery; disposal never uncovers old private panels', async () => {
  const {installOfficeLifecycle} = await modulePromise, h = environment();
  const api = installOfficeLifecycle({window: h.win, document: h.doc, navigate: h.navigate});
  h.emit('pagehide', {persisted: true}); h.emit('pageshow', {persisted: true});
  h.emit('pagehide', {persisted: true}); h.flush(); assert.equal(h.navigations.length, 0);
  api.dispose(); h.emit('pageshow', {persisted: true}); h.flush();
  assert.equal(h.navigations.length, 0); assert.equal(api.automaticVoiceAllowed(), false);
  assert.equal(h.doc.documentElement.getAttribute('data-office-recovery'), 'retired');
});
test('Recovery does not read storage, open microphone, replay requests or post private state', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|getUserMedia|postMessage|fetch\(/);
});
