/**
 * YOD Obra · Módulo cliente (pagos, documentos, dudas, fotos, gastos)
 *
 * Es un Apps Script APARTE, pegado en un Sheet nuevo «YOD Obra · Cliente».
 * NO toca el motor de obra que ya funciona: lo lee con una credencial de servicio.
 * Instalación paso a paso: obra-app/motor/INSTALAR.md
 *
 * Reglas que cumple:
 *  - Sin credencial válida del Portero no entrega nada (fail-closed).
 *  - Equipo = rol admin o código OB en sus accesos. Cliente = su correo en CLIENTES.
 *  - El cliente solo ve SU unidad y solo lo autorizado. Nunca importes de conceptos,
 *    nómina ni márgenes.
 *  - Nada se borra: corregir = renglón nuevo o cambio de estado con firma y hora.
 *  - Un gasto repetido (misma factura, o mismo importe+concepto+día) se rechaza.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   PORTERO_EXEC  → /exec del Portero (el mismo de os/yod-acceso.js, «original»)
 *   SERVICIO_K    → credencial del Portero con código OB (solo lectura del motor)
 *   MOTORES       → {"PRJ-ALYSA":"https://script.google.com/macros/s/…/exec"}
 *   FOTOS_CARPETA → id de la carpeta de Drive donde se guardan las fotos
 */

var HOJAS = {
  CLIENTES:    ['correo','nombre','folio','unidad','activo','creado'],
  PAGOS:       ['id','folio','unidad','concepto','importe','vence','estado','fecha_pago','metodo','comprobante','registro','creado'],
  DOCUMENTOS:  ['id','folio','unidad','categoria','titulo','url','estado','visible_cliente','subio','creado'],
  DUDAS:       ['id','folio','unidad','correo','texto','estado','respuesta','respondio','creado','respondido'],
  FOTOS:       ['id','folio','unidad','partida','semana','url','nota','subio','autorizada','creado'],
  MOVIMIENTOS: ['id','folio','unidad','partida','concepto','factura','importe','fecha','comprobante','estado','capturo','autorizo','creado'],
  CONFIG:      ['clave','valor']
};
var CATEGORIAS = ['Contratos','Planos','Cuentas T','Informes'];

