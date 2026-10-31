'use strict';
/* Una sola etiqueta ?v= (os/versiones.json + scripts/versiones.cjs).
   Parte 1: el reescritor sobre texto sintético. Parte 2: la CLI sobre un repo de mentira.
   Parte 3: el repo real, que debe pasar --check. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const V = require('../scripts/versiones.cjs');

const RAIZ = path.resolve(__dirname, '..');
const SCRIPT = path.join(RAIZ, 'scripts/versiones.cjs');
const TAGS = { propia: 'T-propia', potenciales: 'T-potenciales' };
const html = texto => V.procesarHtml(texto, TAGS);
const reescribe = texto => html(texto).salida;
const js = (archivo, texto) => V.procesarJs(archivo, texto, V.REGLAS_JS, TAGS);

/* ───────────── HTML ───────────── */

test('script con ?v= viejo, sin ?v=, relativo, ../ y os/: todos quedan con la etiqueta propia', () => {
  const entrada = [
    '<script src="app.js?v=viejo"></script>',
    '<script src="../portal-core.js?v=1.0.5"></script>',
    '<script src="os/proyectos.js?v=2"></script>',
    '<script src="adapters/finance.js"></script>',
    '<script type="module" src="./boot.mjs"></script>'
  ].join('\n');
  assert.equal(reescribe(entrada), [
    '<script src="app.js?v=T-propia"></script>',
    '<script src="../portal-core.js?v=T-propia"></script>',
    '<script src="os/proyectos.js?v=T-propia"></script>',
    '<script src="adapters/finance.js?v=T-propia"></script>',
    '<script type="module" src="./boot.mjs?v=T-propia"></script>'
  ].join('\n'));
});

test('stylesheet: href antes o después de rel, rel con varios valores y mayúsculas; otros rel no se tocan', () => {
  const entrada = [
    '<link rel="stylesheet" href="styles.css?v=a">',
    '<link href="ui-chrome.css?v=2" rel="stylesheet">',
    '<link rel="alternate Stylesheet" href="../despacho3d/equipo.css">',
    '<link rel="preload" as="style" href="precarga.css?v=9">',
    '<link rel="modulepreload" href="mod.mjs?v=9">'
  ].join('\n');
  assert.equal(reescribe(entrada), [
    '<link rel="stylesheet" href="styles.css?v=T-propia">',
    '<link href="ui-chrome.css?v=T-propia" rel="stylesheet">',
    '<link rel="alternate Stylesheet" href="../despacho3d/equipo.css?v=T-propia">',
    '<link rel="preload" as="style" href="precarga.css?v=9">',
    '<link rel="modulepreload" href="mod.mjs?v=9">'
  ].join('\n'));
});

test('URL absoluta: yod-portal -> propia, potenciales-yod -> potenciales; los demás atributos se conservan', () => {
  const entrada = [
    '<script src="https://yodesarrollomx.github.io/yod-portal/os/shell.js?v=audit-20260930"></script>',
    '<link rel="stylesheet" href="https://yodesarrollomx.github.io/yod-portal/os/shell.css">',
    '<script src="https://yodesarrollomx.github.io/potenciales-yod/portero.js" data-gate="suave" defer></script>',
    '<script src="https://yodesarrollomx.github.io/potenciales-yod/portero.js?v=relevo8"></script>',
    '<link rel="stylesheet" href="https://yodesarrollomx.github.io/potenciales-yod/ppp-catalog.css?v=x">'
  ].join('\n');
  assert.equal(reescribe(entrada), [
    '<script src="https://yodesarrollomx.github.io/yod-portal/os/shell.js?v=T-propia"></script>',
    '<link rel="stylesheet" href="https://yodesarrollomx.github.io/yod-portal/os/shell.css?v=T-propia">',
    '<script src="https://yodesarrollomx.github.io/potenciales-yod/portero.js?v=T-potenciales" data-gate="suave" defer></script>',
    '<script src="https://yodesarrollomx.github.io/potenciales-yod/portero.js?v=T-potenciales"></script>',
    '<link rel="stylesheet" href="https://yodesarrollomx.github.io/potenciales-yod/ppp-catalog.css?v=T-potenciales">'
  ].join('\n'));
});

