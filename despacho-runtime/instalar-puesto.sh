#!/bin/bash
set -euo pipefail
umask 077
# Update an existing installation. No credentials or private identities in this file.
yod_home="${YOD_UPDATE_HOME:-$HOME}"
yod_state="$yod_home/.local/share/yod-terminal"
yod_node_dir="$yod_home/.local/share/yod-runtime/node_modules/.bin"
yod_install="$yod_home/.local/share/yod-terminal-runtime/0.3.0"
yod_old="$yod_home/.local/share/yod-terminal-runtime/0.2.0"
yod_launcher="$yod_home/.local/bin/yod-terminal"
test -x "$yod_node_dir/node" || { echo 'Falta la instalación de Node de YOD.'; exit 1; }
export PATH="$yod_node_dir:$PATH"
node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)'
command -v codex >/dev/null || { echo 'No se encuentra el Codex instalado.'; exit 1; }
test -f "$yod_state/room-connection.json" || { echo 'No se encontró el vínculo existente con el Despacho. No se cambió nada.'; exit 1; }
yod_temp=$(mktemp -d "${TMPDIR:-/tmp}/yod-puesto.XXXXXX")
trap 'rm -rf "$yod_temp"' EXIT
echo '1/3 · Comprobando el puesto existente…'
node - "$yod_state" "$yod_temp/scope.json" <<'JS'
const fs=require('fs'),path=require('path');
const [root,out]=process.argv.slice(2);
try {
 const s=JSON.parse(fs.readFileSync(path.join(root,'workspace/expediente.json'),'utf8'));
 const identity=s.context?.identity;
 if(!identity||s.case_id!==identity.case_id||typeof s.case_id!=='string'||!s.case_id||s.case_id.length>256||typeof identity.name!=='string'||!identity.name||identity.name.length>120)throw Error();
 const prior=path.join(root,'terminal-scope.json');
 if(fs.existsSync(prior)&&JSON.parse(fs.readFileSync(prior,'utf8')).case_id!==s.case_id)throw Error();
 fs.writeFileSync(out,JSON.stringify({case_id:s.case_id,name:identity.name}),{mode:0o600});
}catch{console.error('Falta una instantánea válida del expediente. Conservamos la instalación y sus datos.');process.exit(1);}
JS
echo '2/3 · Descargando y verificando la actualización…'
curl --fail --location --show-error --connect-timeout 15 --max-time 90 'https://yodesarrollomx.github.io/yod-portal/despacho-runtime/releases/0.3.0.tar.gz' -o "$yod_temp/runtime.tar.gz"
echo "4ffbf08c13a6357321f501d3fb8553d796defc0453c286763e5585e1159026a1  $yod_temp/runtime.tar.gz" | sha256sum -c -
mkdir -p "$yod_install" "$yod_home/.local/bin"
tar -xzf "$yod_temp/runtime.tar.gz" -C "$yod_install"
if [ ! -e "$yod_install/node_modules" ]; then
 if [ -d "$yod_old/node_modules" ]; then
  ln -s "$yod_old/node_modules" "$yod_install/node_modules"
 else
  npm --prefix "$yod_install" ci --omit=dev --no-audit --no-fund --loglevel=http --fetch-retries=1 --fetch-timeout=60000
 fi
fi
node --input-type=module - "$yod_install" <<'JS'
import {createRequire} from 'node:module';
const require=createRequire(process.argv[2]+'/package.json');
for(const name of ['ws','@xterm/headless','@xterm/addon-serialize','@lydell/node-pty'])require(name);
JS
install -m 600 "$yod_temp/scope.json" "$yod_state/terminal-scope.json"
if [ -f "$yod_launcher" ] && [ ! -f "$yod_launcher.before-puesto-0.3" ]; then cp -p "$yod_launcher" "$yod_launcher.before-puesto-0.3"; fi
cat > "$yod_temp/launcher" <<'LAUNCHER'
#!/bin/bash
set -euo pipefail
export PATH="$HOME/.local/share/yod-runtime/node_modules/.bin:$PATH"
exec node "$HOME/.local/share/yod-terminal-runtime/0.3.0/dist/server.js"
LAUNCHER
install -m 700 "$yod_temp/launcher" "$yod_launcher"
echo '3/3 · Activando el puesto…'
if command -v systemctl >/dev/null && systemctl --user show-environment >/dev/null 2>&1; then
 if [ "$(systemctl --user show yod-terminal.service -p KillMode --value)" = 'process' ]; then
  systemctl --user restart yod-terminal.service
 else
  echo 'Actualización guardada. El servicio tiene una configuración distinta; no lo reiniciamos para conservar el proceso.'
  exit 1
 fi
else
 echo 'Actualización guardada. Abre el servicio mediante ~/.local/bin/yod-terminal cuando cierres el servidor anterior.'
 exit 0
fi
node - "$yod_temp/scope.json" <<'JS'
const fs=require('fs');
const expected=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
(async()=>{
 for(let attempt=0;attempt<15;attempt++){
  try{
   const page=await fetch('http://127.0.0.1:4381/pair',{signal:AbortSignal.timeout(2000)});
   const cookie=page.headers.get('set-cookie')?.split(';')[0];
   if(!cookie)throw Error();
   const reply=await fetch('http://127.0.0.1:4381/bridge-context',{headers:{Cookie:cookie},signal:AbortSignal.timeout(2000)});
   const scope=await reply.json();
   if(reply.ok&&scope.version==='0.3.0'&&scope.case_id===expected.case_id)return;
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 console.error('La actualización está guardada, pero el servicio aún no confirmó la conexión. Conservamos todos tus datos.');process.exitCode=1;
})();
JS
echo 'LISTO. En YOD OS recarga la página, abre Agentes → Terminal → Conectar mi terminal.'
echo 'Confirma Permitir conexión en la ventana local. Después trabaja desde la sala; mantén esa ventana abierta.'