/* ── utilidades ── */
function props_(k){ return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hoy_(){ return Utilities.formatDate(new Date(), 'America/Hermosillo', "yyyy-MM-dd'T'HH:mm:ss"); }
function id_(pre){ return pre + '-' + Utilities.formatDate(new Date(),'America/Hermosillo','yyMMddHHmmss') + '-' + Math.floor(Math.random()*900+100); }
function low_(v){ return String(v == null ? '' : v).trim().toLowerCase(); }

function hoja_(nombre){
  var ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(nombre);
  if (!sh) { sh = ss.insertSheet(nombre); sh.appendRow(HOJAS[nombre]); sh.setFrozenRows(1); }
  return sh;
}
function filas_(nombre){
  var v = hoja_(nombre).getDataRange().getValues(), h = v.shift() || [];
  return v.filter(function(r){ return r.join('') !== ''; }).map(function(r, i){
    var o = { _fila: i + 2 };
    h.forEach(function(k, j){ var x = r[j]; o[k] = (x instanceof Date) ? Utilities.formatDate(x,'America/Hermosillo','yyyy-MM-dd') : x; });
    return o;
  });
}
function agrega_(nombre, o){
  var cols = HOJAS[nombre];
  hoja_(nombre).appendRow(cols.map(function(k){ return o[k] == null ? '' : o[k]; }));
  return o;
}
function cambia_(nombre, fila, cambios){
  var sh = hoja_(nombre), cols = HOJAS[nombre];
  Object.keys(cambios).forEach(function(k){ var j = cols.indexOf(k); if (j >= 0) sh.getRange(fila, j + 1).setValue(cambios[k]); });
}
function config_(){
  var c = {}; filas_('CONFIG').forEach(function(r){ c[String(r.clave)] = r.valor; }); return c;
}
function publico_(o){ var r = {}; Object.keys(o).forEach(function(k){ if (k.charAt(0) !== '_') r[k] = o[k]; }); return r; }

/* ── quién eres (Portero, con caché de 10 min) ── */
function canje_(k){
  k = String(k || '').trim(); if (k.length < 4) return null;
  var cache = CacheService.getScriptCache();
  var ck = 'c_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, k)).slice(0, 24);
  var hit = cache.get(ck); if (hit) return hit === 'x' ? null : JSON.parse(hit);
  var j = null;
  try {
    var r = UrlFetchApp.fetch(props_('PORTERO_EXEC') + '?recurso=canje&t=' + encodeURIComponent(k), { muteHttpExceptions: true, followRedirects: true });
    j = JSON.parse(r.getContentText());
  } catch (e) { j = null; }
  if (!j || !j.ok) { cache.put(ck, 'x', 60); return null; }
  var s = { correo: low_(j.correo), nombre: String(j.nombre || ''), rol: low_(j.rol), boards: String(j.boards || '') };
  cache.put(ck, JSON.stringify(s), 600);
  return s;
}
function esEquipo_(s){
  if (!s) return false;
  if (s.rol === 'admin') return true;
  var l = s.boards.toUpperCase().split(/[,;| ]+/);
  return l.indexOf('*') >= 0 || l.indexOf('OB') >= 0;
}
function misUnidades_(s){
  if (!s || !s.correo) return [];
  return filas_('CLIENTES').filter(function(r){ return low_(r.correo) === s.correo && String(r.activo).toUpperCase() !== 'NO'; })
    .map(function(r){ return { folio: String(r.folio).toUpperCase(), unidad: String(r.unidad), nombre: r.nombre }; });
}
function puedeVer_(s, folio, unidad){
  if (esEquipo_(s)) return true;
  return misUnidades_(s).some(function(u){ return u.folio === folio && u.unidad === unidad; });
}
function autoriza_(s){
  if (!s) return false;
  if (s.rol === 'admin') return true;
  var l = low_(config_().AUTORIZA_CORREOS).split(/[,; ]+/);
  return l.indexOf(s.correo) >= 0;
}

/* ── el motor de obra, leído con la credencial de servicio ── */
function motor_(folio){
  var m = {}; try { m = JSON.parse(props_('MOTORES') || '{}'); } catch (e) {}
  var url = m[folio]; if (!url) return null;
  var cache = CacheService.getScriptCache(), ck = 'm_' + folio, hit = cache.get(ck);
  if (hit) return JSON.parse(hit);
  var r = UrlFetchApp.fetch(url + '?recurso=board&k=' + encodeURIComponent(props_('SERVICIO_K')), { muteHttpExceptions: true, followRedirects: true });
  var j = JSON.parse(r.getContentText());
  if (!j.ok) return null;
  var min = { conceptos: (j.conceptos || []).map(function(c){ return { frente: c.frente, descripcion: c.descripcion, cantidad: c.cantidad,
    cant_ejecutada: c.cant_ejecutada, precio_unitario: c.precio_unitario, importe: c.importe, avance_pct: c.avance_pct }; }) };
  try { cache.put(ck, JSON.stringify(min), 300); } catch (e) {}
  return min;
}
/* avance ponderado por importe (misma regla que obra-app/calculo.js) */
function avanceDe_(cs){
  var imp = 0, eje = 0, suma = 0, n = 0;
  cs.forEach(function(c){
    var i = Number(c.importe) || 0, cant = Number(c.cantidad) || 0, h = Number(c.cant_ejecutada) || 0, pu = Number(c.precio_unitario) || 0;
    var p = (c.avance_pct !== '' && c.avance_pct != null) ? Number(c.avance_pct) || 0 : (cant > 0 ? h / cant : 0);
    p = Math.max(0, Math.min(1, p));
    if (i > 0) { imp += i; eje += (pu > 0 && cant > 0) ? Math.min(h, cant) * pu : p * i; }
    suma += p; n++;
  });
  return imp > 0 ? Math.min(1, eje / imp) : (n ? suma / n : 0);
}

/* ── lectura ── */
function doGet(e){
  var p = e.parameter || {}, s = canje_(p.k);
  if (!s) return out_({ ok: false, error: 'liga' });
  var r = p.recurso || '';
  var folio = String(p.folio || '').toUpperCase(), unidad = String(p.unidad || '');

  if (r === 'yo') return out_({ ok: true, perfil: esEquipo_(s) ? 'equipo' : (misUnidades_(s).length ? 'cliente' : 'ninguno'),
                               nombre: s.nombre, unidades: misUnidades_(s), autoriza: autoriza_(s) });

  if (r === 'cliente') {
    if (!puedeVer_(s, folio, unidad)) return out_({ ok: false, error: 'sin acceso' });
    var cfg = config_(), mot = motor_(folio), mod = String(cfg['modalidad:' + folio] || 'precio_alzado');
    var mia = mot ? mot.conceptos.filter(function(c){ return String(c.frente) === unidad; }) : [];
    var pagos = filas_('PAGOS').filter(function(x){ return x.folio === folio && String(x.unidad) === unidad; }).map(publico_);
    return out_({ ok: true, folio: folio, unidad: unidad,
      avance: mot ? { global: avanceDe_(mot.conceptos), unidad: avanceDe_(mia),
        partidas: mia.map(function(c){ return { partida: c.descripcion, avance: avanceDe_([c]) }; }) } : null,
      entrega: cfg['entrega:' + folio] || '', camara: cfg['camara:' + folio] || '',
      spei: { clabe: cfg.SPEI_CLABE || '', beneficiario: cfg.SPEI_BENEFICIARIO || '', referencia: folio + '-' + unidad },
      pagos: pagos,
      documentos: filas_('DOCUMENTOS').filter(function(x){ return x.folio === folio && (String(x.unidad) === '' || String(x.unidad) === unidad) &&
        String(x.visible_cliente).toUpperCase() !== 'NO'; }).map(publico_),
      dudas: filas_('DUDAS').filter(function(x){ return x.folio === folio && String(x.unidad) === unidad; }).map(publico_),
      fotos: filas_('FOTOS').filter(function(x){ return x.folio === folio && (String(x.unidad) === '' || String(x.unidad) === unidad) &&
        String(x.autorizada).toUpperCase() === 'SI'; }).map(publico_),
      modalidad: mod,
      gastos: mod === 'administracion' ? filas_('MOVIMIENTOS').filter(function(x){ return x.folio === folio && x.estado === 'AUTORIZADO'; })
        .map(function(x){ return { concepto: x.concepto, partida: x.partida, importe: x.importe, fecha: x.fecha }; }) : null,
      presupuesto: mod === 'administracion' ? Number(cfg['presupuesto:' + folio]) || 0 : null });
  }

  if (r === 'equipo') {
    if (!esEquipo_(s)) return out_({ ok: false, error: 'sin acceso' });
    var f = function(n){ return filas_(n).filter(function(x){ return !folio || x.folio === folio; }).map(publico_); };
    return out_({ ok: true, clientes: f('CLIENTES'), pagos: f('PAGOS'), documentos: f('DOCUMENTOS'), dudas: f('DUDAS'),
      fotos: f('FOTOS'), movimientos: f('MOVIMIENTOS'), autoriza: autoriza_(s), categorias: CATEGORIAS });
  }
  return out_({ ok: false, error: 'recurso' });
}

/* ── escritura ── */
function doPost(e){
  var b = {}; try { b = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'json' }); }
  var s = canje_(b.k); if (!s) return out_({ ok: false, error: 'liga' });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try { return out_(accion_(s, b)); }
  catch (x) { return out_({ ok: false, error: String(x.message || x) }); }
  finally { lock.releaseLock(); }
}

