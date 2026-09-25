'use strict';
// Genera las copias del catálogo (os/catalogo.js) en shell.js, access-policy.js y app.js.
// --check: no escribe; sale con 1 si alguna copia no coincide.
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, '..', p);
const C = require(R('os/catalogo.js'));
const check = process.argv.includes('--check');
const conMarco = C.filter(x => !x.sinMarco);
const q = s => "'" + s + "'";
const lista = a => '[' + a.map(q).join(', ') + ']';
const bloques = {
  'os/shell.js': [
    [/  var DEST = \{[\s\S]*?\n  \};/, '  var DEST = {\n' + conMarco.map(x => '    ' + q(x.id) + ': ' + q(x.destino)).join(',\n') + '\n  };'],
    [/  var ICON = \{[^\n]*\};/, '  var ICON = { ' + conMarco.map(x => q(x.id) + ': ' + q(x.icono)).join(', ') + ' };'],
    [/  var NAME = \{[^\n]*\};/, '  var NAME = { ' + conMarco.map(x => q(x.id) + ': ' + q(x.nombre)).join(', ') + ' };'],
    [/  var CODES = \{[\s\S]*?\n  \}/, '  var CODES = {\n' + '    // generado desde os/catalogo.js (node scripts/catalogo.cjs); SYS-CONTROL solo lo abre Dirección\n' + C.map(x => '    ' + q(x.id) + ': ' + lista(x.codigos)).join(',\n') + '\n  }']
  ],
  'os/access-policy.js': [
    [/  var SYSTEM_CODES=Object\.freeze\(\{[\s\S]*?\n  \}\);/, '  var SYSTEM_CODES=Object.freeze({\n' + C.map(x => '    ' + q(x.id) + ':[' + x.codigos.map(q).join(',') + ']').join(',\n') + '\n  });']
  ],
  'os/app.js': [
    [/  var ICONS=\{[\s\S]*?\n  \};/, '  var ICONS={\n' + conMarco.map(x => '    ' + q(x.id) + ':' + q(x.icono)).join(',\n') + '\n  };']
  ]
};
let malos = [];
for (const [f, reps] of Object.entries(bloques)) {
  const antes = fs.readFileSync(R(f), 'utf8'); let s = antes;
  for (const [re, nuevo] of reps) { if (!re.test(s)) throw new Error('no encontré el bloque ' + re + ' en ' + f); s = s.replace(re, nuevo); }
  if (s !== antes) { if (check) malos.push(f); else fs.writeFileSync(R(f), s); }
}
// portal-core: el destino principal de cada tablero debe ser el del catálogo
const pc = require(R('portal-core.js'));
C.forEach(x => { const d = pc.destinations[x.id]; if (!d || d[0] !== x.destino) malos.push('portal-core.js (' + x.id + ')'); });
if (malos.length) { console.error('Catálogo desalineado (os/catalogo.js manda): ' + malos.join(', ') + '\n→ corre: node scripts/catalogo.cjs'); process.exit(1); }
console.log(check ? 'Catálogo único (os/catalogo.js) = shell/access-policy/app/portal-core: passed' : 'Copias del catálogo escritas');
