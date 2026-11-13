/* Tu palabra · 13-nov-2026 (análisis «YOD OS tablero por tablero», PLAN-04)
   Las preguntas que los asistentes le dejan a Dirección en el Buzón (pestaña Decisiones) se leen y se
   contestan aquí, en la tarjeta «Decisiones» del Inicio. Lee y escribe por el Portero, sólo Dirección:
   GET ?recurso=decisiones y POST {tipo:'decision-responder'}. Contestar pide confirmar, y el Portero
   nunca escribe encima de una respuesta que ya exista. Sin sesión de Dirección no pinta nada. */
(function () {
  'use strict';
  var ESPERA_MS = 25000;
  var estiloPuesto = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function estilo() {
    if (estiloPuesto || !document.head) return;
    estiloPuesto = true;
    var s = document.createElement('style');
    s.textContent =
      '.tu-palabra{border-top:1px solid rgba(127,127,127,.18);margin-top:12px;padding-top:12px}' +
      '.tp-titulo{margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.8}' +
      '.tp-titulo span{display:inline-block;min-width:18px;margin-left:6px;padding:0 6px;border-radius:999px;background:rgba(185,139,60,.22);text-align:center}' +
      '.tp-item{padding:10px 0;border-bottom:1px dashed rgba(127,127,127,.2)}.tp-item:last-child{border-bottom:0}' +
      '.tp-frente{margin:0 0 3px;font-size:11px;opacity:.7}.tp-pregunta{margin:0 0 8px;font-size:13px;line-height:1.45}' +
      '.tp-ops{display:flex;flex-wrap:wrap;gap:6px}.tp-ops button,.tp-confirma button{font:inherit;font-size:12px;line-height:1.3;text-align:left;' +
      'border:1px solid rgba(185,139,60,.55);background:transparent;color:inherit;border-radius:10px;padding:6px 10px;cursor:pointer;max-width:100%}' +
      '.tp-ops button em{font-style:normal;font-size:10px;padding:1px 6px;margin-left:4px;border-radius:999px;background:rgba(185,139,60,.22)}' +
      '.tp-confirma{margin-top:8px}.tp-confirma textarea{width:100%;box-sizing:border-box;min-height:64px;font:inherit;font-size:13px;' +
      'border-radius:10px;border:1px solid rgba(127,127,127,.35);padding:8px;background:transparent;color:inherit}' +
      '.tp-confirma .tp-si{background:rgba(185,139,60,.9);color:#17140F;font-weight:700}.tp-fila{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}' +
      '.tp-meta{margin:6px 0 0;font-size:11px;opacity:.65}.tp-nota{margin:0;font-size:12px;opacity:.75}.tp-ok{margin:0;font-size:12px}' +
      '.tp-error{margin:6px 0 0;font-size:12px;color:#c0504d}';
    document.head.appendChild(s);
  }
  function pedir(url, opciones) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var reloj = setTimeout(function () { if (ctrl) ctrl.abort(); }, ESPERA_MS);
    var o = Object.assign({ credentials: 'omit', cache: 'no-store' }, opciones || {});
    if (ctrl) o.signal = ctrl.signal;
    return fetch(url, o).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(reloj); return j; },
      function (e) { clearTimeout(reloj); throw e; });
  }
  var ERRORES = {
    ya_respondida: 'Ya estaba contestada en el Buzón.',
    admin: 'Sólo Dirección puede contestar.',
    clave: 'Tu sesión ya no vale: vuelve a entrar.',
    no_existe: 'Esa pregunta ya no está en el Buzón.',
    datos: 'Escribe una respuesta.',
    hoja: 'No encontré la pestaña Decisiones del Buzón.'
  };
  function item(d) {
    var rec = String(d.recomendada || '').trim();
    function op(n, texto) {
      if (!String(texto || '').trim()) return '';
      return '<button type="button" class="tp-op" data-n="' + n + '">' + n + ' · ' + esc(texto) +
        (rec === String(n) ? ' <em>recomendada</em>' : '') + '</button>';
    }
    var meta = [];
    if (d.reversible) meta.push('¿Reversible? ' + esc(d.reversible));
    if (d.si_no) meta.push('Si no contestas: ' + esc(d.si_no));
    return '<div class="tp-item" data-id="' + esc(d.id) + '">' +
      '<p class="tp-frente">' + esc(d.id) + (d.frente ? ' · ' + esc(d.frente) : '') + '</p>' +
      '<p class="tp-pregunta">' + esc(d.pregunta) + '</p>' +
      '<div class="tp-ops">' + op(1, d.opcion1) + op(2, d.opcion2) + '<button type="button" class="tp-otra">Otra respuesta</button></div>' +
      (meta.length ? '<p class="tp-meta">' + meta.join(' · ') + '</p>' : '') +
      '<div class="tp-confirma" hidden></div></div>';
  }
  function contar(caja) {
    var n = caja.querySelectorAll('.tp-item').length, t = caja.querySelector('.tp-titulo span');
    if (t) t.textContent = String(n);
    var titulo = caja.querySelector('.tp-titulo');
    if (!n && titulo) titulo.outerHTML = '<p class="tp-nota"><b>Te preguntan los asistentes:</b> ya contestaste todo.</p>';
  }
  function pintar(caja, lista, o) {
    if (!lista.length) { caja.innerHTML = '<p class="tp-nota"><b>Te preguntan los asistentes:</b> nada pendiente.</p>'; return; }
    var porId = {};
    lista.forEach(function (d) { porId[d.id] = d; });
    caja.innerHTML = '<h4 class="tp-titulo">Te preguntan los asistentes<span>' + lista.length + '</span></h4>' + lista.map(item).join('');
    caja.onclick = function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
      if (!b || !caja.contains(b)) return;
      var it = b.closest('.tp-item'), conf = it && it.querySelector('.tp-confirma'), d = it && porId[it.getAttribute('data-id')];
      if (!it || !conf || !d) return;
      if (b.classList.contains('tp-op')) {
        var n = b.getAttribute('data-n'), texto = n === '1' ? d.opcion1 : d.opcion2;
        conf.setAttribute('data-respuesta', n + ' · ' + texto);
        conf.innerHTML = '<p class="tp-nota">Vas a contestar <b>' + esc(n + ' · ' + texto) + '</b>. Queda escrito en el Buzón.</p>' +
          '<div class="tp-fila"><button type="button" class="tp-si">Sí, contestar</button><button type="button" class="tp-no">Cancelar</button></div>';
        conf.hidden = false;
      } else if (b.classList.contains('tp-otra')) {
        conf.removeAttribute('data-respuesta');
        conf.innerHTML = '<textarea maxlength="1500" placeholder="Tu respuesta, con tus palabras"></textarea>' +
          '<div class="tp-fila"><button type="button" class="tp-si">Contestar</button><button type="button" class="tp-no">Cancelar</button></div>';
        conf.hidden = false;
        var ta = conf.querySelector('textarea'); if (ta && ta.focus) ta.focus();
      } else if (b.classList.contains('tp-no')) {
        conf.hidden = true; conf.innerHTML = '';
      } else if (b.classList.contains('tp-si')) {
        var ta2 = conf.querySelector('textarea');
        var respuesta = ta2 ? String(ta2.value || '').trim() : String(conf.getAttribute('data-respuesta') || '');
        if (!respuesta) { conf.insertAdjacentHTML('beforeend', '<p class="tp-error">' + ERRORES.datos + '</p>'); return; }
        responder(caja, it, conf, d, respuesta, o, b);
      }
    };
  }
  function responder(caja, it, conf, d, respuesta, o, boton) {
    if (o.vigente && !o.vigente()) return;
    var botones = it.querySelectorAll('button');
    for (var i = 0; i < botones.length; i++) botones[i].disabled = true;
    boton.textContent = 'Guardando…';
    var viejo = conf.querySelector('.tp-error'); if (viejo) viejo.remove();
    var cuerpo = { tipo: 'decision-responder', k: o.token, id: d.id, respuesta: respuesta,
      request_id: 'tp-' + d.id + '-' + Date.now().toString(36) };
    pedir(o.portero, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(cuerpo) })
      .then(function (r) {
        if (r && r.ok) { it.outerHTML = '<p class="tp-ok">✓ ' + esc(d.id) + ' quedó contestada en el Buzón.</p>'; contar(caja); if (o.avisar) o.avisar('Quedó escrita tu respuesta a ' + d.id); return; }
        var e = r && r.error;
        if (e === 'ya_respondida') { it.outerHTML = '<p class="tp-ok">' + esc(d.id) + ': ' + ERRORES.ya_respondida + '</p>'; contar(caja); return; }
        throw new Error(ERRORES[e] || ('No se pudo guardar' + (e ? ' (' + e + ')' : '') + '.'));
      })
      .catch(function (err) {
        for (var j = 0; j < botones.length; j++) botones[j].disabled = false;
        boton.textContent = 'Reintentar';
        conf.insertAdjacentHTML('beforeend', '<p class="tp-error">' + esc(err && err.name === 'AbortError' ? 'El Portero no contestó a tiempo. Revisa el Buzón antes de reintentar: pudo haber quedado.' : (err && err.message) || 'No se pudo guardar.') + '</p>');
      });
  }
  /* o = {token, portero, vigente(), avisar(texto)} */
  function montar(o) {
    var caja = document.getElementById('tu-palabra');
    if (!caja || !o || !o.token || !o.portero || typeof fetch !== 'function') return Promise.resolve(null);
    var vigente = typeof o.vigente === 'function' ? o.vigente : function () { return true; };
    estilo();
    caja.hidden = false;
    caja.innerHTML = '<p class="tp-nota">Buscando lo que te preguntan los asistentes…</p>';
    return pedir(o.portero + '?recurso=decisiones&k=' + encodeURIComponent(o.token))
      .then(function (j) {
        if (!vigente()) return null;
        if (!j || j.ok !== true || !Array.isArray(j.decisiones)) {
          if (j && (j.error === 'admin' || j.error === 'clave')) { caja.hidden = true; caja.innerHTML = ''; return null; }
          caja.innerHTML = '<p class="tp-nota">No pude leer las preguntas del Buzón ahora.</p>';
          return null;
        }
        pintar(caja, j.decisiones, Object.assign({}, o, { vigente: vigente }));
        return j.decisiones;
      }, function () {
        if (vigente()) caja.innerHTML = '<p class="tp-nota">No pude leer las preguntas del Buzón ahora.</p>';
        return null;
      });
  }
  window.YodTuPalabra = { montar: montar, _item: item, _errores: ERRORES };
})();
