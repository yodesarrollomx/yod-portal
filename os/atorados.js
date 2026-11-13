/* Atorados · 13-nov-2026 (análisis «YOD OS tablero por tablero», PLAN-04)
   En la tarjeta «Decisiones» del Inicio, debajo de «Tu palabra»: lo que lleva días sin moverse, de
   personas y de asistentes, en una sola lista y con sus días. Sólo Dirección.
     · Asistentes: el Portero lee el Buzón (?recurso=atorados): tareas tomadas sin latido de 24 h o más,
       bloqueadas y frentes del Mando en «Atorado».
     · Personas: las tareas abiertas de MOAC que ya vencieron (las mismas que pinta Operación semanal).
   Sólo lectura: no cambia nada en ningún lado. Si el Portero no contesta, sigue con las de personas. */
(function () {
  'use strict';
  var ESPERA_MS = 25000, VISIBLES = 6;
  var estiloPuesto = false;
  var estado = { agentes: null, agentesError: false, personas: null, abierto: false, o: null };

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
      '.atorados{border-top:1px solid rgba(127,127,127,.18);margin-top:12px;padding-top:12px}' +
      '.at-titulo{margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.8}' +
      '.at-titulo span{display:inline-block;min-width:18px;margin-left:6px;padding:0 6px;border-radius:999px;background:rgba(192,80,77,.2);text-align:center}' +
      '.at-item{display:flex;gap:10px;align-items:baseline;padding:7px 0;border-bottom:1px dashed rgba(127,127,127,.2)}.at-item:last-child{border-bottom:0}' +
      '.at-dias{flex:0 0 auto;min-width:64px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:#c0504d}' +
      '.at-dias.at-sin{color:inherit;opacity:.6;font-weight:400}' +
      '.at-que{margin:0;font-size:13px;line-height:1.4}.at-quien{margin:2px 0 0;font-size:11px;opacity:.7}' +
      '.at-mas{font:inherit;font-size:12px;border:0;background:transparent;color:inherit;opacity:.8;padding:6px 0;cursor:pointer;text-decoration:underline}' +
      '.at-nota{margin:0;font-size:12px;opacity:.75}';
    document.head.appendChild(s);
  }
  function pedir(url) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var reloj = setTimeout(function () { if (ctrl) ctrl.abort(); }, ESPERA_MS);
    var o = { credentials: 'omit', cache: 'no-store' };
    if (ctrl) o.signal = ctrl.signal;
    return fetch(url, o).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(reloj); return j; },
      function (e) { clearTimeout(reloj); throw e; });
  }

  /* Junta las dos listas. ops = YodOperations (para leer la fecha y el estado de MOAC igual que Operación). */
  function juntar(agentes, personas, ops) {
    var lista = [];
    (agentes || []).forEach(function (a) {
      if (!a) return;
      lista.push({ tipo: 'agente', dias: typeof a.dias === 'number' ? a.dias : null, que: a.que || a.id || 'Sin título',
        quien: a.quien || 'Sin conductor', donde: a.origen === 'Mando' ? 'Mando' : 'Buzón · ' + (a.id || ''),
        etiqueta: a.origen === 'Mando' ? 'sin moverse' : (/^bloquead/i.test(a.estado || '') ? 'bloqueada' : 'sin latido') });
    });
    if (ops && typeof ops.daysUntil === 'function') {
      (personas || []).forEach(function (t) {
        if (!t || t.archivada === true || String(t.archivada).toLowerCase() === 'true' || t.borrada === true) return;
        if (typeof ops.normalizeStatus === 'function' && ops.normalizeStatus(t.estado) === 'Terminado') return;
        var d = ops.daysUntil(t);
        if (d == null || d >= 0) return;
        lista.push({ tipo: 'persona', dias: -d, que: t.actividad || t.entregable || 'Tarea sin título',
          quien: t.responsable || 'Sin responsable', donde: 'MOAC · ' + (t.proyecto || t.empresa || 'Sin proyecto'), etiqueta: 'vencida' });
      });
    }
    lista.sort(function (a, b) { return (b.dias == null ? -1 : b.dias) - (a.dias == null ? -1 : a.dias); });
    return lista;
  }

  function item(x) {
    var dias = x.dias == null ? '<span class="at-dias at-sin">sin fecha</span>'
      : '<span class="at-dias">' + x.dias + ' d ' + esc(x.etiqueta) + '</span>';
    return '<div class="at-item">' + dias + '<div><p class="at-que">' + esc(x.que) + '</p>' +
      '<p class="at-quien">' + esc(x.quien) + ' · ' + esc(x.donde) + (x.tipo === 'agente' ? ' · asistente' : ' · persona') + '</p></div></div>';
  }
  function pintar() {
    var caja = document.getElementById('atorados');
    if (!caja || !estado.o) return;
    if (estado.agentes == null && !estado.agentesError && estado.personas == null) {
      caja.innerHTML = '<p class="at-nota">Buscando lo atorado…</p>';
      return;
    }
    var lista = juntar(estado.agentes, estado.personas, window.YodOperations);
    var nota = estado.agentesError ? '<p class="at-nota">No pude leer los de los asistentes ahora; estos son los de personas.</p>' : '';
    if (!lista.length) { caja.innerHTML = '<p class="at-nota"><b>Atorados:</b> nada lleva días sin moverse.</p>' + nota; return; }
    var ver = estado.abierto ? lista : lista.slice(0, VISIBLES);
    caja.innerHTML = '<h4 class="at-titulo">Atorados<span>' + lista.length + '</span></h4>' + ver.map(item).join('') +
      (lista.length > VISIBLES ? '<button type="button" class="at-mas">' + (estado.abierto ? 'Ver menos' : 'Ver los ' + lista.length) + '</button>' : '') + nota;
    var mas = caja.querySelector('.at-mas');
    if (mas) mas.onclick = function () { estado.abierto = !estado.abierto; pintar(); };
  }
  function montar(o) {
    var caja = document.getElementById('atorados');
    if (!caja || !o || !o.token || !o.portero || typeof fetch !== 'function') return Promise.resolve(null);
    var vigente = typeof o.vigente === 'function' ? o.vigente : function () { return true; };
    estilo();
    estado = { agentes: null, agentesError: false, personas: !estado.o || estado.o.token === o.token ? estado.personas : null, abierto: false, o: o };
    caja.hidden = false;
    pintar();
    return pedir(o.portero + '?recurso=atorados&k=' + encodeURIComponent(o.token))
      .then(function (j) {
        if (!vigente() || estado.o !== o) return null;
        if (j && (j.error === 'admin' || j.error === 'clave')) { caja.hidden = true; caja.innerHTML = ''; estado.o = null; return null; }
        if (j && j.ok === true && Array.isArray(j.atorados)) estado.agentes = j.atorados; else estado.agentesError = true;
        pintar();
        return estado.agentes;
      }, function () {
        if (!vigente() || estado.o !== o) return null;
        estado.agentesError = true; pintar(); return null;
      });
  }
  function personas(tareas) {
    estado.personas = Array.isArray(tareas) ? tareas : [];
    pintar();
  }
  window.YodAtorados = { montar: montar, personas: personas, _juntar: juntar };
})();
