'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const path=require('node:path');
test('registro de App: permisos mínimos, estado, caducidad, privacidad y errores sin secretos',()=>{
  const result=cp.spawnSync('python3',['-B',path.join(__dirname,'registrar_publicador_test.py')],{encoding:'utf8',timeout:15000});
  assert.equal(result.status,0,result.stdout+result.stderr);
});
