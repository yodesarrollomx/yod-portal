import {buildMeeting,meetingDocument} from './project-meeting.mjs?v=124';
export function mountMeeting({container,getCase,onPresent=async()=>false,onSlide=()=>{},onNext=()=>{},onReview=async()=>null,canReview=()=>false,doc=document,win=window}){
 let deck=null,index=0,generation=0,goalStatus=null;
 const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
 function clear(){generation++;deck=null;index=0;goalStatus=null;container.replaceChildren();onSlide(null);}
 function valid(){return deck&&deck.case_id===getCase();}
 function paint(){
  if(!valid()){clear();return;}
  const s=deck.slides[index],own=++generation;container.replaceChildren();
  const top=el('div',undefined,'meeting-top');top.append(el('small',deck.project+' · '+deck.status),el('span',(index+1)+' / '+deck.slides.length));
  const slide=el('article',undefined,'meeting-slide');slide.append(el('small','REUNIÓN DE AVANCES'),el('h2',s.title),el('p',s.excerpt||s.result,'meeting-result'));
  const diagram=el('div',undefined,'meeting-diagram');diagram.setAttribute('aria-label','Objetivo, avance y revisión');
  for(const n of s.diagram){const card=el('div');card.append(el('strong',n.label),el('p',n.text));diagram.append(card);}slide.append(diagram);
  const controls=el('div',undefined,'meeting-controls'),notice=el('p','','meeting-notice');notice.setAttribute('role','status');
  const back=button('Anterior',()=>{if(valid()&&index>0){index--;paint();}});back.disabled=index===0;
  const next=button('Siguiente',()=>{if(valid()&&index<deck.slides.length-1){index++;paint();}});next.disabled=index===deck.slides.length-1;
  const speak=button('Presentar esta lámina',async()=>{
   if(!valid())return clear();speak.disabled=true;notice.textContent='Preparando la narración…';
   try{const ok=await onPresent({case_id:deck.case_id,title:s.title,script:s.script,goal_id:deck.goal_id,revision:deck.revision});
    if(own!==generation||!valid())return;
    notice.textContent=ok?'Guion enviado a la conversación. Puedes interrumpir y preguntar.':'La voz todavía no está lista. Conecta el micrófono y vuelve a presentar esta lámina.';
   }catch{if(own===generation)notice.textContent='No se pudo enviar la narración. La lámina y el guion se conservan.';}
   finally{if(own===generation)speak.disabled=false;}
  });
  controls.append(back,speak,next);
  const notes=el('details');notes.append(el('summary','Resultado completo, guion y evidencia'),el('p',s.result),el('p',s.script));
  for(const e of s.evidence)notes.append(el('h3',e.title),el('pre',e.text));
  if(!s.evidence.length)notes.append(el('p','No hay evidencia vinculada a este tema.'));
  const footer=el('div',undefined,'meeting-footer');
  const review=button('Marcar entrega revisada',async()=>{
   if(!valid()||goalStatus!=='ready_for_review'||!canReview())return;
   review.disabled=true;notice.textContent='Confirmando tu revisión…';
   try{
    const value=await onReview({case_id:deck.case_id,goal_id:deck.goal_id,revision:deck.revision});
    if(own!==generation||!valid())return;
    if(!value){review.textContent='Comprobar revisión';notice.textContent='La revisión no está confirmada. Comprueba la misma solicitud antes de otro encargo.';return;}
    if(value.case_id!==deck.case_id||value.goal_id!==deck.goal_id||value.status!=='completed')throw Error('review_mismatch');
    const savedIndex=index;deck=buildMeeting(value,deck.case_id,deck.project);goalStatus=value.status;index=Math.min(savedIndex,deck.slides.length-1);paint();
   }catch{if(own===generation)notice.textContent='La entrega cambió o la revisión no se confirmó. Revisa su estado en Trabajo; no se abrió otro encargo.';}
   finally{if(own===generation)review.disabled=!canReview();}
  });
  review.dataset.meetingAction='review';review.disabled=!canReview();
  if(goalStatus==='ready_for_review')footer.append(review);
  const nextGoal=button('Siguiente encargo',()=>{if(valid()&&goalStatus==='completed')onNext({case_id:deck.case_id,goal_id:deck.goal_id});});
  nextGoal.dataset.meetingAction='next';nextGoal.disabled=goalStatus!=='completed'||!canReview();
  footer.append(button('Descargar presentación',()=>{
   if(!valid())return clear();const url=win.URL.createObjectURL(new Blob([meetingDocument(deck)],{type:'text/html;charset=utf-8'}));
   const a=el('a');a.href=url;a.download='avances-'+deck.goal_id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.html';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
  }),nextGoal,el('small','Registro · '+new Date(deck.updated_at).toLocaleString()));
  if(goalStatus==='ready_for_review')footer.append(el('small','Marcar revisada reconoce esta entrega; no autoriza cambios financieros.'));
  else if(goalStatus==='awaiting_data')footer.append(el('small','La entrega es parcial. Completa los datos y retoma el encargo desde Trabajo.'));
  container.append(top,slide,controls,notice,notes,footer);onSlide({...s,case_id:deck.case_id,project:deck.project});
 }
 return {open(goal,caseId,name){clear();if(getCase()!==caseId)return false;deck=buildMeeting(goal,caseId,name);goalStatus=goal.status;paint();return true;},clear,
  hide(){onSlide(null);},snapshot:()=>deck?{case_id:deck.case_id,goal_id:deck.goal_id,index,slides:deck.slides.length}:null};
}
