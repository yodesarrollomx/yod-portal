/* ==========================================================================
   YOD OS · Las máquinas (Fase 5, 25-sep-2026) — panel verde/rojo
   Una fila por automatización: su última corrida en GitHub Actions (API
   pública, sin llaves) y hace cuánto. Verde = terminó bien; rojo = falló;
   ámbar = corriendo, atrasada o sin evidencia. Caché de 10 min por pestaña para no
   gastar el límite anónimo de la API (60 consultas por hora).
   Solo Dirección lo ve (la sección lleva .admin-only en os/index.html).
   ========================================================================== */
(function () {
  'use strict';
  var MAQUINAS = [
    { n: 'Vigía (el único vigilante)', r: 'yodesarrollomx/yod-portal', w: 'vigia-diario.yml', cada: 'cada hora', maxHoras: 3 },
    { n: 'Pruebas de YOD OS', r: 'yodesarrollomx/yod-portal', w: 'verificar.yml', cada: 'en cada cambio' },
    { n: 'Sala · Diario', r: 'yodesarrollomx/sala-edicion', w: 'sala-diario.yml', cada: '5:40 a 18 h', maxHoras: 26 },
    { n: 'Sala · Cada hora', r: 'yodesarrollomx/sala-edicion', w: 'sala-cada-hora.yml', cada: 'cada hora', maxHoras: 3 },
    { n: 'Sala · Publicar', r: 'yodesarrollomx/sala-edicion', w: 'publicar.yml', cada: 'en cada cambio' },
    { n: 'Métricas del embudo', r: 'yodesarrollomx/aurum-board', w: 'refresh-board.yml', cada: 'cada hora', maxHoras: 4 },
    { n: 'MOAC · publicación', r: 'yodesarrollomx/board-aurum', w: 'deploy.yml', cada: 'en cada cambio' },
    { n: 'Amalaya · publicación', r: 'yodesarrollo/amalaya-board', w: 'deploy.yml', cada: 'en cada cambio' }
  ];
  var CK = 'yod_maquinas_v2', TTL = 10 * 60 * 1000;

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function enlace(run, mq) {
    var base = 'https://github.com/' + mq.r + '/actions/runs/';
    var url = String(run.html_url || '');
    return url.indexOf(base) === 0 && /^\d+$/.test(url.slice(base.length)) ? url : '';
  }

  function edad(iso) {
    var m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (!(m >= 0)) return '';
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.floor(m / 60); if (h < 48) return 'hace ' + h + ' h';
    return 'hace ' + Math.floor(h / 24) + ' días';
  }
  async function una(mq) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;
    try {
      var r = await fetch('https://api.github.com/repos/' + mq.r + '/actions/workflows/' + mq.w + '/runs?per_page=1', { cache: 'no-store', signal: controller ? controller.signal : undefined });
      if (!r.ok) return { mq: mq, color: 'ambar', txt: r.status === 404 ? 'no disponible o sin acceso' : 'no se pudo consultar' };
      var j = await r.json();
      if (!j || !Array.isArray(j.workflow_runs)) return { mq: mq, color: 'ambar', txt: 'respuesta incompleta' };
      var run = j.workflow_runs[0];
      if (!run) return { mq: mq, color: 'ambar', txt: 'sin corridas todavía' };
      var when = run.updated_at || run.created_at;
      var age = Date.now() - new Date(when).getTime();
      var color = 'ambar', txt;
      if (run.status !== 'completed') {
        txt = run.status === 'in_progress' ? 'corriendo ahora' : 'pendiente de completar';
      } else if (run.conclusion === 'success') {
        // El resultado de una ejecución no demuestra la frescura del dato de negocio.
        if (!Number.isFinite(age) || age < 0) txt = 'ejecución correcta, fecha sin verificar';
        else if (mq.maxHoras && age > mq.maxHoras * 3600000) txt = 'última ejecución correcta, revisión por atraso';
        else { color = 'verde'; txt = 'última ejecución correcta'; }
      } else {
        color = ['failure', 'timed_out', 'startup_failure'].includes(run.conclusion) ? 'rojo' : 'ambar';
        txt = { failure: 'falló', timed_out: 'se pasó de tiempo', startup_failure: 'no pudo iniciar', action_required: 'espera aprobación', skipped: 'omitida', cancelled: 'cancelada' }[run.conclusion] || 'resultado sin verificar';
      }
      return { mq: mq, color: color, txt: txt + (edad(when) ? ' · ' + edad(when) : ''), url: enlace(run, mq) };
    } catch (e) {
      return { mq: mq, color: 'ambar', txt: 'no se pudo consultar' };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  function pinta(filas) {
    var box = document.getElementById('maquinas-lista'); if (!box) return;
    var rojos = filas.filter(function (f) { return f.color === 'rojo'; }).length;
    var pendientes = filas.filter(function (f) { return f.color !== 'verde' && f.color !== 'rojo'; }).length;
    var res = document.getElementById('maquinas-resumen');
    var partes = [];
    if (rojos) partes.push(rojos + (rojos === 1 ? ' máquina falló' : ' máquinas fallaron'));
    if (pendientes) partes.push(pendientes + (pendientes === 1 ? ' máquina por verificar' : ' máquinas por verificar'));
    if (res) res.textContent = partes.length ? partes.join(' · ') : (filas.length ? 'Últimas ejecuciones correctas' : 'Sin ejecuciones verificadas');
    box.innerHTML = filas.map(function (f) {
      var url = enlace({ html_url: f.url }, f.mq);
      var color = ['verde', 'rojo'].includes(f.color) ? f.color : 'ambar';
      return '<a class="mq mq-' + color + '"' + (url ? ' href="' + escape(url) + '" target="_blank" rel="noopener"' : '') + '>'
        + '<span class="mq-luz" aria-hidden="true"></span><b>' + escape(f.mq.n) + '</b><span class="mq-txt">' + escape(f.txt) + '</span>'
        + '<small>' + escape(f.mq.cada) + '</small></a>';
    }).join('');
  }
  function carga(forzar) {
    try {
      var c = JSON.parse(sessionStorage.getItem(CK) || 'null');
      if (!forzar && c && Number.isFinite(c.t) && Date.now() >= c.t && Date.now() - c.t < TTL &&
          Array.isArray(c.filas) && c.filas.length === MAQUINAS.length &&
          c.filas.every(function (f, i) { return f && f.mq && f.mq.r === MAQUINAS[i].r && f.mq.w === MAQUINAS[i].w; })) {
        pinta(c.filas); return Promise.resolve();
      }
    } catch (e) { }
    return Promise.all(MAQUINAS.map(una)).then(function (filas) {
      try { sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), filas: filas })); } catch (e) { }
      pinta(filas);
    });
  }
  window.YodMaquinas = { carga: carga, lista: MAQUINAS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { carga(false); });
  else carga(false);
})();
