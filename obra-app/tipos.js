/* YOD Obra · plantillas por tipo de obra.
   Todas las obras usan la misma estructura: Proyecto (folio PRJ) → Unidad → Partida → Avance.
   El tipo solo cambia cómo se llama la unidad y qué partidas trae de arranque.
   En el Sheet de obra, la UNIDAD va en la columna «frente» de CONCEPTOS y la PARTIDA
   en la descripción del concepto, así el motor de obra actual sirve sin cambios. */
(function(root){
  'use strict';
  var T={
    casa:{nombre:'Casa / residencia',unidad:'Casa',unidades:'Casas',ejemplo:'Casa',
      partidas:['Preliminares','Cimentación','Estructura','Muros','Instalaciones','Acabados','Exteriores'],
      cliente:'Su casa: avance, fotos, pagos y documentos'},
    remodelacion:{nombre:'Remodelación',unidad:'Espacio',unidades:'Espacios',ejemplo:'Cocina',
      partidas:['Demolición','Instalaciones','Albañilería','Carpintería','Acabados','Limpieza'],
      cliente:'Su espacio: fotos antes y después, pagos'},
    serie:{nombre:'Vivienda en serie',unidad:'Casa',unidades:'Casas',ejemplo:'C07',
      partidas:['Cimentación','Muros','Losa','Instalaciones','Acabados','Entrega'],
      cliente:'Su casa dentro del fraccionamiento'},
    departamentos:{nombre:'Departamentos / torre',unidad:'Depto',unidades:'Deptos',ejemplo:'D-302',
      partidas:['Estructura por nivel','Muros','Instalaciones','Acabados','Áreas comunes'],
      cliente:'Su depto y el avance de la torre'},
    comercial:{nombre:'Local / espacio comercial',unidad:'Local',unidades:'Locales',ejemplo:'L-04',
      partidas:['Obra gris','Fachada','Instalaciones','Acondicionamiento','Imagen'],
      cliente:'El inquilino ve su local y su fecha de entrega'},
    lotificacion:{nombre:'Lotificación',unidad:'Lote',unidades:'Lotes',ejemplo:'M3-L12',
      partidas:['Trazo','Terracerías','Agua potable','Drenaje','Electrificación','Pavimento'],
      cliente:'Su lote y la urbanización de su manzana'},
    urbano:{nombre:'Desarrollo urbano',unidad:'Frente',unidades:'Frentes',ejemplo:'PAV',
      partidas:['Terracerías','Guarniciones','Pavimento','Agua potable','Drenaje','Alumbrado'],
      cliente:'Inversionista o municipio: frentes y dinero'},
    otra:{nombre:'Otra obra',unidad:'Frente',unidades:'Frentes',ejemplo:'A',
      partidas:[],cliente:'Lo que se active'}
  };
  function tipo(k){return T[k]||T.otra;}
  var api={tipos:T,tipo:tipo,claves:Object.keys(T)};
  root.YOD_OBRA_TIPOS=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
