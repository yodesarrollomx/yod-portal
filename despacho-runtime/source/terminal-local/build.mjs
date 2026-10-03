import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dependencyRoot=process.argv[2];
if(!dependencyRoot||!path.isAbsolute(dependencyRoot))throw Error('Provide absolute installed Cubefarm source');
const {build}=await import(pathToFileURL(path.join(dependencyRoot,'node_modules/esbuild/lib/main.js')).href);
const root=path.dirname(fileURLToPath(import.meta.url));
for(const [input,output] of [['server.ts','server.js'],['room.ts','room.js'],['vendor/ptyHost.ts','ptyHost.js']])await build({entryPoints:[path.join(root,'src',input)],outfile:path.join(root,'dist',output),bundle:true,platform:'node',format:'esm',target:'node22',packages:'external'});
await build({entryPoints:[path.join(root,'src/pair.ts')],outfile:path.join(root,'public/pair.js'),bundle:true,platform:'browser',format:'esm',target:['chrome111','safari16.4'],minify:true});
console.log('Runtime y puente local compilados.');

await build({entryPoints:[path.join(root,'src/client.ts')],outfile:path.join(root,'public/client.js'),bundle:true,platform:'browser',format:'esm',target:['chrome111','safari16.4'],minify:true,nodePaths:[path.join(dependencyRoot,'node_modules')]});
