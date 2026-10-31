'use strict';
/* Una sola etiqueta de versión (?v=) para todo lo que sirve yod-portal.

   Por qué existe: cada archivo llevaba su ?v= tecleado a mano (18 distintas sólo en
   os/index.html) y chinche.js se pedía con dos etiquetas a la vez; el navegador bajaba
   dos copias y podía servir la vieja. La fuente de verdad es os/versiones.json:
     propia       etiqueta de los archivos de ESTE repo (yodesarrollomx/yod-portal)
     potenciales  etiqueta de los archivos de yodesarrollomx/potenciales-yod (portero.js...)

   Uso (Node puro, sin red):
     node scripts/versiones.cjs --aplicar   reescribe los ?v= (idempotente, conserva el resto byte a byte)
     node scripts/versiones.cjs --check     imprime archivo:línea: tag por cada desviación; exit 1 si hay alguna
     (opcional) --root <carpeta>            otra raíz de repo, para pruebas

   Alcance
   1. HTML de la raíz, os/ y obra-app/ (salvo agent-* y design-preview): cada <script src> y
      <link rel="stylesheet" href> hacia un .js/.mjs/.css local (relativo, ../, os/) o hacia
      https://yodesarrollomx.github.io/yod-portal/ -> ?v=<propia>; hacia
      https://yodesarrollomx.github.io/potenciales-yod/ -> ?v=<potenciales>. Si falta ?v=, se agrega.
      No se tocan CDN (fonts, jsdelivr, unpkg, accounts.google.com), imágenes ni .webmanifest, ni
      lo que está dentro de comentarios, <style> o scripts en línea.
   2. Constantes JS que inyectan etiquetas en runtime: tabla explícita REGLAS_JS (abajo). --check
      falla también si una regla ya no encuentra su constante (se renombró y la tabla quedó ciega).

   Todavía fuera de la tabla (decisión pendiente, no un olvido): los imports con ?v= propio dentro de
   despacho3d/ (cada módulo lleva el suyo), os/load-plan-boot.js y os/load-plan.mjs (imports v2p*),
   os/salud-catalogo.json (dato, no código) y vendor/html2canvas (?v=1.4.1 es la versión real de la librería). */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const ARCHIVO_VERSIONES = 'os/versiones.json';
const CLAVES = ['propia', 'potenciales'];
const ETIQUETA_VALIDA = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const HOST_PAGES = 'https://yodesarrollomx.github.io';
const REPOS_ABSOLUTOS = [['/yod-portal/', 'propia'], ['/potenciales-yod/', 'potenciales']];
const EXTENSIONES = new Set(['.js', '.mjs', '.css']);
const DIRECTORIOS_HTML = ['', 'os', 'obra-app'];
const PAGINA_EXCLUIDA = /^(?:agent-|design-preview)/i;
const USO = 'Uso: node scripts/versiones.cjs --check | --aplicar [--root <carpeta>]';

/* Etiquetas JS: {archivo, nombre, clase, patron, minimo}. El patrón lleva bandera g y dos grupos:
   (1) el texto que precede a la etiqueta y (2) la etiqueta actual; sólo se reemplaza el grupo 2.
   minimo = coincidencias exigidas (1 por omisión; 0 = opcional). */
