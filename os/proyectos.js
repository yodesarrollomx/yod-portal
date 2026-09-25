/* ==========================================================================
   YOD OS · Registro de proyectos (folio único) — os/proyectos.js
   Fuente: pestaña PROYECTOS del Sheet «YOD OS · Control Maestro»
   (columna project_id = el folio). Esta es una FOTO pública, sin cifras ni
   correos: solo folio, nombre, código, tipo y etapa. Si se da de alta un
   proyecto en el Sheet, se agrega aquí (y `node verify-os.cjs` lo revisa).
   Foto tomada: 2026-09-25.

   `alias`: cómo aparece escrito el proyecto en los otros Sheets (el board de
   tareas dice «Real de Miramar Guaymas», con espacios de más, etc.). Así un
   tablero reconoce el folio aunque el texto venga distinto — y se ve qué
   nombres están duplicados.
   `etapa`: la etapa del embudo del tablero cenital, derivada de etapa_actual:
   Potencial → Trámite → Obra → Venta (los frentes operativos no cuentan).
   ========================================================================== */
(function (root) {
  'use strict';
  var BASE = 'https://yodesarrollomx.github.io/';
  var PROYECTOS = [
    { folio: 'PRJ-RM', nombre: 'Real de Miramar', codigo: 'RM', tipo: 'Codesarrollo', etapa_actual: 'Preventa I', etapa: 'Venta',
      alias: ['Real de Miramar Guaymas', 'Miramar'], tablero: BASE + 'real-miramar-board/' },
    { folio: 'PRJ-ALYSA', nombre: 'Casa Alysa', codigo: 'ALYSA', tipo: 'Codesarrollo', etapa_actual: 'Obra y comercialización', etapa: 'Obra',
      alias: ['Alysa'], tablero: BASE + 'yod-portal/track-alysa.html' },
    { folio: 'PRJ-MARIA', nombre: 'Casa María', codigo: 'MARIA', tipo: 'Codesarrollo', etapa_actual: 'Arranque', etapa: 'Potencial',
      alias: ['Casa Maria', 'María'], tablero: BASE + 'yod-portal/track-maria.html' },
    { folio: 'PRJ-ADMIN', nombre: 'Admin', codigo: 'ADMIN', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: ['Administración'] },
    { folio: 'PRJ-AYUDA-SOCIAL', nombre: 'Ayuda Social', codigo: 'AYUDA-SOCIAL', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: [] },
    { folio: 'PRJ-CONTRATOS', nombre: 'Contratos', codigo: 'CONTRATOS', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: [] },
    { folio: 'PRJ-NUEVOS-CLIENTES', nombre: 'Nuevos Clientes', codigo: 'NUEVOS-CLIENTES', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: [] },
    { folio: 'PRJ-PAGINA-WEB', nombre: 'Página Web', codigo: 'PAGINA-WEB', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: ['Pagina Web'] },
    { folio: 'PRJ-PROMOTORA', nombre: 'Promotora', codigo: 'PROMOTORA', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: [] },
    { folio: 'PRJ-RNM', nombre: 'RNM', codigo: 'RNM', tipo: 'Frente operativo', etapa_actual: 'Por clasificar', etapa: '', alias: ['Residencia Navarro Muñoz'] }
  ];
  var ETAPAS = ['Potencial', 'Trámite', 'Obra', 'Venta'];

  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  var INDICE = {};
  PROYECTOS.forEach(function (p) {
    [p.nombre, p.codigo, p.folio].concat(p.alias || []).forEach(function (n) { INDICE[norm(n)] = p; });
  });
  /* El proyecto oficial que corresponde a un texto libre, o null. */
  function buscar(texto) { return INDICE[norm(texto)] || null; }
  function folio(texto) { var p = buscar(texto); return p ? p.folio : ''; }
  /* Nombres de un Sheet que NO tienen folio (candidatos a alta) y los que
     SÍ lo tienen pero escritos distinto al nombre oficial (duplicados). */
  function auditar(nombres) {
    var sinFolio = {}, distintos = {};
    (nombres || []).forEach(function (n) {
      var t = String(n == null ? '' : n); if (!t.trim()) return;
      var p = buscar(t);
      if (!p) sinFolio[t.trim()] = 1;
      else if (t !== p.nombre) (distintos[p.folio] = distintos[p.folio] || {})[t] = 1;
    });
    return { sinFolio: Object.keys(sinFolio), distintos: Object.keys(distintos).map(function (f) { return { folio: f, escritos: Object.keys(distintos[f]) }; }) };
  }
  function porEtapa() {
    var o = {}; ETAPAS.forEach(function (e) { o[e] = []; });
    PROYECTOS.forEach(function (p) { if (p.etapa && o[p.etapa]) o[p.etapa].push(p); });
    return o;
  }
  /* Normaliza un texto para comparar actividades (duplicados entre tableros). */
  function huella(s) { return norm(s).replace(/[^a-z0-9ñ ]+/g, ' ').split(' ').filter(function (w) { return w.length > 2; }).sort().join(' '); }
  /* Grupos de filas {proyecto, actividad, id, tablero} que dicen lo mismo en el mismo folio. */
  function duplicados(filas) {
    var g = {};
    (filas || []).forEach(function (f) {
      var k = (folio(f.proyecto) || norm(f.proyecto)) + '|' + huella(f.actividad);
      if (!huella(f.actividad)) return;
      (g[k] = g[k] || []).push(f);
    });
    return Object.keys(g).filter(function (k) { return g[k].length > 1; }).map(function (k) { return g[k]; });
  }

  var api = { lista: PROYECTOS, etapas: ETAPAS, buscar: buscar, folio: folio, auditar: auditar, porEtapa: porEtapa, huella: huella, duplicados: duplicados };
  root.YodProyectos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
