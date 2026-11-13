/* Geometric requests from the same-origin office open the existing human composer.
   No credentials, business records, captures or submission cross this bridge. */
(function (root) {
  'use strict';
  if (root.YodDespachoChinches) return;
  var CHILD_ORIGIN = root.location.origin;
  var ZONES = ['editing','editorial','funnel','entry','reception','patio','potential','case','projects','delivery','decisions','lounge'];
  var MAX_REQUESTS = 200;
  var UI_SURFACES = ['office','areas','help','agent','chat','tasks','evidence','sources','browser','ppp','knowledge','library','activity','goals','permissions','visits','environment','circle','residents','profile','voice','terminal'];
  function validUI(ui) {
    return keys(ui, ['surface','path','item']) && UI_SURFACES.indexOf(ui.surface) !== -1 &&
      typeof ui.path === 'string' && ui.path.length > 0 && ui.path.length <= 600 &&
      /^[a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\)(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\))*$/.test(ui.path) &&
      (ui.item === null || Number.isInteger(ui.item) && ui.item >= 0 && ui.item <= 9999);
  }
  function keys(value, expected) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    var own = Reflect.ownKeys(value);
    return own.length === expected.length && expected.every(function (key) { return Object.prototype.hasOwnProperty.call(value, key); });
  }
  function number(value, min, max) { return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max; }
  function vector(value, length, limit) {
    return Array.isArray(value) && value.length === length && Reflect.ownKeys(value).length === length + 1 && Array.from(value).every(function (n) { return number(n, -limit, limit); });
  }
  function uuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  function validContext(value) {
    if (!keys(value, ['target','view','modelVersion','viewport']) || value.modelVersion !== 'despacho-v2') return false;
    var target = value.target, view = value.view, viewport = value.viewport;
    var withUI = Object.prototype.hasOwnProperty.call(target || {}, 'ui');
    if (!keys(target, withUI ? ['id','zone','kind','point','ui'] : ['id','zone','kind','point']) || ZONES.indexOf(target.zone) === -1) return false;
    if (withUI && (target.kind !== 'interface' || !validUI(target.ui))) return false;
    if (target.kind !== 'zone' && target.kind !== 'interface') return false;
    if (target.id !== (target.kind === 'zone' ? 'zone:' : 'panel:') + target.zone) return false;
    if (target.kind === 'zone' ? !vector(target.point, 3, 250) : target.point !== null) return false;
    var ortho = Object.prototype.hasOwnProperty.call(view || {}, 'orthographic');
    if (!keys(view, ortho ? ['position','quaternion','fov','mode','orthographic'] : ['position','quaternion','fov','mode'])) return false;
    if (view.mode === 'map') {
      if (ortho || !withUI || view.position !== null || view.quaternion !== null || view.fov !== null) return false;
    } else {
      if (!vector(view.position, 3, 250) || !vector(view.quaternion, 4, 1)) return false;
      var norm = view.quaternion.reduce(function (sum, n) { return sum + n*n; }, 0);
      if (Math.abs(norm - 1) > 0.02 || ['walk','overview'].indexOf(view.mode) === -1) return false;
      if (ortho) {
        var o=view.orthographic;
        if (view.mode!=='overview' || view.fov!==null || !keys(o,['left','right','top','bottom','zoom'])) return false;
        if (!['left','right','top','bottom'].every(function(k){return number(o[k],-1000,1000);}) || o.left>=o.right || o.bottom>=o.top || !number(o.zoom,.5,8)) return false;
      } else if (!number(view.fov,10,120)) return false;
    }
    return keys(viewport, ['width','height']) && Number.isInteger(viewport.width) && Number.isInteger(viewport.height) && number(viewport.width, 1, 10000) && number(viewport.height, 1, 10000);
  }
  function contextOf(message) {
    return { target: message.target, view: message.view, modelVersion: message.modelVersion, viewport: message.viewport };
  }
  function validPin(message) {
    return keys(message, ['type','version','requestId','target','view','modelVersion','viewport']) && message.type === 'yod:despacho:pin' &&
      (message.version === 1 && !Object.prototype.hasOwnProperty.call(message.target || {}, 'ui') || message.version === 2 && validUI(message.target && message.target.ui)) &&
      uuid(message.requestId) && validContext(contextOf(message));
  }
  function formatContext(context) {
    if (!validContext(context)) return '';
    return 'Despacho 3D | modelo=' + context.modelVersion + ' | objeto=' + context.target.id + ' | zona=' + context.target.zone + ' | tipo=' + context.target.kind +
      ' | punto=' + (context.target.point === null ? 'interfaz' : JSON.stringify(context.target.point)) + ' | camara=' + JSON.stringify(context.view.position) +
      ' | quaternion=' + JSON.stringify(context.view.quaternion) + ' | fov=' + context.view.fov + ' | modo=' + context.view.mode +
      (context.view.orthographic ? ' | ortografica=' + JSON.stringify(context.view.orthographic) : '') +
      ' | viewport=' + context.viewport.width + 'x' + context.viewport.height +
      (context.target.ui ? ' | superficie=' + context.target.ui.surface + ' | control=' + context.target.ui.path + ' | tarjeta=' + (context.target.ui.item === null ? 'general' : context.target.ui.item) : '');
  }
  function bindDespachoChinches(options) {
    if (!options || typeof options.isAuthorized !== 'function' || typeof options.getIframeWindow !== 'function') throw new TypeError('Authorization and active iframe callbacks are required');
    var generation = 0, readyWindow = null, readySession = null, seen = new Map(), composers = new Set(), disposed = false;
    function sessionEpoch() { return typeof options.getSessionEpoch === "function" ? options.getSessionEpoch() : generation; }
    function authorized(source) {
      try { return !disposed && options.isAuthorized() === true && !!source && options.getIframeWindow() === source; } catch (e) { return false; }
    }
    function post(source, payload) { try { source.postMessage(payload, CHILD_ORIGIN); } catch (e) {} }
    function ack(source, requestId, status) { post(source, { type:'yod:despacho:pin-ack', version:1, requestId:requestId, status:status }); }
    function clear() {
      if (readyWindow) post(readyWindow, { type:'yod:despacho:disabled', version:1 });
      generation++; readyWindow = null; readySession = null; seen.clear();
      composers.forEach(function (composer) { try { if (composer && typeof composer.cancel === 'function') composer.cancel(); } catch (e) {} });
      composers.clear();
    }
    async function receive(event) {
      if (disposed || event.origin !== CHILD_ORIGIN) return;
      var source = event.source;
      try { if (!source || options.getIframeWindow() !== source) return; } catch (e) { return; }
      var message = event.data;
      if (keys(message, ['type','version']) && message.type === 'yod:despacho:hello' && message.version === 1) {
        if (authorized(source)) { try { readySession = sessionEpoch(); } catch (e) { return; } readyWindow = source; post(source, { type:'yod:despacho:ready', version:1 }); }
        return;
      }
      if (!message || message.type !== 'yod:despacho:pin') return;
      if (!uuid(message.requestId)) return;
      var session; try { session = sessionEpoch(); } catch (e) { return; }
      if (!authorized(source) || readyWindow !== source || readySession !== session || !validPin(message)) { ack(source, message.requestId, 'rejected'); return; }
      var dedupeId = message.requestId.toLowerCase();
      if (seen.has(dedupeId)) { var prior = seen.get(dedupeId); if (prior) ack(source, message.requestId, prior); return; }
      if (seen.size >= MAX_REQUESTS) { ack(source, message.requestId, 'rejected'); return; }
      seen.set(dedupeId, null);
      var epoch = generation;
      function puedeGuardar() { try { return epoch === generation && sessionEpoch() === session && readyWindow === source && authorized(source); } catch (e) { return false; } }
      var chinche = root.YODChinche;
      if (!chinche || typeof chinche.anotar !== 'function') { seen.set(dedupeId, 'unavailable'); ack(source, message.requestId, 'unavailable'); return; }
      // Copy the whitelist: the composer never holds the received event object.
      var context = JSON.parse(JSON.stringify(contextOf(message))), composer;
      try {
        composer = await chinche.anotar({ clase:'despacho3d', seccion:'Despacho3D', texto:'Zona ' + context.target.zone, vista:'3D',
          objeto:{ id:context.target.id, tipo:'despacho3d', zona:context.target.zone, despacho3d:context },
          valores:{ referencia:formatContext(context) }, sinCaptura:true, sinFolio:true, sinUrlParams:true, puedeGuardar:puedeGuardar });
      } catch (e) { if (puedeGuardar()) { seen.set(dedupeId, 'unavailable'); ack(source, message.requestId, 'unavailable'); } return; }
      if (!puedeGuardar()) { try { if (composer && typeof composer.cancel === 'function') composer.cancel(); } catch (e) {} return; }
      if (!composer || typeof composer.cancel !== 'function') { seen.set(dedupeId, 'unavailable'); ack(source, message.requestId, 'unavailable'); return; }
      composers.add(composer);
      seen.set(dedupeId, 'composer_opened'); ack(source, message.requestId, 'composer_opened');
    }
    root.addEventListener('message', receive);
    return { clear:clear, dispose:function () { clear(); disposed = true; root.removeEventListener('message', receive); } };
  }
  root.YodDespachoChinches = { bindDespachoChinches:bindDespachoChinches, validPin:validPin, formatContext:formatContext };
})(window);
