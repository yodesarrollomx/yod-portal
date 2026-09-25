/* YOD Obra · registro de obras con motor.
   Cada obra es un folio de os/proyectos.js con su tipo y su motor (el /exec del GAS de obra).
   Para dar de alta una obra nueva: se copia el Sheet de obra con su script, se publica
   con «Nueva versión» y se agrega aquí un renglón. La pantalla «Alta de obra» arma el renglón.
   `cliente` es el /exec del módulo cliente (obra-app/motor/ObraCliente.gs). Vacío = aún no instalado. */
(function(root){
  'use strict';
  var OBRAS=[
    { folio:'PRJ-ALYSA', nombre:'Casa Alysa', tipo:'casa',
      motor:'https://script.google.com/macros/s/AKfycbyVb6Y7m00FyhoGa9ZoQul1j6IlHdgsCNalaZVGmA0Csh91TqxNvyDT0YQurz-hViA0/exec',
      captura:'../obra.html' }
  ];
  var CLIENTE='';
  var api={obras:OBRAS,cliente:CLIENTE,
    porFolio:function(f){f=String(f||'').toUpperCase();return OBRAS.find(function(o){return o.folio===f;})||null;}};
  root.YOD_OBRAS=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
