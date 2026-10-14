import {createTeamSession,reviewSignal,timeline,safeLink} from './equipo-model.mjs?v=1';
import {bindTeamDictation} from './equipo-dictation.mjs?v=1';
import {kanban,taskAge,ownerTone} from './equipo-kanban.mjs?v=1';

export function mountTeamDesk({container,transport,isAuthorized,identityEpoch,host=window}) {
  if (!container || typeof container.append !== 'function') throw new TypeError('team_container');
  if (isAuthorized() !== true) throw new Error('session_changed');
  const document=container.ownerDocument;
  const session=createTeamSession({transport,isAuthorized,identityEpoch,requestId:()=>host.crypto.randomUUID()});
  const mountedEpoch=identityEpoch();
  let snapshot=null,lane='now',disposed=false,sending=false,lastReceipt=null;
  const el=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;};
  const button=(label,cls='team-button')=>{const b=el('button',cls,label);b.type='button';return b;};
  const stamp=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('es-MX',{timeZone:'America/Hermosillo',dateStyle:'medium',timeStyle:'short'}).format(date):'Sin fecha';};
  const launcher=button('Equipo','team-launcher'),dialog=el('dialog','team-desk');
  dialog.setAttribute('aria-label','Equipo del despacho');
  const header=el('header','team-header'),heading=el('div'),eyebrow=el('p','team-eyebrow','EL DESPACHO · EQUIPO');
  heading.append(eyebrow,el('h1',null,'Qué estamos haciendo'),el('p','team-muted','Tú, ChatGPT y Claude: encargos, notas y siguientes pasos.'));
  const close=button('Cerrar','team-button team-quiet');header.append(heading,close);
  const toolbar=el('div','team-toolbar'),freshness=el('p','team-muted','Consultando la bitácora…'),refresh=button('Actualizar','team-button team-quiet');
  toolbar.append(freshness,refresh);
  const status=el('p','team-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const people=el('section','team-members');people.setAttribute('aria-label','Responsables y últimas revisiones');
  const nav=el('div','team-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Tiempo del trabajo');
  const tabs=new Map();
  for(const [key,label] of [['history','← Historia'],['now','Hoy'],['plan','Planeación →'],['kanban','Relevos']]){
    const b=button(label,'team-tab');b.id='team-tab-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls','team-timeline');b.onclick=()=>{lane=key;renderLane();};tabs.set(key,b);nav.append(b);
  }
  nav.addEventListener('keydown',event=>{
    const keys=[...tabs.keys()],current=keys.indexOf(lane);let next=null;
    if(event.key==='ArrowRight')next=(current+1)%keys.length;if(event.key==='ArrowLeft')next=(current+keys.length-1)%keys.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=keys.length-1;
    if(next!==null){event.preventDefault();lane=keys[next];renderLane();tabs.get(lane).focus();}
  });
  const filter=el('label','team-filter','Historia hasta '),date=el('input');date.type='date';
  // Hermosillo has a fixed UTC−07 offset. Day boundaries match all displayed timestamps.
  date.value=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Hermosillo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  filter.append(date);date.onchange=renderLane;
  const ownerLabel=el('label','team-filter','Responsable '),ownerFilter=el('select');ownerFilter.setAttribute('aria-label','Filtrar relevos por responsable');ownerLabel.append(ownerFilter);ownerFilter.onchange=renderLane;ownerLabel.hidden=true;
  const stream=el('section','team-stream');stream.id='team-timeline';stream.setAttribute('role','tabpanel');stream.tabIndex=0;
  const form=el('form','team-composer'),formTitle=el('h2',null,'Pedir algo o dejar una nota');
  const targetLabel=el('label','team-label','¿Dónde va?'),target=el('select');target.setAttribute('aria-label','Encargo relacionado');targetLabel.append(target);
  const textLabel=el('label','team-label','Tu instrucción'),textarea=el('textarea');textarea.rows=4;textarea.maxLength=12000;textarea.placeholder='Cuéntanos qué necesitas y el resultado que esperas.';textLabel.append(textarea);
  const voiceStatus=el('p','team-muted');voiceStatus.setAttribute('role','status');
  const actions=el('div','team-actions'),mic=button('Dictar','team-button team-quiet'),submit=button('Guardar instrucción'),check=button('Comprobar envío','team-button team-quiet');
  submit.type='submit';check.hidden=true;actions.append(mic,submit,check);
  const receipt=el('p','team-receipt');receipt.setAttribute('role','status');
  form.append(formTitle,targetLabel,textLabel,voiceStatus,actions,receipt);
  const foot=el('p','team-footnote','Las fechas están en hora de Hermosillo. Una revisión reciente indica cuándo se leyó la bitácora. Guardado, leído y terminado son pasos distintos.');
  dialog.append(header,toolbar,status,people,nav,filter,ownerLabel,stream,form,foot);container.append(launcher,dialog);
  const speech=bindTeamDictation({button:mic,textarea,status:voiceStatus,host,canStart:()=>!disposed&&!sending&&!session.pending()&&isAuthorized()===true&&identityEpoch()===mountedEpoch});
  function alive(){return !disposed&&isAuthorized()===true&&identityEpoch()===mountedEpoch;}
  function errorMessage(error){
    if(error.message==='session_changed'){revoke();return;}
    status.textContent=error.message==='read_superseded'?'':error.message==='instruction_invalid'?'Revisa el texto y el encargo seleccionado.':'No pudimos confirmar la actualización. Conservamos tu texto.';
  }
  function sourceLink(value,node){const href=safeLink(value);if(!href)return;const a=el('a','team-source','Ver fuente ↗');a.href=href;a.target='_blank';a.rel='noopener noreferrer';node.append(a);}
  function bodyText(card,value,label){
    if(value.length<=360){card.append(el('p','team-body',value));return;}
    card.append(el('p','team-body',value.slice(0,300).trimEnd()+'…'));
    const details=el('details','team-details');details.append(el('summary',null,label),el('p','team-body',value));card.append(details);
  }
  function renderLane(){
    dialog.dataset.view=lane;
    for(const [key,b] of tabs){b.setAttribute('aria-selected',String(key===lane));b.tabIndex=key===lane?0:-1;}
    stream.setAttribute('aria-labelledby',tabs.get(lane).id);filter.hidden=lane!=='history';ownerLabel.hidden=lane!=='kanban';stream.classList.toggle('team-kanban',lane==='kanban');stream.replaceChildren();
    if(!snapshot)return;
    if(lane==='kanban'){renderKanban();return;}
    const cutoff=date.value?Date.parse(date.value+'T23:59:59.999-07:00'):Date.now();
    const rows=timeline(snapshot,lane,Number.isFinite(cutoff)?cutoff:Date.now());
    if(!rows.length){stream.append(el('p','team-empty',lane==='history'?'Todavía no hay movimientos registrados para esta fecha.':lane==='plan'?'No hay próximos pasos registrados.':'No hay encargos abiertos en esta lectura.'));return;}
    for(const row of rows){
      const card=el('article','team-card');
      if(lane==='history'){
        card.append(el('p','team-meta',stamp(row.at)+' · '+(row.actor||'Autor por confirmar')));bodyText(card,row.text,'Ver movimiento completo');
        if(row.kind==='ack')card.append(el('span','team-badge','Lectura confirmada'));
      }else{
        const owner=snapshot.members.find(m=>m.id===row.owner);
        card.append(el('p','team-meta',owner?owner.label:row.owner==='Ambos'?'ChatGPT y Claude · compartido':row.owner||'Sin responsable asignado'),el('h2',null,row.title),el('span','team-badge',row.status));
        if(row.next_action)bodyText(card,row.next_action,'Ver encargo y seguimiento completo');
        if(row.blocker){card.append(el('p','team-blocker','Con un bloqueo registrado'));bodyText(card,row.blocker,'Ver bloqueo completo');}
        if(row.due_at)card.append(el('p','team-meta','Fecha prevista: '+stamp(row.due_at)));
        if(row.updated_at)card.append(el('p','team-meta','Actualizado: '+stamp(row.updated_at)));
        const note=button('Añadir nota','team-button team-quiet');note.onclick=()=>{if(session.pending()){status.textContent='Primero comprueba el envío pendiente.';return;}target.value=row.id;textarea.focus();};card.append(note);
      }
      sourceLink(row.source_url,card);stream.append(card);
    }
  }
  function renderKanban(){
    const board=kanban(snapshot,ownerFilter.value||'*');
    const hint=el('p','team-kanban-hint','Vista de sólo lectura. El responsable guardado tiene la bolita; la cantidad de tarjetas no reasigna trabajo. Las señales indican revisión comprobada, no conexión permanente.');stream.append(hint);
    function section(title,rows,blocked=false){
      const column=el('section',blocked?'team-kanban-blocked':'team-kanban-column');column.setAttribute('aria-label',title);
      column.append(el('h2',null,title+' · '+rows.length));
      if(!rows.length)column.append(el('p','team-muted','Sin tarjetas en esta lectura.'));
      for(const task of rows){
        const card=el('article','team-card');card.dataset.ownerTone=ownerTone(task.owner,snapshot.members);
        const member=snapshot.members.find(m=>m.id===task.owner),who=member?.label||(task.owner==='Ambos'?'ChatGPT y Claude · compartido':task.owner||'Sin responsable');
        card.append(el('p','team-meta',who),el('p','team-task-id',task.id),el('h3',null,task.title),el('span','team-badge',task.status),el('p','team-meta',taskAge(task.updated_at)));
        if(task.status==='Espera OK de Alejandro')card.append(el('p','team-approval','Espera una decisión de Alejandro. Consulta el alcance y la aprobación en la fuente; esta vista no aprueba.'));
        if(task.blocker)bodyText(card,task.blocker,'Ver bloqueo completo');
        if(task.next_action)bodyText(card,task.next_action,'Ver seguimiento completo');
        sourceLink(task.source_url,card);column.append(card);
      }
      return column;
    }
    if(board.blocked.length)stream.append(section('Bloqueado',board.blocked,true));
    const columns=el('div','team-kanban-columns');for(const c of board.columns)columns.append(section(c.status,c.tasks));stream.append(columns);
  }
  function renderSnapshot(){
    people.replaceChildren();
    for(const member of snapshot.members){
      const signal=reviewSignal(member),card=el('article','team-member');card.dataset.tone=signal.tone;
      card.append(el('h2',null,member.label),el('p','team-signal',signal.label));
      const at=member.kind==='human'?member.last_activity_at:member.last_review_at;
      card.append(el('p','team-meta',at?stamp(at):'Sin registro comprobado'));
      people.append(card);
    }
    const selectedOwner=ownerFilter.value;ownerFilter.replaceChildren();
    for(const [id,label] of [['*','Todos'],...snapshot.members.map(m=>[m.id,m.label]),['Ambos','Ambos · compartido']]){
      const o=el('option',null,label);o.value=id;ownerFilter.append(o);
    }
    for(const task of snapshot.tasks)if(task.owner&&![...ownerFilter.options].some(o=>o.value===task.owner)){const o=el('option',null,task.owner);o.value=task.owner;ownerFilter.append(o);}
    ownerFilter.value=[...ownerFilter.options].some(o=>o.value===selectedOwner)?selectedOwner:'*';
    const selected=target.value;target.replaceChildren();
    const option=el('option',null,'Nuevo encargo');option.value='';target.append(option);
    for(const task of snapshot.tasks){const o=el('option',null,task.title);o.value=task.id;target.append(o);}
    if([...target.options].some(o=>o.value===selected))target.value=selected;
    freshness.textContent='Última lectura: '+stamp(snapshot.read_at);
    renderLane();
  }
  async function read(){
    refresh.disabled=true;
    try{const result=await session.read();if(!alive())return;snapshot=result;renderSnapshot();status.textContent='Bitácora actualizada.';}
    catch(error){errorMessage(error);}
    finally{refresh.disabled=false;if(alive())lock();}
  }
  function lock(){
    const pending=!!session.pending();textarea.readOnly=pending||sending;target.disabled=pending||sending;submit.disabled=!snapshot||pending||sending;mic.disabled=sending||pending||!(host.SpeechRecognition||host.webkitSpeechRecognition);check.hidden=!pending;check.disabled=sending;
  }
  async function deliver(reconcile){
    if(sending||!alive())return;
    speech.stop();sending=true;lock();status.textContent=reconcile?'Comprobando el recibo…':'Guardando tu instrucción…';
    try{
      const result=await session.send(reconcile);if(!alive())return;lastReceipt=result;
      receipt.textContent='Guardado · '+result.id+' · '+stamp(result.recorded_at)+'. Pendiente de lectura por el agente.';
      textarea.value='';target.value='';status.textContent='Tu instrucción quedó registrada.';await read();
    }catch(error){errorMessage(error);if(alive()&&error.message==='revision_conflict'){receipt.textContent='No se guardó: otra persona actualizó la bitácora. Conservamos tu texto.';await read();status.textContent='Revisa la actualización y vuelve a guardar cuando estés listo.';}if(alive()&&session.pending()){receipt.textContent='Envío sin confirmar. Conservamos el texto y la referencia para comprobarlo sin duplicar.';}}
    finally{sending=false;lock();}
  }
  form.onsubmit=event=>{
    event.preventDefault();if(sending||!alive())return;
    try{session.prepare({kind:target.value?'note':'request',task_id:target.value||null,text:textarea.value});}
    catch(error){errorMessage(error);return;}
    void deliver(false);
  };
  check.onclick=()=>void deliver(true);
  launcher.onclick=()=>{if(!alive()){revoke();return;}dialog.showModal();void read();};
  refresh.onclick=()=>void read();
  close.onclick=()=>{speech.stop();dialog.close();launcher.focus();};
  dialog.addEventListener('cancel',()=>speech.stop());
  function revoke(){
    if(disposed)return;disposed=true;session.revoke();speech.dispose();snapshot=null;lastReceipt=null;textarea.value='';stream.replaceChildren();people.replaceChildren();dialog.close();dialog.remove();launcher.remove();
  }
  lock();
  return {open:()=>launcher.click(),refresh:read,revoke,dispose:revoke,lastReceipt:()=>lastReceipt?structuredClone(lastReceipt):null};
}
