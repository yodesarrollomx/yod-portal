'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]);}
test('Office assets contain neutral UI and no private pilot identity, source Sheet or second-login host',()=>{
 for(const p of [...files(path.join(root,'despacho3d')),...files(path.join(root,'despacho-agents'))]){
  if(!/\.(?:html|[cm]?js|tsx?|css|json|txt)$/.test(p))continue;
  const text=fs.readFileSync(p,'utf8');
  assert.doesNotMatch(text,/Gast[oó]n\s+Madrid|A-161|ptmuaik6hq4px6g|137o7qhxLjuZqH4x9b5bAA5y-vhpdd_I9GmZYtJetQ88|sayri-fraijo\.chatgpt\.site|https:\/\/docs\.google\.com\/spreadsheets\/d\//,path.relative(root,p));
 }
});
test('Every local office page/resource link resolves inside the portal',()=>{
 const base=path.join(root,'despacho3d');
 for(const file of files(base).filter(f=>/\.html$/.test(f))){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){
   if(/^(?:https?:|data:|mailto:)/.test(m[1]))continue;
   const ref=m[1].split(/[?#]/)[0];
   assert.ok(fs.existsSync(path.resolve(path.dirname(file),ref)),path.relative(root,file)+' → '+ref);
  }
 }
});
test('Private Drive selection permits native documents and rejects executable, forged or credential URLs',async()=>{
 const {validateDriveSelection}=await import(pathToFileURL(path.join(root,'despacho3d/drive-selection.mjs')));
 assert.deepEqual(validateDriveSelection({name:' Terreno sintético ',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit#gid=0'}),{name:'Terreno sintético',url:'https://docs.google.com/spreadsheets/d/SYNTHETIC_ONLY/edit#gid=0'});
 for(const url of ['javascript:alert(1)','https://docs.google.com.evil.invalid/spreadsheets/d/id/edit','http://docs.google.com/spreadsheets/d/id/edit','https://secret@docs.google.com/spreadsheets/d/id/edit','https://docs.google.com/not-a-file'])assert.throws(()=>validateDriveSelection({name:'Sintético',url}));
 assert.throws(()=>validateDriveSelection({name:'a'.repeat(121),url:'https://docs.google.com/spreadsheets/d/id/edit'}));
 const src=fs.readFileSync(path.join(root,'despacho3d/drive-selection.mjs'),'utf8');
 assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|fetch\s*\(/);
});
