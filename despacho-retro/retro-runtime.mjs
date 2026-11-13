// La URL selecciona la presentación; el transporte canónico sigue validando la identidad.
export function isRetroHost(win=window){
 try{return new URL(win.location.href).searchParams.get('office')==='retro'&&win.parent!==win&&win.parent.location.origin===win.location.origin;}catch{return false;}
}
export async function mountRetroRuntime({getMap,onPanel,hidePanel,onPlaceReady}){
 let active=true,stop=null,stopResident=null,api=null;
 const cleanup=()=>{active=false;stop?.();stopResident?.();window.removeEventListener('yod-residents-ready',bind);api?.destroy();};
 window.addEventListener('pagehide',cleanup,{once:true});
 const {createRetroOffice}=await import('./retro-office.mjs');if(!active)return null;
 api=createRetroOffice({getMap,showPanel:onPanel,hidePanel});window.despacho=api;
 onPlaceReady(api);
 document.querySelector('.demo').textContent='Despacho retro · acceso sujeto a tu sesión de YOD OS';
 document.getElementById('retro-session').hidden=false;
 const back=document.createElement('a');back.href='../os/#/despacho';back.target='_top';back.textContent='Volver a oficina 3D';document.querySelector('.topbar').append(back);
 const note=document.createElement('p');note.className='hint';note.textContent='Posiciones ilustrativas; no indican actividad.';document.getElementById('map-host').after(note);
 for(const name of ['council','avatar-hud','live-voice','agent-workspace','document-tray','knowledge-board','agents','circulo','entorno','biblioteca','hairline-access','puesto-agente']){
  const link=document.createElement('link');link.rel='stylesheet';link.href=`../despacho3d/${name}.css`;document.head.append(link);
 }
 // Los módulos conservan los puentes de sesión, la selección y sus comprobaciones.
 await Promise.all(['office-lifecycle.mjs','resident-boot.mjs','work-observer-boot.mjs','room-work-boot.mjs','biblioteca-boot.mjs','agents.js','agent-workspace-boot.mjs','circulo-boot.mjs','entorno-boot.mjs','office-entry-boot.mjs','data-continuity-boot.mjs'].map(name=>import(`../despacho3d/${name}`)));
 if(!active)return null;
 const {mountLiveVoice}=await import('../despacho3d/live-voice-core.mjs?v=retro1');if(!active)return null;
 mountLiveVoice({mountAvatarCard:({container})=>({open(selection){container.textContent=selection?.avatar?.name||selection?.name||'Tu autón';},clear(){container.textContent='';}})});
 const caseOpen=document.getElementById('case-open');caseOpen.addEventListener('click',()=>{api.visit('case');api.openPanel('case');});
 const status=document.getElementById('retro-session-status'),list=document.getElementById('retro-cases');
 let epoch=0,catalogKey='';
 let boundResident=null;
 function bind(){if(!active)return;const resident=window.YodResidentAgents;if(resident===boundResident)return;boundResident=resident;epoch++;catalogKey='';stop?.();stopResident?.();if(!resident?.subscribeCatalog)return;
  stopResident=resident.subscribe?.(()=>{const selected=resident.getSelection?.();document.getElementById('voice-open').disabled=!selected?.can_enqueue;});
  stop=resident.subscribeCatalog(state=>{
   const cases=state.cases||[];const key=JSON.stringify([state.phase,cases.map(c=>c.case_id)]);if(key!==catalogKey){catalogKey=key;epoch++;}
   const own=epoch;list.replaceChildren();
   status.textContent=state.phase==='unauthorized'?'Entra en YOD OS para validar tu acceso.':state.phase==='current'?(cases.length?'Elige un proyecto autorizado.':'No hay proyectos disponibles para esta sesión.'):'Validando tus proyectos…';
   for(const item of cases){const button=document.createElement('button');button.type='button';button.textContent=item.name||'Proyecto';button.setAttribute('aria-pressed',String(resident.getSelection?.()?.case_id===item.case_id));button.addEventListener('click',async()=>{button.disabled=true;status.textContent='Validando el proyecto…';try{const ok=await resident.selectCase(item.case_id,{isCurrent:()=>own===epoch});if(own===epoch&&!ok)status.textContent='No se confirmó el acceso al proyecto. Vuelve a intentarlo.';}catch{if(own===epoch)status.textContent='No se confirmó el acceso al proyecto. Vuelve a intentarlo.';}finally{if(own===epoch)button.disabled=false;}});list.append(button);}
  });
 }
 window.addEventListener('yod-residents-ready',bind);bind();
 window.dispatchEvent(new CustomEvent('yod-office-ready',{detail:null}));
 window.addEventListener('pagehide',()=>{epoch++;},{once:true});
 return api;
}
