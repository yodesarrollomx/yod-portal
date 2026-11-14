/* Ficha de proyecto · 14-nov-2026 (análisis «YOD OS tablero por tablero», PLAN-06)
   Una sola ficha para todos los terrenos, con el molde de Real de Miramar: dónde va en el folio, el
   siguiente hito, quién lo trae, qué lo frena, su último movimiento, sus pendientes y su historia.
   Sólo pinta: los datos llegan ya recortados por el Portero (?recurso=historial: eventos y
   pendientes) y por la cartera. La usan el tablero cenital y Codesarrollos. Sin red ni almacenamiento. */
(function (root) {
  'use strict';
  var DIA = 864e5, QUIETO_DIAS = 14, PENDIENTES_VISIBLES = 6;
  var SIN_DUENO = /por definir|sin asignar|sin responsable|^\s*otro\b|^\s*$/i;
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var TIPOS = { reunion: 'Reunión', minuta: 'Minuta', presentacion: 'Presentación', documento: 'Documento', whatsapp: 'WhatsApp',
    decision: 'Decisión', pendiente: 'Pendiente', reunion_agendada: 'Cita', llamada: 'Llamada' };
  var estiloPuesto = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fecha(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s == null ? '' : s));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function corta(s) { var d = fecha(s); return d ? d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear() : ''; }
  function dias(desde, hoy) { return Math.round((hoy.getTime() - desde.getTime()) / DIA); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
  function deFolio(lista, folio) {
    return (lista || []).filter(function (x) { return x && Array.isArray(x.folios) && x.folios.indexOf(folio) > -1; });
  }
  function hoyDe(o) {
    var h = o && o.hoy ? new Date(o.hoy) : new Date();
    h.setHours(0, 0, 0, 0);
    return h;
  }

  /* Lo que la ficha dice arriba. El Portero ya manda los pendientes en orden (con fecha compromiso
     primero) y los eventos del más nuevo al más viejo; aquí sólo se toma el primero de cada uno. */
  function resumen(o) {
    o = o || {};
    var hoy = hoyDe(o), folio = String(o.folio || '');
    var evs = deFolio(o.eventos, folio), pend = deFolio(o.pendientes, folio);
    var r = { folio: folio, siguiente: null, freno: null, ultimo: null, abiertos: pend.length, registros: evs.length };
    if (evs.length) {
      var fu = fecha(evs[0].fecha);
      r.ultimo = { titulo: evs[0].titulo || '', fecha: evs[0].fecha || '', dias: fu ? Math.max(0, dias(fu, hoy)) : null };
    }
    if (pend.length) {
      var p = pend[0], fc = fecha(p.fecha_compromiso);
      var quien = p.responsable == null ? null : (SIN_DUENO.test(String(p.responsable)) ? '' : String(p.responsable).trim());
      var atraso = fc ? dias(fc, hoy) : 0;
      r.siguiente = { tarea: p.tarea || '', quien: quien, fecha: p.fecha_compromiso || '', vencido: atraso > 0, diasVencido: Math.max(0, atraso) };
      if (atraso > 0) r.freno = 'Vencido hace ' + plural(atraso, 'día', 'días');
      else if (quien === '') r.freno = 'Nadie lo trae';
    }
    if (!r.freno && r.ultimo && r.ultimo.dias != null && r.ultimo.dias > QUIETO_DIAS) r.freno = 'Sin movimiento hace ' + plural(r.ultimo.dias, 'día', 'días');
    if (!r.freno && !pend.length && evs.length) r.freno = 'Sin siguiente hito escrito';
    return r;
  }

  function estilo() {
    if (estiloPuesto || !root.document || !root.document.head) return;
    estiloPuesto = true;
    var s = root.document.createElement('style');
    s.textContent =
      '.fp-sub{margin:0 0 12px;font-size:12px;opacity:.72}' +
      '.fp-claves{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px}' +
      '.fp-claves div{border:1px solid rgba(154,123,63,.28);border-radius:10px;padding:8px 10px;min-width:0}' +
      '.fp-claves dt{font-size:10px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:0 0 3px}' +
      '.fp-claves dd{margin:0;font-size:13px;line-height:1.35;overflow-wrap:anywhere}' +
      '.fp-claves dd small{display:block;font-size:11px;opacity:.7;margin-top:2px}' +
      '.fp-freno{color:#a94438;font-weight:700}.fp-ok{opacity:.7}' +
      '.fp-h{margin:14px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.8}' +
      '.fp-pend{margin:0;padding:0;list-style:none}.fp-pend li{padding:6px 0;border-bottom:1px dashed rgba(127,127,127,.25);font-size:13px;line-height:1.4}' +
      '.fp-pend li:last-child{border-bottom:0}.fp-pend small{display:block;font-size:11px;opacity:.7}' +
      '.fp-ev{border-left:2px solid rgba(154,123,63,.45);padding:2px 0 12px 12px;margin-left:4px}' +
      '.fp-evf{font-size:11px;letter-spacing:.04em;opacity:.7}.fp-evt{margin:2px 0 3px;font-size:14px;font-weight:600}' +
      '.fp-evr{margin:0;font-size:13px;line-height:1.45}.fp-evd{margin:6px 0 0;font-size:12px;line-height:1.45;color:#5c4a24}' +
      '.fp-fu{display:inline-block;margin-top:4px;font-size:11px;color:#80611e}' +
      '.fp-fila{display:block;width:100%;text-align:left;font:inherit;color:inherit;background:transparent;border:0;border-top:1px solid rgba(127,127,127,.18);padding:7px 0;cursor:pointer}' +
      '.fp-fila b{display:block;font-size:12.5px}.fp-fila span{display:block;font-size:11px;line-height:1.35;opacity:.78}' +
      '.fp-fila .fp-freno{opacity:1}' +
      '@media(max-width:520px){.fp-claves{grid-template-columns:1fr}}';
    root.document.head.appendChild(s);
  }

  function claves(r) {
    var sig = r.siguiente;
    var hito = sig ? esc(sig.tarea) + (sig.fecha ? '<small>Compromiso: ' + esc(corta(sig.fecha)) + '</small>' : '') : '<span class="fp-ok">Sin siguiente hito escrito</span>';
    var trae = !sig ? '<span class="fp-ok">—</span>' : (sig.quien === null ? '<span class="fp-ok">—</span>' : (sig.quien ? esc(sig.quien) : '<span class="fp-freno">Nadie aún</span>'));
    var frena = r.freno ? '<span class="fp-freno">' + esc(r.freno) + '</span>' : '<span class="fp-ok">Nada por ahora</span>';
    var ult = r.ultimo ? esc(r.ultimo.titulo) + '<small>' + esc(corta(r.ultimo.fecha)) + (r.ultimo.dias != null ? ' · hace ' + esc(plural(r.ultimo.dias, 'día', 'días')) : '') + '</small>' : '<span class="fp-ok">Sin registros en el historial</span>';
    return '<dl class="fp-claves"><div><dt>Siguiente hito</dt><dd>' + hito + '</dd></div><div><dt>Lo trae</dt><dd>' + trae + '</dd></div>' +
      '<div><dt>Qué lo frena</dt><dd>' + frena + '</dd></div><div><dt>Último movimiento</dt><dd>' + ult + '</dd></div></dl>';
  }

  /* La ficha completa (para un panel). o = {folio, nombre, etapa, eventos, pendientes, hoy} */
  function html(o) {
    o = o || {};
    estilo();
    var r = resumen(o), folio = r.folio;
    var pend = deFolio(o.pendientes, folio), evs = deFolio(o.eventos, folio);
    var sub = [folio, o.etapa || 'Sin etapa del folio', plural(r.registros, 'registro', 'registros'), plural(r.abiertos, 'pendiente abierto', 'pendientes abiertos')];
    var out = '<h3>' + esc(o.nombre || folio) + '</h3><p class="fp-sub">' + sub.map(esc).join(' · ') + '</p>' + claves(r);
    if (pend.length) {
      out += '<h4 class="fp-h">Pendientes abiertos</h4><ul class="fp-pend">' + pend.slice(0, PENDIENTES_VISIBLES).map(function (p) {
        var info = [p.responsable && !SIN_DUENO.test(p.responsable) ? p.responsable : (p.responsable == null ? '' : 'Sin quién lo traiga'), p.fecha_compromiso ? 'compromiso ' + corta(p.fecha_compromiso) : 'sin fecha'].filter(function (x) { return x; });
        return '<li>' + esc(p.tarea) + '<small>' + esc(info.join(' · ')) + '</small></li>';
      }).join('') + '</ul>' + (pend.length > PENDIENTES_VISIBLES ? '<p class="fp-sub">y ' + esc(plural(pend.length - PENDIENTES_VISIBLES, 'pendiente más', 'pendientes más')) + '</p>' : '');
    }
    if (evs.length) {
      out += '<h4 class="fp-h">Historia</h4>' + evs.map(function (e) {
        var fuente = e.fuente_url && /^https:\/\//.test(e.fuente_url) ? '<a class="fp-fu" href="' + esc(e.fuente_url) + '" target="_blank" rel="noopener noreferrer">' + esc(e.fuente || 'Ver la fuente') + '</a>' : (e.fuente ? '<span class="fp-fu">' + esc(e.fuente) + '</span>' : '');
        return '<div class="fp-ev"><div class="fp-evf">' + esc(e.fecha) + (e.hora ? ' · ' + esc(e.hora) : '') + ' · ' + esc(TIPOS[e.tipo] || e.tipo || 'Registro') + '</div>' +
          '<p class="fp-evt">' + esc(e.titulo) + '</p>' + (e.resumen ? '<p class="fp-evr">' + esc(e.resumen) + '</p>' : '') +
          (e.decisiones ? '<p class="fp-evd"><b>Acuerdos:</b> ' + esc(e.decisiones) + '</p>' : '') + fuente + '</div>';
      }).join('');
    }
    return out;
  }

  /* Un renglón compacto (para listas por etapa) que abre la ficha. */
  function fila(o) {
    o = o || {};
    estilo();
    var r = resumen(o), sig = r.siguiente;
    var linea = sig ? 'Sigue: ' + sig.tarea + (sig.quien ? ' · ' + sig.quien : '') : 'Sin siguiente hito escrito';
    return '<button type="button" class="fp-fila" data-folio="' + esc(r.folio) + '"><b>' + esc(o.nombre || r.folio) + '</b>' +
      '<span>' + esc(linea) + '</span>' + (r.freno ? '<span class="fp-freno">' + esc(r.freno) + '</span>' : '') + '</button>';
  }

  var api = { resumen: resumen, html: html, fila: fila, _esc: esc };
  root.YodFicha = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
