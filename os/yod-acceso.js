/* ==========================================================================
   YOD OS · Dónde vive el Portero — os/yod-acceso.js (25-sep-2026)
   LA ÚNICA copia de la dirección del Portero en el código de los tableros.
   Antes estaba escrita 22 veces en 10 repos: un cambio de implementación
   obligaba a cazarlas todas. Cada página la carga en su <head>, antes que su
   propio código; portero.js y shell.js, que viajan a tableros de otros repos,
   la piden solos si la página no la trae (YOD_PORTERO_LISTO).
   Regla: al publicar el Portero SIEMPRE «Versión nueva» sobre la implementación
   existente (la dirección no cambia). Si alguna vez cambia, se cambia AQUÍ.
   (Los .gs del lado de Google guardan su propia copia: corren en otro lado.)
   ========================================================================== */
(function (r) {
  'use strict';
  r.YOD_PORTERO = r.YOD_PORTERO || {
    original: 'https://script.google.com/macros/s/AKfycbwlDDCWWzOWYZsUpBU9uqsQ7aenQ469PF6s6FkNlBFS1_cJSU5njG9oQmuyELy5zlqzFg/exec',
    respaldo: 'https://script.google.com/macros/s/AKfycbyrhqMb70Qh8BljAOYnSYBZ8IXUuEclFWPg10NWIv3GJ-nAR597OTsGB4IL-xyUl7Ms/exec'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = r.YOD_PORTERO;
})(typeof window !== 'undefined' ? window : globalThis);