test('CDN, otros repos y destinos que no son js/css quedan intactos y ni siquiera cuentan como referencia', () => {
  const entrada = [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css">',
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4Nx" crossorigin="">',
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQ" crossorigin=""></script>',
    '<script src="https://accounts.google.com/gsi/client" async defer></script>',
    '<script src="https://yodesarrollomx.github.io/sala-edicion/app.js?v=3"></script>',
    '<script src="http://yodesarrollomx.github.io/yod-portal/os/shell.js"></script>',
    '<script src="//cdn.example.com/lib.js"></script>',
    '<script src="/raiz/absoluta.js"></script>',
    '<link rel="manifest" href="manifest.webmanifest">',
    '<link rel="apple-touch-icon" href="icono-180.png">',
    '<link rel="icon" href="favicon.png?v=1">',
    '<script type="application/json" src="datos.json"></script>',
    '<script src="data:text/javascript,1"></script>',
    '<script>var inline = 1;</script>'
  ].join('\n');
  const r = html(entrada);
  assert.equal(r.salida, entrada);
  assert.deepEqual(r.referencias, []);
});

test('comentarios, <style> y scripts en línea no se tocan; la etiqueta real de al lado sí', () => {
  const entrada = [
    '<!-- <script src="a.js?v=1"></script> -->',
    '<script>var s = \'<script src="b.js?v=2"><\\/script>\'; document.write(\'<link rel="stylesheet" href="c.css">\');</script>',
    '<style>@import url("d.css?v=3"); /* <link rel="stylesheet" href="e.css"> */</style>',
    '<script src="real.js?v=4"></script>'
  ].join('\n');
  const r = html(entrada);
  assert.equal(r.salida, entrada.replace('real.js?v=4', 'real.js?v=T-propia'));
  assert.equal(r.referencias.length, 1);
});

test('comillas simples, valor sin comillas, etiquetas y atributos en mayúsculas', () => {
  assert.equal(reescribe("<script src='app.js'></script>"), "<script src='app.js?v=T-propia'></script>");
  assert.equal(reescribe('<script src=app.js?v=1 defer></script>'), '<script src=app.js?v=T-propia defer></script>');
  assert.equal(reescribe('<SCRIPT SRC="app.js?v=1"></SCRIPT>'), '<SCRIPT SRC="app.js?v=T-propia"></SCRIPT>');
  assert.equal(reescribe('<LINK REL="STYLESHEET" HREF="a.css">'), '<LINK REL="STYLESHEET" HREF="a.css?v=T-propia">');
});

test('la consulta se respeta: otros parámetros, ancla, &amp;, v sin valor y v repetido', () => {
  const casos = [
    ['a.js', 'a.js?v=T', null],
    ['a.js?v=1', 'a.js?v=T', '1'],
    ['a.js?v=', 'a.js?v=T', ''],
    ['a.js?v', 'a.js?v=T', ''],
    ['a.js?', 'a.js?v=T', null],
    ['a.js?x=1', 'a.js?x=1&v=T', null],
    ['a.js?x=1&', 'a.js?x=1&v=T', null],
    ['a.js?x=1&v=2&y=3', 'a.js?x=1&v=T&y=3', '2'],
    ['a.js?x=1&amp;v=2', 'a.js?x=1&amp;v=T', '2'],
    ['a.js?x=1&amp;y=2', 'a.js?x=1&amp;y=2&amp;v=T', null],
    ['a.js#ancla', 'a.js?v=T#ancla', null],
    ['a.js?v=1#ancla', 'a.js?v=T#ancla', '1'],
    ['a.js?v=1&v=2', 'a.js?v=T&v=T', '1'],
    ['a.js?vv=1', 'a.js?vv=1&v=T', null]
  ];
  for (const [entrada, esperada, actual] of casos) {
    assert.deepEqual(V.conEtiqueta(entrada, 'T'), { url: esperada, actual }, entrada);
  }
});