const TAG = '[A-Za-z0-9._-]*';
const REGLAS_JS = Object.freeze([
  { archivo: 'os/shell.js', nombre: 'yod-acceso.js inyectado', patron: new RegExp(String.raw`(yod-acceso\.js\?v=)(${TAG})`, 'g') },
  { archivo: 'os/shell.js', nombre: 'proyectos.js inyectado', patron: new RegExp(String.raw`(proyectos\.js\?v=)(${TAG})`, 'g') },
  { archivo: 'os/shell.js', nombre: 'ui-chrome.css y ui-chrome.js inyectados', patron: new RegExp(String.raw`(ui-chrome\.(?:css|js)\?v=)(${TAG})`, 'g') },
  { archivo: 'os/shell.js', nombre: 'CHINCHE_V (chinche.js inyectado)', patron: /(var CHINCHE_V\s*=\s*["'])([^"'\n]*)/g },
  { archivo: 'os/ui-chrome.js', nombre: 'import de ui-figures.bundle.mjs', patron: new RegExp(String.raw`(ui-figures\.bundle\.mjs\?v=)(${TAG})`, 'g') },
  { archivo: 'os/app.js', nombre: 'TABLERO_V (iframe de tablero.html)', patron: /(var TABLERO_V\s*=\s*["'])([^"'\n]*)/g },
  { archivo: 'os/app.js', nombre: 'import de despacho3d/equipo.mjs', patron: new RegExp(String.raw`(despacho3d/equipo\.mjs\?v=)(${TAG})`, 'g') },
  { archivo: 'os/app.js', nombre: 'iframe de despacho3d/index.html', patron: new RegExp(String.raw`(despacho3d/index\.html\?v=)(${TAG})`, 'g'), minimo: 0 },
  { archivo: 'os/despacho-section.js', nombre: 'FRAME_PATH (iframe de despacho3d/index.html)', patron: new RegExp(String.raw`(despacho3d/index\.html\?v=)(${TAG})`, 'g') }
].map(regla => Object.freeze({ clase: 'propia', minimo: 1, ...regla })));

/* ───────────── configuración ───────────── */

function validarVersiones(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw new Error(ARCHIVO_VERSIONES + ': debe ser un objeto con "propia" y "potenciales"');
  for (const clave of CLAVES) {
    if (typeof datos[clave] !== 'string' || !ETIQUETA_VALIDA.test(datos[clave])) throw new Error(ARCHIVO_VERSIONES + ': "' + clave + '" debe ser una etiqueta de letras, números, punto, guion o guion bajo (máx. 64)');
  }
  const sobrantes = Object.keys(datos).filter(clave => !CLAVES.includes(clave));
  if (sobrantes.length) throw new Error(ARCHIVO_VERSIONES + ': claves desconocidas: ' + sobrantes.join(', '));
  return { propia: datos.propia, potenciales: datos.potenciales };
}

function leerVersiones(raiz) {
  let crudo;
  try { crudo = fs.readFileSync(path.join(raiz, ARCHIVO_VERSIONES), 'utf8'); } catch (e) { throw new Error(ARCHIVO_VERSIONES + ': no se pudo leer (' + e.code + ')'); }
  let datos;
  try { datos = JSON.parse(crudo); } catch (e) { throw new Error(ARCHIVO_VERSIONES + ': JSON inválido (' + e.message + ')'); }
  return validarVersiones(datos);
}

/* ───────────── utilidades de texto ───────────── */

function lineaDe(texto, desplazamiento) {
  let linea = 1;
  for (let i = texto.indexOf('\n'); i !== -1 && i < desplazamiento; i = texto.indexOf('\n', i + 1)) linea++;
  return linea;
}

function aplicarEdiciones(texto, ediciones) {
  let salida = '';
  let cursor = 0;
  for (const edicion of [...ediciones].sort((a, b) => a.inicio - b.inicio)) {
    if (edicion.inicio < cursor) throw new Error('Ediciones superpuestas en el desplazamiento ' + edicion.inicio);
    salida += texto.slice(cursor, edicion.inicio) + edicion.nuevo;
    cursor = edicion.fin;
  }
  return salida + texto.slice(cursor);
}

/* ───────────── HTML ───────────── */

/* ¿A qué etiqueta pertenece el destino? 'propia' | 'potenciales' | null (no se toca). */
function claseDeDestino(url) {
  if (typeof url !== 'string' || url === '' || /[\s<>"'`{}\\]/.test(url)) return null;
  const base = new URL('https://relativo.invalid/');
  let resuelta;
  try { resuelta = new URL(url.split('#')[0].split('?')[0], base); } catch (_e) { return null; }
  if (resuelta.protocol !== 'https:') return null;
  let clase;
  if (resuelta.origin === base.origin) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(url)) return null; // sin esquema, sin "//" ni "/" inicial
    clase = 'propia';
  } else if (resuelta.origin === HOST_PAGES) {
    const repo = REPOS_ABSOLUTOS.find(([prefijo]) => resuelta.pathname.startsWith(prefijo));
    if (!repo) return null;
    clase = repo[1];
  } else {
    return null;
  }
  return EXTENSIONES.has(path.posix.extname(resuelta.pathname).toLowerCase()) ? clase : null;
}

/* Devuelve la URL con v=<tag> (reemplaza o agrega) y la etiqueta que traía (null si no traía). */
function conEtiqueta(url, tag) {
  const marca = url.indexOf('#');
  const cuerpo = marca < 0 ? url : url.slice(0, marca);
  const ancla = marca < 0 ? '' : url.slice(marca);
  const signo = cuerpo.indexOf('?');
  if (signo < 0) return { url: cuerpo + '?v=' + tag + ancla, actual: null };
  const consulta = cuerpo.slice(signo + 1);
  const partes = consulta.split(/(&amp;|&)/); // parámetro, separador, parámetro...
  let actual = null;
  let visto = false;
  for (let i = 0; i < partes.length; i += 2) {
    const m = /^v(?:=(.*))?$/.exec(partes[i]);
    if (!m) continue;
    if (!visto) actual = m[1] === undefined ? '' : m[1];
    partes[i] = 'v=' + tag;
    visto = true;
  }
  if (!visto) {
    if (consulta !== '' && partes[partes.length - 1] !== '') partes.push(consulta.includes('&amp;') ? '&amp;' : '&');
    partes.push('v=' + tag);
  }
  return { url: cuerpo.slice(0, signo + 1) + partes.join('') + ancla, actual };
}

const ATRIBUTOS = String.raw`(?:"[^"]*"|'[^']*'|[^>"'])*`;
/* Un solo recorrido, de izquierda a derecha: lo que cae dentro de un comentario, de <style> o del cuerpo de un
   <script> se consume entero y no se toca. Grupo 1 = atributos de <script>, grupo 2 = atributos de <link>. */
const ETIQUETAS_HTML = new RegExp(
  String.raw`<!--[\s\S]*?-->` +
  String.raw`|<style\b${ATRIBUTOS}>[\s\S]*?</style[ \t\r\n\f]*>` +
  String.raw`|<script\b(${ATRIBUTOS})>(?:[\s\S]*?</script[ \t\r\n\f]*>)?` +
  String.raw`|<link\b(${ATRIBUTOS})>`, 'gi');
/* Un valor sin comillas llega hasta el espacio o el ">" (el "=" del "?v=" forma parte del valor). */
const ATRIBUTO = /([^ \t\r\n\f"'<>/=]+)(?:[ \t\r\n\f]*=[ \t\r\n\f]*(?:"([^"]*)"|'([^']*)'|([^ \t\r\n\f>]+)))?/g;

function leerAtributos(cadena, base) {
  const lista = [];
  for (const m of cadena.matchAll(ATRIBUTO)) {
    const valor = m[2] ?? m[3] ?? m[4];
    const nombre = m[1].toLowerCase();
    if (valor === undefined) { lista.push({ nombre, valor: null }); continue; }
    const fin = base + m.index + m[0].length - (m[4] === undefined ? 1 : 0); // sin la comilla de cierre
    lista.push({ nombre, valor, inicio: fin - valor.length, fin });
  }
  return lista;
}

function procesarHtml(texto, versiones) {
  const ediciones = [];
  const referencias = [];
  for (const m of texto.matchAll(ETIQUETAS_HTML)) {
    const esScript = m[1] !== undefined;
    if (!esScript && m[2] === undefined) continue;
    const atributos = leerAtributos(esScript ? m[1] : m[2], m.index + (esScript ? '<script'.length : '<link'.length));
    const destino = atributos.find(a => a.nombre === (esScript ? 'src' : 'href') && a.valor !== null);
    if (!destino) continue;
    if (!esScript) {
      const rel = atributos.find(a => a.nombre === 'rel' && a.valor !== null);
      if (!rel || !rel.valor.toLowerCase().split(/[ \t\r\n\f]+/).includes('stylesheet')) continue;
    }
    const clase = claseDeDestino(destino.valor);
    if (!clase) continue;
    const esperado = versiones[clase];
    const { url, actual } = conEtiqueta(destino.valor, esperado);
    const cambia = url !== destino.valor;
    referencias.push({ linea: lineaDe(texto, destino.inicio), destino: destino.valor, clase, actual, esperado, cambia });
    if (cambia) ediciones.push({ inicio: destino.inicio, fin: destino.fin, nuevo: url });
  }
  return { salida: aplicarEdiciones(texto, ediciones), referencias };
}

function paginasHtml(raiz) {
  const paginas = [];
  for (const dir of DIRECTORIOS_HTML) {
    let entradas;
    try { entradas = fs.readdirSync(path.join(raiz, dir), { withFileTypes: true }); } catch (_e) { continue; }
    for (const entrada of entradas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (entrada.isFile() && /\.html$/i.test(entrada.name) && !PAGINA_EXCLUIDA.test(entrada.name)) paginas.push(dir ? dir + '/' + entrada.name : entrada.name);
    }
  }
  return paginas;
}

/* ───────────── constantes JS ───────────── */

function procesarJs(archivo, texto, reglas, versiones) {
  const ediciones = [];
  const referencias = [];
  const faltantes = [];
  for (const regla of reglas.filter(r => r.archivo === archivo)) {
    const esperado = versiones[regla.clase];
    let hallazgos = 0;
    for (const m of texto.matchAll(regla.patron)) {
      hallazgos++;
      const inicio = m.index + m[1].length;
      const cambia = m[2] !== esperado;
      referencias.push({ linea: lineaDe(texto, inicio), destino: regla.nombre, clase: regla.clase, actual: m[2], esperado, cambia });
      if (cambia) ediciones.push({ inicio, fin: inicio + m[2].length, nuevo: esperado });
    }
    if (hallazgos < regla.minimo) faltantes.push(regla.nombre);
  }
  return { salida: aplicarEdiciones(texto, ediciones), referencias, faltantes };
}

/* ───────────── orquestación ───────────── */

function leerTexto(raiz, relativo) {
  let bytes;
  try { bytes = fs.readFileSync(path.join(raiz, relativo)); } catch (e) { throw new Error(relativo + ': no se pudo leer (' + e.code + ')'); }
  const texto = bytes.toString('utf8');
  if (!Buffer.from(texto, 'utf8').equals(bytes)) throw new Error(relativo + ': no es UTF-8 válido; no se reescribe para conservar sus bytes');
  return texto;
}

function auditar(raiz, reglas = REGLAS_JS) {
  const versiones = leerVersiones(raiz);
  const archivos = [];
  for (const ruta of paginasHtml(raiz)) {
    const original = leerTexto(raiz, ruta);
    const { salida, referencias } = procesarHtml(original, versiones);
    archivos.push({ ruta, original, salida, referencias, faltantes: [] });
  }
  for (const ruta of [...new Set(reglas.map(r => r.archivo))].sort()) {
    const original = leerTexto(raiz, ruta);
    const { salida, referencias, faltantes } = procesarJs(ruta, original, reglas, versiones);
    archivos.push({ ruta, original, salida, referencias, faltantes });
  }
  return { versiones, archivos };
}

function describirTag(actual) {
  return actual === null ? '(sin v=)' : actual === '' ? '(vacía)' : actual;
}

function leerArgumentos(argv) {
  const opciones = { aplicar: false, check: false, raiz: RAIZ };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--aplicar') opciones.aplicar = true;
    else if (argv[i] === '--check') opciones.check = true;
    else if (argv[i] === '--root' && argv[i + 1]) opciones.raiz = path.resolve(argv[++i]);
    else throw Object.assign(new Error('Argumento no válido: ' + argv[i]), { uso: true });
  }
  if (opciones.aplicar === opciones.check) throw Object.assign(new Error('Indica exactamente una opción: --check o --aplicar'), { uso: true });
  return opciones;
}

function main(argv = process.argv.slice(2), io = { log: console.log, error: console.error }) {
  let opciones;
  try { opciones = leerArgumentos(argv); } catch (e) { io.error(e.message + '\n' + USO); return 2; }
  let resultado;
  try { resultado = auditar(opciones.raiz); } catch (e) { io.error('versiones: ' + e.message); return 1; }
  const { versiones, archivos } = resultado;
  const cabecera = 'propia=' + versiones.propia + ' potenciales=' + versiones.potenciales;
  const referencias = archivos.reduce((n, a) => n + a.referencias.length, 0);
  const faltantes = archivos.flatMap(a => a.faltantes.map(nombre => a.ruta + ': la regla "' + nombre + '" ya no encuentra su constante (¿se renombró? actualiza REGLAS_JS en scripts/versiones.cjs)'));
  const desviadas = archivos.filter(a => a.referencias.some(r => r.cambia));
  const desviaciones = desviadas.reduce((n, a) => n + a.referencias.filter(r => r.cambia).length, 0);

  if (opciones.check) {
    for (const a of desviadas) for (const r of a.referencias.filter(x => x.cambia)) io.log(a.ruta + ':' + r.linea + ': ' + describirTag(r.actual) + ' (esperado ' + r.esperado + ') · ' + r.destino);
    for (const aviso of faltantes) io.log(aviso);
    if (desviaciones || faltantes.length) {
      io.log('versiones: ' + desviaciones + ' etiqueta(s) fuera de ' + ARCHIVO_VERSIONES + ' en ' + desviadas.length + ' archivo(s)' + (faltantes.length ? ' y ' + faltantes.length + ' regla(s) sin constante' : '') + '. Corrige con: node scripts/versiones.cjs --aplicar');
      return 1;
    }
    io.log('versiones: ' + referencias + ' referencias en ' + archivos.length + ' archivos con ' + cabecera + ': correcto');
    return 0;
  }

  try {
    for (const a of desviadas) {
      const cambios = a.referencias.filter(r => r.cambia);
      fs.writeFileSync(path.join(opciones.raiz, a.ruta), a.salida);
      io.log(a.ruta + ': ' + cambios.length + ' etiqueta(s) -> ' + [...new Set(cambios.map(r => r.esperado))].join(', '));
    }
  } catch (e) { io.error('versiones: no se pudo escribir (' + e.message + ')'); return 1; }
  for (const aviso of faltantes) io.error(aviso);
  io.log('versiones: ' + desviaciones + ' etiqueta(s) actualizadas en ' + desviadas.length + ' archivo(s); ' + (referencias - desviaciones) + ' ya estaban en ' + cabecera);
  return faltantes.length ? 1 : 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { REGLAS_JS, ARCHIVO_VERSIONES, validarVersiones, leerVersiones, claseDeDestino, conEtiqueta, procesarHtml, procesarJs, paginasHtml, auditar, main };
