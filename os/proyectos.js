/* ==========================================================================
   YOD OS · Registro de proyectos (folio único) — os/proyectos.js
   Fuente: pestaña PROYECTOS del Sheet «YOD OS · Control Maestro»
   (columna project_id = el folio). Esta es una FOTO pública, sin cifras ni
   correos: solo folio, nombre, código, tipo y etapa. Si se da de alta un
   proyecto en el Sheet, se agrega aquí (y `node verify-os.cjs` lo revisa).
   Foto tomada: 2026-09-25 (altas PRJ-CERCADA y PRJ-RUISENOR del mismo día).

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
      alias: ['Real de Miramar Guaymas', 'Real de Miramar de Guaymas', 'Miramar'], tablero: BASE + 'real-miramar-board/' },
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
    { folio: 'PRJ-CERCADA', nombre: 'La Cercada', codigo: 'CERCADA', tipo: 'Codesarrollo', etapa_actual: 'Por clasificar', etapa: '', alias: ['Cercada'] },
    { folio: 'PRJ-RUISENOR', nombre: 'Torre Ruiseñor', codigo: 'RUISENOR', tipo: 'Codesarrollo', etapa_actual: 'Por clasificar', etapa: '', alias: ['Torre Ruisenor', 'Ruiseñor'] },
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
  /* Normaliza un texto para comparar actividades (duplicados entre tableros):
     sin acentos, sin palabras vacías, palabras de 3+ letras, ordenadas. */
  var VACIAS = { del: 1, las: 1, los: 1, para: 1, con: 1, que: 1, una: 1, uno: 1, por: 1, sus: 1, the: 1 };
  function palabras(s) { return norm(s).replace(/[^a-z0-9ñ ]+/g, ' ').split(' ').filter(function (w) { return w.length > 2 && !VACIAS[w]; }); }
  function huella(s) { return palabras(s).sort().join(' '); }
  function parecidas(a, b) {
    var x = palabras(a), y = palabras(b); if (!x.length || !y.length) return false;
    var comun = x.filter(function (w) { return y.indexOf(w) > -1; }).length;
    return comun / Math.min(x.length, y.length) >= 0.8 && comun >= 2 || huella(a) === huella(b);
  }
  /* Grupos de filas {proyecto, actividad, id} que dicen casi lo mismo en el mismo folio. */
  function duplicados(filas) {
    var grupos = [], usada = {};
    (filas || []).forEach(function (f, i) {
      if (usada[i] || !palabras(f.actividad).length) return;
      var k = folio(f.proyecto) || norm(f.proyecto), g = [f];
      for (var j = i + 1; j < filas.length; j++) {
        var h = filas[j]; if (usada[j]) continue;
        if ((folio(h.proyecto) || norm(h.proyecto)) === k && parecidas(f.actividad, h.actividad)) { g.push(h); usada[j] = 1; }
      }
      if (g.length > 1) grupos.push(g);
    });
    return grupos;
  }

  /* ── Folio único · 13-nov-2026 (análisis «YOD OS tablero por tablero», etapa 1) ───────────
     La etapa de cada terreno vive en el Control Maestro (pestaña Proyectos, columna etapa_folio,
     «2 · Evaluado»). Dirección aprobó las siete etapas el 13-nov. Esta foto pública NO trae la
     cartera: la cartera se lee en vivo, con sesión, del Portero (?recurso=cartera, recortada por la
     columna «proyectos» de Accesos) o, sólo para admin, de la pestaña (?recurso=cm&hoja=Proyectos).
     Aquí sólo viven las reglas para leerla y agruparla, sin nombres ni cifras. */
  var ETAPAS_FOLIO = ['Captado', 'Evaluado', 'Acordado', 'Fondeado', 'En obra', 'En venta y cobro', 'Repartido'];
  /* «2 · Evaluado» → {n:2, nombre:'Evaluado'}; vacío o desconocido → {n:0, nombre:''}. */
  function etapaFolio(texto) {
    var m = /^\s*([1-7])\b/.exec(String(texto == null ? '' : texto));
    if (!m) return { n: 0, nombre: '' };
    var n = Number(m[1]); return { n: n, nombre: ETAPAS_FOLIO[n - 1] };
  }
  /* Filas de ?recurso=cm&hoja=Proyectos (encabezado + filas) → la misma forma que ?recurso=cartera.
     Sólo columnas sin riesgo: nada de notas, ligas, responsables ni cifras. */
  var CM_COLS = { folio: 'project_id', nombre: 'proyecto', codigo: 'código', ubicacion: 'ubicación', tipo: 'tipo',
    etapa_actual: 'etapa_actual', etapa_folio: 'etapa_folio', estado: 'estado', admision: 'admision', actualizado: 'actualizado', plan: 'plan' };
  function desdeControlMaestro(filas) {
    if (!Array.isArray(filas) || !filas.length) return [];
    var hdr = (filas[0] || []).map(function (x) { return String(x == null ? '' : x).trim(); }), idx = {};
    Object.keys(CM_COLS).forEach(function (k) { idx[k] = hdr.indexOf(CM_COLS[k]); });
    if (idx.folio < 0) return [];
    function v(r, k) { return idx[k] > -1 && r[idx[k]] != null ? String(r[idx[k]]).trim() : ''; }
    var out = [];
    filas.slice(1).forEach(function (r) {
      var folio = v(r, 'folio').toUpperCase(); if (!folio) return;
      var e = etapaFolio(v(r, 'etapa_folio'));
      out.push({ folio: folio, nombre: v(r, 'nombre'), codigo: v(r, 'codigo'), ubicacion: v(r, 'ubicacion'), tipo: v(r, 'tipo'),
        etapa_actual: v(r, 'etapa_actual'), etapa_n: e.n, etapa: e.nombre, estado: v(r, 'estado'),
        admision: v(r, 'admision').toLowerCase(), actualizado: v(r, 'actualizado'), plan: ligaPlan(v(r, 'plan')) ? v(r, 'plan') : '' });
    });
    return out;
  }
  /* Dónde vive el plan de un terreno (columna «plan» del Control Maestro, «motor:caso»).
     PPP 2 abre su ruta #/plan/<id>; los cinco motores del PPP abren ?open=<caso>.
     Cualquier otra cosa no da liga. El tablero del plan valida su propio acceso. */
  var BASE_PPP = BASE + 'potenciales-yod/';
  var MOTOR_PAG = { mixto: 'mixto.html', macrolotes: 'macrolotes.html', unifamiliar: 'unifamiliar.html', residencial: 'residencial.html', patrimonial: 'patrimonial.html' };
  function ligaPlan(plan) {
    var m = /^(ppp2|mixto|macrolotes|unifamiliar|residencial|patrimonial):([A-Za-z0-9-]{6,48})$/.exec(String(plan == null ? '' : plan).trim());
    if (!m) return '';
    if (m[1] === 'ppp2') return /^p2[a-z0-9]{6,20}$/.test(m[2]) ? BASE_PPP + 'ppp2.html#/plan/' + m[2] : '';
    return BASE_PPP + MOTOR_PAG[m[1]] + '?open=' + encodeURIComponent(m[2]);
  }
  /* Siete carriles en orden. Lo dado de baja va aparte («fuera»); lo que no tiene etapa
     (frentes de trabajo, no terrenos) no entra a la cartera. */
  function porEtapaFolio(proyectos) {
    var carriles = ETAPAS_FOLIO.map(function (nombre, i) { return { n: i + 1, nombre: nombre, proyectos: [] }; });
    var fuera = [], sinEtapa = [];
    (proyectos || []).forEach(function (p) {
      if (!p || !p.folio) return;
      if (String(p.admision || '').toLowerCase() === 'baja') { fuera.push(p); return; }
      var n = Number(p.etapa_n) || etapaFolio(p.etapa_folio || '').n;
      if (n >= 1 && n <= 7) carriles[n - 1].proyectos.push(p); else sinEtapa.push(p);
    });
    return { carriles: carriles, fuera: fuera, sinEtapa: sinEtapa };
  }

  var api = { lista: PROYECTOS, etapas: ETAPAS, buscar: buscar, folio: folio, auditar: auditar, porEtapa: porEtapa, huella: huella, parecidas: parecidas, duplicados: duplicados,
    etapasFolio: ETAPAS_FOLIO, etapaFolio: etapaFolio, desdeControlMaestro: desdeControlMaestro, porEtapaFolio: porEtapaFolio, ligaPlan: ligaPlan };
  root.YodProyectos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