test('claseDeDestino decide qué es propio, qué es de potenciales y qué no se toca', () => {
  const casos = [
    ['app.js', 'propia'], ['./app.js', 'propia'], ['../portal-core.js?v=1', 'propia'], ['os/x.mjs#h', 'propia'], ['estilos.css', 'propia'],
    ['https://yodesarrollomx.github.io/yod-portal/os/shell.js', 'propia'],
    ['https://yodesarrollomx.github.io/yod-portal/os/shell.css?v=1', 'propia'],
    ['https://yodesarrollomx.github.io/potenciales-yod/portero.js', 'potenciales'],
    ['https://yodesarrollomx.github.io/potenciales-yod/ppp-catalog.css', 'potenciales'],
    ['https://yodesarrollomx.github.io/sala-edicion/app.js', null],
    ['https://cdn.jsdelivr.net/npm/x/y.js', null],
    ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', null],
    ['https://fonts.googleapis.com/css2?family=Instrument+Sans', null],
    ['https://accounts.google.com/gsi/client', null],
    ['//cdn.example.com/a.js', null], ['/abs/raiz.js', null],
    ['http://yodesarrollomx.github.io/yod-portal/os/shell.js', null],
    ['data:text/javascript,1', null], ['manifest.webmanifest', null], ['icono-180.png', null], ['datos.json', null],
    ['', null], ['x.js?v=${plantilla}', null], ['con espacio.js', null]
  ];
  for (const [entrada, esperada] of casos) assert.equal(V.claseDeDestino(entrada), esperada, JSON.stringify(entrada));
});

test('idempotente y conserva el resto byte a byte (CRLF, tabuladores, acentos, emoji)', () => {
  const entrada = '<!doctype html>\r\n<html lang="es">\r\n<head>\r\n\t<title>YOD OS · «Operación» 📌 ñ</title>\r\n\t<script   src="app.js?v=viejo"   defer></script>\r\n  <link\r\n    rel="stylesheet"\r\n    href="x.css?v=1">\r\n</head>\r\n<body>\ttexto  con   espacios   y línea final sin salto</body></html>';
  const primera = html(entrada);
  assert.equal(primera.salida, entrada.replace('app.js?v=viejo', 'app.js?v=T-propia').replace('x.css?v=1', 'x.css?v=T-propia'));
  assert.deepEqual(primera.referencias.map(r => r.linea), [5, 8]);
  const segunda = html(primera.salida);
  assert.equal(segunda.salida, primera.salida);
  assert.equal(segunda.referencias.filter(r => r.cambia).length, 0);
});

/* ───────────── constantes JS ───────────── */

const FUENTES_JS = v => ({
  'os/shell.js': [
    "var sc = document.createElement('script'); sc.src = SELF.replace(/shell\\.js(\\?.*)?$/, 'yod-acceso.js?v=" + v + "');",
    "if (!window.YodProyectos) { sp.src = SELF.replace(/shell\\.js(\\?.*)?$/, 'proyectos.js?v=" + v + "'); }",
    "chromeCSS.href=new URL('ui-chrome.css?v=" + v + "',SELF).href;",
    "chromeJS.src=new URL('ui-chrome.js?v=" + v + "',SELF).href;",
    'var CHINCHE_V = "' + v + '";',
    "s.src = SELF.replace(/os\\/shell\\.js.*$/, 'chinche.js') + '?v=' + CHINCHE_V;"
  ].join('\n'),
  'os/ui-chrome.js': "var figures=import(new URL('ui-figures.bundle.mjs?v=" + v + "',base).href);",
  'os/app.js': [
    "var TABLERO_V='" + v + "';",
    "loadMount:function(){return import('../despacho3d/equipo.mjs?v=" + v + "').then(function(module){return module.mountTeamDesk;});},",
    "'&rol='+encodeURIComponent(state.role)+'&v='+TABLERO_V;"
  ].join('\n'),
  'os/despacho-section.js': "var FRAME_PATH='../despacho3d/index.html?v=" + v + "';",
  'os/yod-cargador.js': "sc.src = new URL('yod-acceso.js?v=" + v + "', SELF).href;"
});

test('constantes JS: cada regla reescribe su etiqueta, deja intacto lo demás y es idempotente', () => {
  const viejas = FUENTES_JS('viejo');
  const esperadas = FUENTES_JS('T-propia');
  for (const archivo of Object.keys(viejas)) {
    const r = js(archivo, viejas[archivo]);
    assert.equal(r.salida, esperadas[archivo], archivo);
    assert.deepEqual(r.faltantes, [], archivo);
    assert.ok(r.referencias.length >= 1 && r.referencias.every(x => x.cambia && x.actual === 'viejo'), archivo);
    const otra = js(archivo, r.salida);
    assert.equal(otra.salida, r.salida, archivo);
    assert.equal(otra.referencias.filter(x => x.cambia).length, 0, archivo);
  }
  assert.equal(js('os/shell.js', viejas['os/shell.js']).referencias.length, 5);
});

