// Datos del círculo: validación y ejemplo sintético.
// El repositorio es público: aquí no hay datos reales de ningún terreno ni cliente.
// El nombre del caso llega siempre del perfil que autoriza el servidor.
export const CATEGORIAS={aprobar:'Aprobar',decidir:'Decidir',cifras:'Cifras',datos:'Datos',borrador:'Borrador'};
export const TONOS=['ok','warn','crit','info'];
const MAX_TEXTO=600,MAX_LISTA=50;
const texto=(v,max=MAX_TEXTO)=>{
 if(typeof v!=='string'||!v.trim()||v.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v))throw Error('circulo_datos_invalidos');
 return v.trim();
};
const lista=(v,fn)=>{
 if(!Array.isArray(v)||v.length>MAX_LISTA)throw Error('circulo_datos_invalidos');
 return v.map(fn);
};
const tono=v=>{if(!TONOS.includes(v))throw Error('circulo_datos_invalidos');return v;};
const filas=v=>lista(v,f=>{if(!Array.isArray(f)||f.length<2||f.length>3)throw Error('circulo_datos_invalidos');return [texto(f[0],80),texto(f[1]),f[2]===undefined||f[2]===''?'':tono(f[2])];});
const version=v=>{
 if(v===null||v===undefined)return null;
 if(typeof v!=='object'||Array.isArray(v))throw Error('circulo_datos_invalidos');
 return {titulo:texto(v.titulo,120),filas:filas(v.filas)};
};
export function validarDatos(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('circulo_datos_invalidos');
 const ppp=input.ppp;
 if(!ppp||typeof ppp!=='object'||Array.isArray(ppp))throw Error('circulo_datos_invalidos');
 return {
  ejemplo:input.ejemplo===true,
  pendientes:lista(input.pendientes,p=>{
   if(!p||typeof p!=='object'||!Object.hasOwn(CATEGORIAS,p.categoria)||!['dir','otros'].includes(p.con))throw Error('circulo_datos_invalidos');
   return {titulo:texto(p.titulo,160),detalle:texto(p.detalle),categoria:p.categoria,con:p.con,de:texto(p.de,120),origen:texto(p.origen,120)};
  }),
  ppp:{vigente:version(ppp.vigente),borrador:version(ppp.borrador),nota:texto(ppp.nota)},
  historial:lista(input.historial,h=>{if(!Array.isArray(h)||h.length!==2)throw Error('circulo_datos_invalidos');return [texto(h[0],60),texto(h[1])];}),
  moac:lista(input.moac,m=>{if(!Array.isArray(m)||m.length!==3)throw Error('circulo_datos_invalidos');return [texto(m[0],200),texto(m[1],40),tono(m[2])];}),
  documentos:lista(input.documentos,d=>{if(!Array.isArray(d)||d.length!==4)throw Error('circulo_datos_invalidos');return [texto(d[0],160),texto(d[1],60),tono(d[2]),texto(d[3])];}),
  conversaciones:lista(input.conversaciones,c=>{
   if(!c||typeof c!=='object')throw Error('circulo_datos_invalidos');
   return {nombre:texto(c.nombre,80),detalle:texto(c.detalle,120),mensajes:lista(c.mensajes,m=>{if(!Array.isArray(m)||m.length!==3||!['yo','otro'].includes(m[0]))throw Error('circulo_datos_invalidos');return [m[0],texto(m[1]),m[2]===''?'':texto(m[2],20)];})};
  })
 };
}
// Ejemplo sintético. No describe ningún terreno real.
export function datosDeEjemplo(){
 return validarDatos({
  ejemplo:true,
  pendientes:[
   {titulo:'Aprobar la versión 2 del tablero PPP',detalle:'Propuesta de ejemplo para mostrar cómo llega un cambio a Dirección.',categoria:'aprobar',con:'dir',de:'Caso → Dirección',origen:'Tablero PPP'},
   {titulo:'Confirmar quién decide sobre el predio',detalle:'Ejemplo de decisión que espera respuesta.',categoria:'decidir',con:'dir',de:'Caso → Dirección',origen:'Expediente'},
   {titulo:'Completar los datos catastrales',detalle:'Ejemplo de dato que falta y lo tiene otro integrante.',categoria:'datos',con:'otros',de:'Caso → Equipo',origen:'Conversación'},
   {titulo:'Revisar una cifra de partida',detalle:'Ejemplo de cifra marcada como hipótesis hasta comprobarla.',categoria:'cifras',con:'otros',de:'Jev → Caso',origen:'Registro de Potenciales'},
   {titulo:'Borrador de aviso para la sala de juntas',detalle:'Ejemplo: primero borrador, nada sale sin visto bueno.',categoria:'borrador',con:'dir',de:'Caso → Dirección',origen:'Centro de comunicación'}
  ],
  ppp:{
   vigente:{titulo:'Vigente · última aprobada por Dirección',filas:[['Estado','Exploración'],['Predio','Por identificar','warn'],['Propietario','Por confirmar','warn'],['Cifras de partida','Hipótesis','warn']]},
   borrador:{titulo:'Mi borrador · propuesta',filas:[['Cambio','Separar la venta por lote y por conjunto','warn'],['Datos nuevos','Ninguno','ok']]},
   nota:'Solo Dirección aprueba. Estos botones se activan cuando el registro de aprobaciones esté conectado a Sheets.'
  },
  historial:[['Primer registro','El caso se registra en el expediente.'],['Memoria','Se comprueba que recuerda entre procesos.'],['Respuesta en vivo','Primera respuesta desde el servicio permanente.'],['Pendientes','Los pendientes empiezan a clasificarse en tarjetas.']],
  moac:[['Identificar el predio y sus datos catastrales','Pendiente','warn'],['Confirmar propietario','Pendiente','warn'],['Ordenar evidencia de geometría y situación legal','Pendiente','warn'],['Recuperar el intercambio por su ID','Hecho','ok'],['Sustentar normativa, accesos y costos','En espera','info']],
  documentos:[['Núcleo, memoria y acuerdos','Vigente','ok','Instantánea autorizada.'],['Plano de subdivisión','Recibido, no validado','warn','Estar recibido no acredita una subdivisión aprobada.'],['Encargo MOAC','Registrado','ok','Versión vigente.'],['Modelo PPP','Referencia','info','Versiones registradas.']],
  conversaciones:[
   {nombre:'Dirección',detalle:'Conversación principal',mensajes:[['yo','Confirma quién eres y qué expediente tienes precargado.','ejemplo'],['otro','Soy el caso de este expediente. Registrado no significa verificado.','ejemplo']]},
   {nombre:'WhatsApp',detalle:'Número de prueba',mensajes:[['otro','Sin mensajes. Las pruebas salen solo a tu número y con tu confirmación.','']]},
   {nombre:'Sala de juntas',detalle:'Entregas y aprobaciones',mensajes:[['otro','Cuando haya algo para aprobar, aviso y lo presento aquí.','']]}
  ]
 });
}
