import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dependencyRoot=process.argv[2];
if(!dependencyRoot||!path.isAbsolute(dependencyRoot))throw Error('Provide absolute path to installed Cubefarm 0.3.2 source');
const {build}=await import(pathToFileURL(path.join(dependencyRoot,'node_modules/esbuild/lib/main.js')).href);
const {default:postcss}=await import(pathToFileURL(path.join(dependencyRoot,'node_modules/postcss/lib/postcss.mjs')).href);
import {readFile,writeFile} from 'node:fs/promises';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
await build({entryPoints:[root+'/despacho-agents/Agents.tsx'],outfile:root+'/despacho3d/agents.js',bundle:true,format:'esm',platform:'browser',target:['chrome111','safari16.4'],jsx:'automatic',nodePaths:[path.join(dependencyRoot,'node_modules')],minify:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',banner:{js:'/* Cubefarm-derived interface, MIT © 2026 Leon van Zyl. License: third-party/cubefarm/LICENSE.txt */'}});
const css=postcss.parse(await readFile(root+'/despacho-agents/vendor/cubefarm/styles.css','utf8'));
css.walkAtRules('keyframes',rule=>{rule.params='cf-'+rule.params;});
css.walkRules(rule=>{
 if(rule.parent.type==='atrule'&&rule.parent.name==='keyframes')return;
 if(rule.selector===':root'){rule.selector='#cubefarm-agents';return;}
 if(rule.selector.includes('html')||rule.selector.includes('#root')){rule.remove();return;}
 rule.selector=rule.selectors.map(s=>'#cubefarm-agents '+s.trim()).join(', ');
});
css.walkDecls(d=>{if(/^animation/.test(d.prop))d.value=d.value.replace(/\b(fadein|pop|blink|slideup)\b/g,'cf-$1');});
const override=await readFile(root+'/despacho-agents/aurum.css','utf8');
await writeFile(root+'/despacho3d/agents.css','/* Scoped original Cubefarm 0.3.2 CSS, MIT © Leon van Zyl. */\n'+css.toString()+'\n'+override);
console.log('Built original Cubefarm-derived overlay and scoped Aurum theme.');