test('constantes JS: --check ve la desviación con su línea; comillas simples o dobles se conservan', () => {
  const r = js('os/shell.js', "a\nb\nvar CHINCHE_V = 'ch11-single-controls';\n");
  const desviada = r.referencias.find(x => x.cambia);
  assert.equal(desviada.linea, 3);
  assert.equal(desviada.actual, 'ch11-single-controls');
  assert.equal(r.salida, "a\nb\nvar CHINCHE_V = 'T-propia';\n");
});

test('constantes JS: una regla que ya no encuentra su constante se reporta; la opcional (minimo 0) no', () => {
  const sinChinche = FUENTES_JS('T-propia')['os/shell.js'].replace('var CHINCHE_V = ', 'var CHINCHE_VERSION = ');
  const r = js('os/shell.js', sinChinche);
  assert.deepEqual(r.faltantes, ['CHINCHE_V (chinche.js inyectado)']);
  const app = js('os/app.js', FUENTES_JS('T-propia')['os/app.js']);
  assert.deepEqual(app.faltantes, [], 'el iframe de despacho3d/index.html en app.js es opcional');
  const conIframe = js('os/app.js', FUENTES_JS('T-propia')['os/app.js'] + "\nf.src='../despacho3d/index.html?v=viejo';");
  assert.equal(conIframe.referencias.filter(x => x.cambia).length, 1);
  assert.ok(conIframe.salida.endsWith("f.src='../despacho3d/index.html?v=T-propia';"));
});

test('la tabla REGLAS_JS está bien formada', () => {
  assert.deepEqual([...new Set(V.REGLAS_JS.map(r => r.archivo))].sort(), ['os/app.js', 'os/despacho-section.js', 'os/shell.js', 'os/ui-chrome.js', 'os/yod-cargador.js']);
  const nombres = new Set();
  for (const regla of V.REGLAS_JS) {
    assert.ok(regla.patron instanceof RegExp && regla.patron.flags.includes('g'), regla.nombre + ': el patrón debe ser global');
    // "|" vacío fuerza una coincidencia con '' y exec() devuelve 1 + número de grupos de captura.
    assert.equal(new RegExp(regla.patron.source + '|').exec('').length, 3, regla.nombre + ': dos grupos (texto previo, etiqueta)');
    assert.ok(['propia', 'potenciales'].includes(regla.clase), regla.nombre);
    assert.ok(Number.isInteger(regla.minimo) && regla.minimo >= 0, regla.nombre);
    assert.ok(!nombres.has(regla.archivo + regla.nombre), 'regla repetida: ' + regla.nombre);
    nombres.add(regla.archivo + regla.nombre);
  }
});

/* ───────────── configuración y CLI sobre un repo de mentira ───────────── */

function repoDeMentira(t, extra = {}, tag = 'A1') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'versiones-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const archivos = {
    'os/versiones.json': JSON.stringify({ propia: tag, potenciales: 'B2' }),
    ...Object.fromEntries(Object.entries(FUENTES_JS('viejo')).map(([k, v]) => [k, v + '\n'])),
    'tablero.html': '<!doctype html>\n<script src="os/yod-acceso.js?v=1"></script>\n<script src="chinche.js?v=ch9"></script>\n<script src="https://yodesarrollomx.github.io/potenciales-yod/portero.js"></script>\n',
    'index.html': '<!doctype html><meta http-equiv="refresh" content="0;url=os/">\n',
    'os/index.html': '<!doctype html>\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/x@1/x.css">\n<link rel="stylesheet" href="styles.css?v=zzz">\n',
    'os/agent-preview.html': '<script src="agent.js?v=intocable"></script>\n',
    'os/design-preview.html': '<script src="diseno.js?v=intocable"></script>\n',
    'despacho3d/index.html': '<script src="motor.js?v=intocable"></script>\n',
    'docs/pagina.html': '<script src="docs.js?v=intocable"></script>\n',
    'obra-app/index.html': '<script src="../os/yod-acceso.js?v=1"></script>\n',
    ...extra
  };
  for (const [rel, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), contenido);
  }
  return dir;
}
const cli = (dir, ...args) => cp.spawnSync(process.execPath, [SCRIPT, ...args, ...(dir ? ['--root', dir] : [])], { encoding: 'utf8' });
const leer = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');

