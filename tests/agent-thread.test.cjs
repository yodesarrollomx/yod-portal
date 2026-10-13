
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const helper=import(pathToFileURL(path.resolve(__dirname,'../os/agent-preview.conversation.mjs')).href);
test('partial speech, retries and final transcript produce one immutable final turn',async()=>{
 const {updateTurn}=await helper,s={case_id:'demo-gaston',messages:[]},e={id:'speech-1',case_id:s.case_id,who:'user',input_kind:'voice',seq:1,phase:'partial',text:'Comparemos'};
 assert(updateTurn(s,e));assert.equal(updateTurn(s,e),false);
 assert(updateTurn(s,{...e,seq:2,text:'Comparemos V2 y V3'}));assert.equal(s.messages.length,1);
 assert(updateTurn(s,{...e,seq:3,phase:'final',text:'Comparemos V2 y V3 con restricciones.'}));assert.equal(s.messages.length,1);
 assert.equal(updateTurn(s,{...e,seq:4,text:'otro parcial'}),false);assert.equal(s.messages[0].text,'Comparemos V2 y V3 con restricciones.');
});
test('written turns use the same record shape; another case and role cannot overwrite it',async()=>{
 const {updateTurn}=await helper,s={case_id:'demo-luis',messages:[]},e={id:'typed-1',case_id:s.case_id,who:'user',seq:0,phase:'final',input_kind:'text',text:'Fuente y versión'};
 assert(updateTurn(s,e));assert.equal(updateTurn(s,{...e,case_id:'demo-gaston',seq:1}),false);assert.equal(updateTurn(s,{...e,who:'agent',seq:1}),false);assert.equal(s.messages.length,1);
});
test('interrupted speech cannot create a later final result',async()=>{
 const {updateTurn}=await helper,s={case_id:'demo-ruisenor',messages:[]},e={id:'speech-2',case_id:s.case_id,who:'agent',input_kind:'voice',seq:1,phase:'partial',text:'Una restricción'};
 updateTurn(s,e);updateTurn(s,{...e,seq:2,phase:'cancelled'});assert.equal(updateTurn(s,{...e,seq:3,phase:'final'}),false);assert.equal(s.messages.length,1);assert.equal(s.messages[0].phase,'cancelled');
});
