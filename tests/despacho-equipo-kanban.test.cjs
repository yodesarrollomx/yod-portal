'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const api=import('../despacho3d/equipo-kanban.mjs');
const now=Date.parse('2026-01-02T12:00:00Z');
const snap=()=>({version:1,revision:'synthetic-r1',read_at:'2026-01-02T12:00:00Z',members:[{id:'chatgpt',label:'ChatGPT',kind:'agent'},{id:'claude',label:'Claude',kind:'agent'}],events:[],tasks:[
 {id:'p',title:'Pendiente sintético',status:'Pendiente',owner:'chatgpt',updated_at:'2026-01-02T10:00:00Z'},
 {id:'w',title:'Trabajo sintético',status:'En proceso',owner:'claude'},
 {id:'a',title:'Decisión sintética',status:'Espera OK de Alejandro',owner:'Ambos'},
 {id:'d',title:'Terminado sintético',status:'Hecho',owner:'chatgpt'},
 {id:'b',title:'Bloqueo sintético',status:'Bloqueado',owner:'claude'}]});
test('kanban projects all five statuses exactly once without mutating the source',async()=>{
 const {kanban}=await api,s=snap(),before=JSON.stringify(s),board=kanban(s,'*',now);
 assert.deepEqual(board.columns.map(c=>c.status),['Pendiente','En proceso','Espera OK de Alejandro','Hecho']);
 assert.deepEqual(board.columns.map(c=>c.tasks.length),[1,1,1,1]);assert.equal(board.blocked[0].id,'b');assert.equal(JSON.stringify(s),before);
});
test('responsible filter never silently assigns shared tasks or unknown owners',async()=>{
 const {kanban}=await api;
 assert.equal(kanban(snap(),'claude',now).columns.flatMap(c=>c.tasks).length,1);
 assert.equal(kanban(snap(),'Ambos',now).columns[2].tasks[0].id,'a');
 assert.equal(kanban(snap(),'unknown',now).columns.flatMap(c=>c.tasks).length,0);
});
test('oldest recorded task first; missing and future dates never imply old or recent',async()=>{
 const {kanban,taskAge}=await api,s=snap();s.tasks.push({id:'older',title:'Otro sintético',status:'Pendiente',updated_at:'2026-01-01T10:00:00Z'},{id:'future',title:'Futuro sintético',status:'Pendiente',updated_at:'2026-01-03T10:00:00Z'});
 assert.deepEqual(kanban(s,'*',now).columns[0].tasks.map(t=>t.id),['older','p','future']);
 assert.equal(taskAge(undefined,now),'Antigüedad sin comprobar');assert.equal(taskAge('2026-01-03T10:00:00Z',now),'Antigüedad sin comprobar');
 assert.equal(taskAge('2026-01-02T10:00:00Z',now),'Actualizado hace 2 h');
});
test('owner colors are labels, not heartbeat state or evidence of acceptance',async()=>{
 const {ownerTone}=await api,s=snap();assert.equal(ownerTone('chatgpt',s.members),'chatgpt');assert.equal(ownerTone('claude',s.members),'claude');assert.equal(ownerTone('Ambos',s.members),'shared');assert.equal(ownerTone('unassigned',s.members),'unknown');
});
test('invalid snapshot still fails closed',async()=>{const {kanban}=await api;assert.throws(()=>kanban({tasks:[]}),/snapshot_invalid/);assert.throws(()=>kanban(snap(),'*',NaN),/now_invalid/);});