test('CLI --check imprime archivo:línea: tag por cada desviación y sale con 1', t => {
  const dir = repoDeMentira(t);
  const r = cli(dir, '--check');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^tablero\.html:2: 1 \(esperado A1\)/m);
  assert.match(r.stdout, /^tablero\.html:3: ch9 \(esperado A1\)/m);
  assert.match(r.stdout, /^tablero\.html:4: \(sin v=\) \(esperado B2\)/m);
  assert.match(r.stdout, /^os\/index\.html:3: zzz \(esperado A1\)/m);
  assert.match(r.stdout, /^obra-app\/index\.html:1: 1 \(esperado A1\)/m);
  assert.match(r.stdout, /^os\/shell\.js:5: viejo \(esperado A1\)/m);
  assert.match(r.stdout, /^os\/app\.js:1: viejo \(esperado A1\)/m);
  assert.doesNotMatch(r.stdout, /intocable|cdn\.jsdelivr/);
});

test('CLI --aplicar deja el repo en regla, no toca lo excluido y una segunda pasada no cambia nada', t => {
  const dir = repoDeMentira(t);
  const intactos = ['index.html', 'os/agent-preview.html', 'os/design-preview.html', 'despacho3d/index.html', 'docs/pagina.html'];
  const antes = Object.fromEntries(intactos.map(rel => [rel, leer(dir, rel)]));
  const a = cli(dir, '--aplicar');
  assert.equal(a.status, 0, a.stdout + a.stderr);
  assert.equal(leer(dir, 'tablero.html'), '<!doctype html>\n<script src="os/yod-acceso.js?v=A1"></script>\n<script src="chinche.js?v=A1"></script>\n<script src="https://yodesarrollomx.github.io/potenciales-yod/portero.js?v=B2"></script>\n');
  assert.equal(leer(dir, 'os/index.html'), '<!doctype html>\n<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/x@1/x.css">\n<link rel="stylesheet" href="styles.css?v=A1">\n');
  assert.equal(leer(dir, 'os/despacho-section.js'), "var FRAME_PATH='../despacho3d/index.html?v=A1';\n");
  for (const rel of intactos) assert.equal(leer(dir, rel), antes[rel], rel);
  const c = cli(dir, '--check');
  assert.equal(c.status, 0, c.stdout + c.stderr);
  const mtime = fs.statSync(path.join(dir, 'tablero.html')).mtimeMs;
  const b = cli(dir, '--aplicar');
  assert.equal(b.status, 0);
  assert.match(b.stdout, /0 etiqueta\(s\) actualizadas/);
  assert.equal(fs.statSync(path.join(dir, 'tablero.html')).mtimeMs, mtime, 'sin cambios no se reescribe el archivo');
});

test('CLI --check falla si una regla JS perdió su constante, y --aplicar lo avisa con exit 1', t => {
  const dir = repoDeMentira(t, { 'os/ui-chrome.js': 'var figures = null;\n' });
  const c = cli(dir, '--check');
  assert.equal(c.status, 1);
  assert.match(c.stdout, /os\/ui-chrome\.js: la regla "import de ui-figures\.bundle\.mjs" ya no encuentra su constante/);
  const a = cli(dir, '--aplicar');
  assert.equal(a.status, 1);
  assert.match(a.stderr, /ya no encuentra su constante/);
});

test('CLI: argumentos inválidos salen con 2; configuración inválida sale con 1 sin escribir nada', t => {
  const dir = repoDeMentira(t);
  for (const args of [[], ['--check', '--aplicar'], ['--otra'], ['--check', '--root']]) {
    const r = cp.spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 2, JSON.stringify(args));
    assert.match(r.stderr, /Uso: node scripts\/versiones\.cjs/);
  }
  const antes = leer(dir, 'tablero.html');
  for (const mala of ['{}', '[]', 'no es json', '{"propia":"A1"}', '{"propia":"A1","potenciales":""}', '{"propia":"con espacio","potenciales":"B2"}',
    '{"propia":"A1","potenciales":"B2","otra":"x"}', '{"propia":7,"potenciales":"B2"}', '{"propia":"A\\"1","potenciales":"B2"}', '{"propia":"-A1","potenciales":"B2"}']) {
    fs.writeFileSync(path.join(dir, 'os/versiones.json'), mala);
    for (const modo of ['--check', '--aplicar']) {
      const r = cli(dir, modo);
      assert.equal(r.status, 1, mala + ' ' + modo);
      assert.match(r.stderr, /os\/versiones\.json/, mala);
    }
  }
  assert.equal(leer(dir, 'tablero.html'), antes);
  fs.rmSync(path.join(dir, 'os/versiones.json'));
  assert.equal(cli(dir, '--check').status, 1);
});

