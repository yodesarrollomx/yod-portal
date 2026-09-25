/* ==========================================================================
   YOD OS · Las máquinas (Fase 5, 25-sep-2026) — panel verde/rojo
   Una fila por automatización: su última corrida en GitHub Actions (API
   pública, sin llaves) y hace cuánto. Verde = terminó bien; rojo = falló;
   ámbar = corriendo ahora o sin corridas. Caché de 10 min por pestaña para no
   gastar el límite anónimo de la API (60 consultas por hora).
   Solo Dirección lo ve (la sección lleva .admin-only en os/index.html).
   ========================================================================== */
(function () {
  'use strict';
  var MAQUINAS = [
    { n: 'Vigía (el único vigilante)', r: 'yodesarrollomx/yod-portal', w: 'vigia-diario.yml', cada: 'cada hora' },
    { n: 'Pruebas de YOD OS', r: 'yodesarrollomx/yod-portal', w: 'verificar.yml', cada: 'en cada cambio' },
    { n: 'Sala · Diario', r: 'yodesarrollomx/sala-edicion', w: 'sala-diario.yml', cada: '5:40 a 18 h' },
    { n: 'Sala · Cada hora', r: 'yodesarrollomx/sala-edicion', w: 'sala-cada-hora.yml', cada: 'cada hora' },
    { n: 'Sala · Publicar', r: 'yodesarrollomx/sala-edicion', w: 'publicar.yml', cada: 'en cada cambio' },
    { n: 'Métricas del embudo', r: 'yodesarrollomx/aurum-board', w: 'refresh-board.yml', cada: 'cada hora' },
    { n: 'MOAC · publicación', r: 'yodesarrollomx/board-aurum', w: 'deploy.yml', cada: 'en cada cambio' },
    { n: 'Amalaya · publicación', r: 'yodesarrollo/amalaya-board', w: 'deploy.yml', cada: 'en cada cambio' }
  ];
  var CK = 'yod_maquinas_v1', TTL = 10 * 60 * 1000;

  function edad(iso) {
    var m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (!(m >= 0)) return '';
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.floor(m / 60); if (h < 48) return 'hace ' + h + ' h';
    return 'hace ' + Math.floor(h / 24) + ' días';
  }
  function una(mq) {
    return fetch('https://api.github.com/repos/' + mq.r + '/actions/workflows/' + mq.w + '/runs?per_page=1', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var run = j && j.workflow_runs && j.workflow_runs[0];
        if (!run) return { mq: mq, color: 'ambar', txt: j ? 'sin corridas todavía' : 'no se pudo consultar' };
        var color = run.status !== 'completed' ? 'ambar' : (run.conclusion === 'success' ? 'verde' : (run.conclusion === 'skipped' || run.conclusion === 'cancelled' ? 'ambar' : 'rojo'));
        var txt = run.status !== 'completed' ? 'corriendo ahora' : (color === 'verde' ? 'bien' : ({ failure: 'falló', timed_out: 'se pasó de tiempo', action_required: 'espera aprobación' }[run.conclusion] || 'terminó en «' + run.conclusion + '»'));
        return { mq: mq, color: color, txt: txt + ' · ' + edad(run.updated_at || run.created_at), url: run.html_url };
      })
      .catch(function () { return { mq: mq, color: 'ambar', txt: 'no se pudo consultar' }; });
  }
  function pinta(filas) {
    var box = document.getElementById('maquinas-lista'); if (!box) return;
    var rojos = filas.filter(function (f) { return f.color === 'rojo'; }).length;
    var res = document.getElementById('maquinas-resumen');
    if (res) res.textContent = rojos ? rojos + (rojos === 1 ? ' máquina falló' : ' máquinas fallaron') : 'Todas las máquinas en orden';
    box.innerHTML = filas.map(function (f) {
      var nom = f.mq.n.replace(/[&<>"]/g, '');
      return '<a class="mq mq-' + f.color + '"' + (f.url ? ' href="' + f.url + '" target="_blank" rel="noopener"' : '') + '>'
        + '<span class="mq-luz" aria-hidden="true"></span><b>' + nom + '</b><span class="mq-txt">' + f.txt + '</span>'
        + '<small>' + f.mq.cada + '</small></a>';
    }).join('');
  }
  function carga(forzar) {
    try {
      var c = JSON.parse(sessionStorage.getItem(CK) || 'null');
      if (!forzar && c && Date.now() - c.t < TTL) { pinta(c.filas); return; }
    } catch (e) { }
    Promise.all(MAQUINAS.map(una)).then(function (filas) {
      try { sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), filas: filas })); } catch (e) { }
      pinta(filas);
    });
  }
  window.YodMaquinas = { carga: carga, lista: MAQUINAS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { carga(false); });
  else carga(false);
})();
