/* ==========================================================================
   YOD OS · Catálogo de tableros — os/catalogo.js (SH-2, 25-sep-2026)
   LA fuente única de cada tablero: id, nombre de respaldo, ícono, códigos de
   acceso y destino. De aquí se GENERAN las copias que viven en os/shell.js
   (DEST, ICON, NAME, CODES), os/access-policy.js (SYSTEM_CODES) y os/app.js
   (ICONS):   node scripts/catalogo.cjs        (escribe las copias)
              node scripts/catalogo.cjs --check (lo corre verify-os: falla si
              alguien editó una copia a mano).
   Los nombres que se ven los manda la pestaña Portal del Control Maestro; los
   de aquí son el respaldo si el Sheet no contesta. sinMarco = no es tablero con
   marco (el Sheet de Control Maestro).
   ========================================================================== */
(function (r) {
  'use strict';
  var CATALOGO = [
    { id: "SYS-DESPACHO", nombre: "El Despacho", icono: "layout-grid", codigos: ["DP"], destino: "https://yodesarrollomx.github.io/yod-despacho/" },
    { id: "SYS-POTENCIALES", nombre: "PPP", icono: "map-2", codigos: ["PT","MP","MA","MX","UN","RE","PA"], destino: "https://yodesarrollomx.github.io/potenciales-yod/" },
    { id: "SYS-TRACK", nombre: "Codesarrollos", icono: "route", codigos: ["CO","TC"], destino: "https://yodesarrollomx.github.io/yod-portal/track-codesarrollos.html" },
    { id: "SYS-MIRAMAR", nombre: "Real de Miramar", icono: "building-community", codigos: ["RM"], destino: "https://yodesarrollomx.github.io/real-miramar-board/" },
    { id: "SYS-TAREAS", nombre: "MOAC", icono: "checklist", codigos: ["TA"], destino: "https://yodesarrollomx.github.io/board-aurum/" },
    { id: "SYS-FLUJO", nombre: "Flujo", icono: "wallet", codigos: ["FL"], destino: "https://yodesarrollomx.github.io/board-flujo-yod/" },
    { id: "SYS-INTERIORES", nombre: "AURUM", icono: "armchair-2", codigos: ["IN"], destino: "https://yodesarrollomx.github.io/interiores-aurum/" },
    { id: "SYS-INVERSION", nombre: "Codesarrolladores", icono: "presentation-analytics", codigos: ["IV"], destino: "https://yodesarrollomx.github.io/yodesarrollo-board/" },
    { id: "SYS-MARKETING", nombre: "Embudo comercial", icono: "speakerphone", codigos: ["MK"], destino: "https://yodesarrollomx.github.io/aurum-board/" },
    { id: "SYS-OBRA", nombre: "Obra en vivo", icono: "building-skyscraper", codigos: ["OB"], destino: "https://yodesarrollomx.github.io/yod-portal/obra.html" },
    { id: "SYS-CONTROL", nombre: "", icono: "", codigos: ["AC"], destino: "https://docs.google.com/spreadsheets/d/1E_89GQBnOmwv5Nej2B-QEkAdVnFYQbBVQUffHWwI7Vk/", sinMarco: true }
  ];
  r.YodCatalogo = CATALOGO;
  if (typeof module !== 'undefined' && module.exports) module.exports = CATALOGO;
})(typeof window !== 'undefined' ? window : globalThis);