function accion_(s, b){
  var folio = String(b.folio || '').toUpperCase(), unidad = String(b.unidad || ''), eq = esEquipo_(s), quien = s.nombre || s.correo;
  switch (b.accion) {
    case 'duda':
      if (!puedeVer_(s, folio, unidad)) return { ok: false, error: 'sin acceso' };
      if (!String(b.texto || '').trim()) return { ok: false, error: 'Escribe tu duda.' };
      return { ok: true, r: agrega_('DUDAS', { id: id_('DU'), folio: folio, unidad: unidad, correo: s.correo, texto: String(b.texto).slice(0, 2000), estado: 'ABIERTA', creado: hoy_() }) };
    case 'responder':
      if (!eq) return { ok: false, error: 'sin acceso' };
      var d = filas_('DUDAS').find(function(x){ return x.id === b.id; }); if (!d) return { ok: false, error: 'no existe' };
      cambia_('DUDAS', d._fila, { respuesta: String(b.respuesta || ''), respondio: quien, estado: b.cerrar ? 'CERRADA' : 'RESPONDIDA', respondido: hoy_() });
      return { ok: true };
    case 'aviso_pago':
      if (!puedeVer_(s, folio, unidad)) return { ok: false, error: 'sin acceso' };
      var pg = filas_('PAGOS').find(function(x){ return x.id === b.id && x.folio === folio && String(x.unidad) === unidad; });
      if (!pg) return { ok: false, error: 'no existe' };
      cambia_('PAGOS', pg._fila, { estado: 'AVISADO', comprobante: String(b.comprobante || ''), metodo: String(b.metodo || 'SPEI') });
      return { ok: true };
    case 'pago':
      if (!eq) return { ok: false, error: 'sin acceso' };
      if (b.id) {
        var p2 = filas_('PAGOS').find(function(x){ return x.id === b.id; }); if (!p2) return { ok: false, error: 'no existe' };
        if (b.estado === 'RECIBIDO' && !autoriza_(s)) return { ok: false, error: 'Solo quien autoriza confirma un pago.' };
        cambia_('PAGOS', p2._fila, { estado: b.estado, fecha_pago: b.estado === 'RECIBIDO' ? hoy_().slice(0, 10) : p2.fecha_pago, registro: quien });
        return { ok: true };
      }
      return { ok: true, r: agrega_('PAGOS', { id: id_('PG'), folio: folio, unidad: unidad, concepto: b.concepto, importe: Number(b.importe) || 0,
        vence: b.vence, estado: 'PROGRAMADO', registro: quien, creado: hoy_() }) };
    case 'cliente':
      if (!autoriza_(s)) return { ok: false, error: 'Solo Dirección da acceso a clientes.' };
      return { ok: true, r: agrega_('CLIENTES', { correo: low_(b.correo), nombre: b.nombre, folio: folio, unidad: unidad, activo: 'SI', creado: hoy_() }) };
    case 'documento':
      if (!eq) return { ok: false, error: 'sin acceso' };
      if (CATEGORIAS.indexOf(b.categoria) < 0) return { ok: false, error: 'categoría' };
      return { ok: true, r: agrega_('DOCUMENTOS', { id: id_('DC'), folio: folio, unidad: unidad, categoria: b.categoria, titulo: b.titulo, url: b.url,
        estado: 'POR REVISAR', visible_cliente: b.visible_cliente === false ? 'NO' : 'SI', subio: quien, creado: hoy_() }) };
    case 'revisar_documento':
      if (!autoriza_(s)) return { ok: false, error: 'sin acceso' };
      var dc = filas_('DOCUMENTOS').find(function(x){ return x.id === b.id; }); if (!dc) return { ok: false, error: 'no existe' };
      cambia_('DOCUMENTOS', dc._fila, { estado: 'APROBADO' }); return { ok: true };
    case 'foto':
      if (!eq) return { ok: false, error: 'sin acceso' };
      var url = String(b.url || '');
      if (b.data) {
        var carpeta = DriveApp.getFolderById(props_('FOTOS_CARPETA'));
        var blob = Utilities.newBlob(Utilities.base64Decode(String(b.data).replace(/^data:[^,]+,/, '')), b.mime || 'image/jpeg', (b.nombre || 'foto') + '.jpg');
        var file = carpeta.createFile(blob); file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        url = 'https://drive.google.com/thumbnail?sz=w1200&id=' + file.getId();
      }
      if (!url) return { ok: false, error: 'Falta la foto.' };
      return { ok: true, r: agrega_('FOTOS', { id: id_('FT'), folio: folio, unidad: unidad, partida: b.partida, semana: b.semana, url: url,
        nota: b.nota, subio: quien, autorizada: autoriza_(s) ? 'SI' : 'NO', creado: hoy_() }) };
    case 'autorizar_foto':
      if (!autoriza_(s)) return { ok: false, error: 'sin acceso' };
      var ft = filas_('FOTOS').find(function(x){ return x.id === b.id; }); if (!ft) return { ok: false, error: 'no existe' };
      cambia_('FOTOS', ft._fila, { autorizada: 'SI' }); return { ok: true };
    case 'gasto':
      if (!eq) return { ok: false, error: 'sin acceso' };
      var nuevo = { factura: b.factura, importe: Number(b.importe) || 0, fecha: String(b.fecha || hoy_()).slice(0, 10), concepto: b.concepto };
      if (!nuevo.importe) return { ok: false, error: 'Falta el importe.' };
      var dup = filas_('MOVIMIENTOS').filter(function(x){ return x.folio === folio; }).find(function(m){
        var f = String(nuevo.factura || '').trim().toUpperCase();
        if (f && String(m.factura || '').trim().toUpperCase() === f) return true;
        return Number(m.importe) === nuevo.importe && String(m.fecha).slice(0, 10) === nuevo.fecha && low_(m.concepto) === low_(nuevo.concepto);
      });
      if (dup && !b.forzar) return { ok: false, error: 'duplicado', duplicado: publico_(dup) };
      return { ok: true, r: agrega_('MOVIMIENTOS', { id: id_('MV'), folio: folio, unidad: unidad, partida: b.partida, concepto: b.concepto,
        factura: b.factura, importe: nuevo.importe, fecha: nuevo.fecha, comprobante: b.comprobante,
        estado: b.comprobante ? 'PROPUESTO' : 'POR COMPROBAR', capturo: quien, creado: hoy_() }) };
    case 'autorizar_gasto':
      if (!autoriza_(s)) return { ok: false, error: 'sin acceso' };
      var mv = filas_('MOVIMIENTOS').find(function(x){ return x.id === b.id; }); if (!mv) return { ok: false, error: 'no existe' };
      if (low_(mv.capturo) === low_(quien)) return { ok: false, error: 'Quien capturó no autoriza su propio gasto.' };
      cambia_('MOVIMIENTOS', mv._fila, { estado: b.acepta === false ? 'RECHAZADO' : 'AUTORIZADO', autorizo: quien });
      return { ok: true };
  }
  return { ok: false, error: 'acción' };
}

/* Ejecuta una vez a mano: crea las pestañas con sus encabezados. */
function prepararHojas(){ Object.keys(HOJAS).forEach(hoja_); }