test('un archivo que no es UTF-8 válido no se reescribe', t => {
  const dir = repoDeMentira(t);
  fs.writeFileSync(path.join(dir, 'obra.html'), Buffer.concat([Buffer.from('<script src="a.js?v=1"></script>\n<!-- '), Buffer.from([0xff, 0xfe, 0xfa]), Buffer.from(' -->\n')]));
  const r = cli(dir, '--aplicar');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /obra\.html: no es UTF-8 válido/);
  assert.match(leer(dir, 'tablero.html'), /ch9/, 'ante el error no se escribe nada');
});

/* ───────────── el repo real ───────────── */

test('repo real: --check pasa con la etiqueta de os/versiones.json', () => {
  const r = cp.spawnSync(process.execPath, [SCRIPT, '--check'], { cwd: RAIZ, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /correcto/);
});

test('repo real: alcance — las páginas esperadas están, las excluidas no, y cada regla JS encuentra su constante', () => {
  const paginas = V.paginasHtml(RAIZ);
  for (const esperada of ['index.html', 'tablero.html', 'obra.html', 'track-codesarrollos.html', 'track-alysa.html', 'track-maria.html', 'os/index.html', 'obra-app/index.html']) {
    assert.ok(paginas.includes(esperada), 'falta ' + esperada);
  }
  for (const p of paginas) assert.doesNotMatch(p, /agent-|design-preview|^despacho3d|^docs|^tests|^qa|^chinche\//, p);
  const { archivos } = V.auditar(RAIZ);
  for (const a of archivos) assert.deepEqual(a.faltantes, [], a.ruta);
  const rutasJs = archivos.filter(a => /\.js$/.test(a.ruta)).map(a => a.ruta).sort();
  assert.deepEqual(rutasJs, ['os/app.js', 'os/despacho-section.js', 'os/shell.js', 'os/ui-chrome.js', 'os/yod-cargador.js']);
});

test('repo real: el bug original — chinche.js, portero.js y el tablero se piden siempre con la misma etiqueta', () => {
  const versiones = V.leerVersiones(RAIZ);
  const { archivos } = V.auditar(RAIZ);
  const refs = archivos.flatMap(a => a.referencias.map(r => ({ ...r, ruta: a.ruta })));
  const chinche = refs.filter(r => /(^|\/)chinche\.js/.test(r.destino) || /^CHINCHE_V/.test(r.destino));
  assert.ok(chinche.length >= 4, 'tablero.html, obra.html, os/index.html y CHINCHE_V de os/shell.js');
  for (const r of chinche) assert.equal(r.actual, versiones.propia, r.ruta + ':' + r.linea);
  const porteros = refs.filter(r => /potenciales-yod\/portero\.js/.test(r.destino));
  assert.ok(porteros.length >= 5, 'os/index.html, obra-app, track-codesarrollos, track-alysa y track-maria');
  for (const r of porteros) assert.equal(r.actual, versiones.potenciales, r.ruta + ':' + r.linea);
  assert.ok(porteros.some(r => r.ruta === 'obra-app/index.html'), 'obra-app/index.html ya pide portero.js con ?v=');
  const tablero = refs.find(r => r.ruta === 'os/app.js' && /^TABLERO_V/.test(r.destino));
  assert.equal(tablero.actual, versiones.propia);
  assert.ok(refs.every(r => !r.cambia), 'ninguna referencia gestionada puede estar desviada');
});

test('repo real: os/versiones.json es sólo {propia, potenciales} y son etiquetas válidas', () => {
  const crudo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'os/versiones.json'), 'utf8'));
  assert.deepEqual(Object.keys(crudo).sort(), ['potenciales', 'propia']);
  assert.deepEqual(V.validarVersiones(crudo), crudo);
});
