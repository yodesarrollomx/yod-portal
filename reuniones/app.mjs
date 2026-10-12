import {mountReview} from './review.mjs';
import {driveFolder,audioExtension,handoffText,shareFile} from './handoff.mjs';
import {Journal,synchronize,endpoint} from './journal.mjs';
import {MeetingRecorder} from './recorder.mjs';
import {importAudio} from './import.mjs';
const $=id=>document.getElementById(id),journal=await new Journal().open();
const recorder=new MeetingRecorder(journal,paint);
let config=null,syncing=false,currentStatus=null;
const preparedShares=new Map();
const params=new URL(location.href).searchParams,project=params.get('case_id');
$('meeting-kind').value=params.get('mode')==='initial'?'initial':'project';
function captureContext(){const initial=$('meeting-kind').value==='initial';return {kind:initial?'initial':'project',case_id:initial?null:$('project').value.trim(),title:$('meeting-title').value.trim()||(initial?'Plática inicial':'Reunión del proyecto')};}
function captureKey(context){return context.case_id||'initial-'+crypto.randomUUID();}
function modeChanged(){const initial=$('meeting-kind').value==='initial';$('project').disabled=initial||recorder.active;$('project').placeholder=initial?'No se creará un PPP':'Identificador del expediente';}
$('meeting-kind').onchange=modeChanged;modeChanged();
if(project&&/^[A-Za-z0-9_-]{1,100}$/.test(project))$('project').value=project;
const text=(node,value)=>node.textContent=value;
function paint() {
  const active=recorder.active,paused=recorder.recorder?.state==='paused';
  document.body.dataset.recording=String(active&&!paused);
  $('meeting-kind').disabled=active;$('meeting-title').disabled=active;modeChanged();$('start').disabled=active;$('pause').disabled=!active;$('stop').disabled=!active;
  text($('pause'),paused?'Continuar':'Pausar');
  text($('phase'),active?(paused?'En pausa':'Grabando · '+Math.floor((recorder.session?.duration||0)/60)+' min guardados'):'Lista para grabar');
  $('level').value=recorder.level||0;
  if(recorder.notice)text($('notice'),recorder.notice);
  else if(recorder.silent&&active&&!paused)text($('notice'),'No se detecta sonido desde hace 20 segundos. Comprueba el micrófono.');
}
function download(blob,name) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function exportSession(s) {
  const chunks=await journal.chunks(s.id),extras=recorder.session?.id===s.id?recorder.unsaved||[]:[];
  const ext=audioExtension(s.mime);
  download(new Blob([...chunks.map(c=>c.blob),...extras],{type:s.mime}),s.id+'.'+ext);
}
function button(label,action) {const b=document.createElement('button');b.className='secondary';b.textContent=label;b.onclick=()=>Promise.resolve(action()).catch(showError);return b;}
function showError(error) {text($('notice'),error.message||'No se pudo completar. Conserva esta ventana y descarga el audio.');}
async function renderSessions() {
  const sessions=(await journal.sessions()).sort((a,b)=>b.created-a.created);
  $('sessions').replaceChildren();$('empty').hidden=!!sessions.length;
  for(const s of sessions) {
    const chunks=await journal.chunks(s.id),remote=chunks.filter(c=>c.remote).length;
    const card=document.createElement('article');card.className='session';
    const title=document.createElement('h3');title.textContent=(s.context?.title||s.project)+(s.context?.kind==='initial'?' · Sin PPP':'')+' · '+new Date(s.created).toLocaleString('es-MX');
    const state=document.createElement('p');state.textContent=`${chunks.length} fragmentos guardados en este dispositivo · ${remote} con acuse del servidor. ${s.state.startsWith('import')?'Importación incompleta: vuelve a seleccionar el archivo original.':s.state==='interrupted'?'Grabación interrumpida: revisar el final.':s.state==='recording'?'Grabando.':'Captura finalizada.'}`;
    const actions=document.createElement('div');actions.className='actions';actions.append(button('Descargar audio',()=>exportSession(s)),button('Descargar ficha de captura',()=>download(new Blob([JSON.stringify({schema:'yod-meeting-capture/v1',meeting_id:s.id,case_id:s.context?.kind==='initial'?null:s.project,title:s.context?.title||'Reunión',origin:s.context?.kind||'project',recorded_at:new Date(s.created).toISOString(),audio_filename:s.id+'.'+audioExtension(s.mime),notice:'Ficha de captura; todavía no acredita transcripción ni archivo en el expediente.'},null,2)],{type:'application/json'}),s.id+'-captura.json')));
    if(['stopped','interrupted','sealed'].includes(s.state)) {
      const share=button('Compartir audio…',async()=>{
        try { text($('notice'),await shareFile(share.preparedFile)); }
        catch(error) { if(error.name!=='AbortError')throw error; }
      });share.preparedFile=preparedShares.get(s.id);share.hidden=!share.preparedFile;
      actions.append(button('Preparar envío privado',async()=>{
        share.preparedFile=new File(chunks.map(c=>c.blob),s.id+'.'+audioExtension(s.mime),{type:s.mime});
        if(!share.preparedFile.size)throw Error('No hay audio conservado para compartir.');
        preparedShares.set(s.id,share.preparedFile);
        share.hidden=false;text($('notice'),'Copia preparada. Toca Compartir audio y elige Drive o ChatGPT. Conserva el original.');
      }),share);
    }
    if(config)actions.append(button('Respaldar y ver resultado',()=>sync(s.id)));
    card.append(title,state,actions);$('sessions').append(card);
  }
}
function renderFeedback(status) {
  $('feedback').replaceChildren();
  const jobs=status.jobs||[],final=jobs.find(j=>j.kind==='final'&&j.state==='done'),job=final||jobs.filter(j=>j.kind==='preview'&&j.state==='done').at(-1);
  const statusText=document.createElement('p');
  const drive=jobs.find(j=>j.kind==='drive'&&j.state==='done');
  statusText.textContent=`${status.state==='sealed'?'Audio recibido y verificado en el servidor.':'Respaldo parcial; reunión abierta.'} ${drive?'Entrega verificada en Drive.':'Drive aún no confirmado.'} ${job?job.result.notice:'Transcripción pendiente.'}`;
  $('feedback').append(statusText);
  if(drive){const a=document.createElement('a');a.href=drive.result.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Abrir entrega en Drive';$('feedback').append(a);}
  if(job) {
    const b=button('Descargar transcripción y revisión',()=>download(new Blob([JSON.stringify(job.result,null,2)],{type:'application/json'}),status.id+'-revision.json'));$('feedback').append(b);
    for(const item of job.result.candidates||[]) {
      const card=document.createElement('div');card.className='candidate';
      const label=document.createElement('strong');label.textContent=`Por confirmar · ${Math.floor(item.start/60)}:${String(Math.floor(item.start%60)).padStart(2,'0')}`;
      const quote=document.createElement('blockquote');quote.textContent=item.quote;
      const question=document.createElement('p');question.textContent=item.question;card.append(label,quote,question);$('feedback').append(card);
    }
  }
}
async function sync(id=null) {
  if(syncing||!config)return;
  syncing=true;
  try {
    for(const s of await journal.sessions()) {
      if(id&&s.id!==id)continue;
      if(s.state.startsWith('import'))continue; // Never back up/seal a partially imported file as a complete recording.
      currentStatus=await synchronize(journal,s,config);renderFeedback(currentStatus);
    }
    text($('connection'),'Conectado. Los acuses verifican fragmentos; Drive se confirma por separado.');
  }catch(e){text($('connection'),e.message+' El audio local se conserva. Se reintentará.');}
  finally{syncing=false;await renderSessions();}
}
$('start').onclick=async()=>{try{recorder.notice='';text($('notice'),'');const context=captureContext();await recorder.start(captureKey(context),context);if(!recorder.persistent)text($('notice'),'El navegador no concedió almacenamiento persistente. Descarga una copia al terminar.');await renderSessions();}catch(e){showError(e);}};
$('pause').onclick=()=>recorder.recorder?.state==='paused'?recorder.resume():recorder.pause();
$('stop').onclick=async()=>{await recorder.stop();await renderSessions();await sync();};
$('refresh').onclick=()=>renderSessions().catch(showError);
$('audio-file').onchange=async()=>{
  const file=$('audio-file').files[0];if(!file)return;
  $('audio-file').disabled=true;
  try {
    const context=captureContext();await importAudio(journal,file,captureKey(context),percent=>text($('import-status'),`Conservando copia local: ${percent} %`),context);
    text($('import-status'),'Importación completa. Conserva el original hasta comprobar el respaldo remoto.');await renderSessions();await sync();
  }catch(error){text($('import-status'),error.message);await renderSessions();}
  finally{$('audio-file').disabled=false;$('audio-file').value='';}
};
$('connect').onclick=async()=>{try{config={server:endpoint($('server').value),token:$('token').value};if(config.token.length<24)throw Error('La credencial del dispositivo está incompleta.');sessionStorage.setItem('yod-meetings-connection',JSON.stringify(config));$('token').value='';await sync();}catch(e){config=null;showError(e);}};
$('disconnect').onclick=()=>{config=null;sessionStorage.removeItem('yod-meetings-connection');text($('connection'),'Desconectado. Las copias locales se conservan.');};
// Mark only truly orphaned captures; never relabel an active recording in another tab.
if(navigator.locks)await navigator.locks.request('yod-meeting-microphone',{ifAvailable:true},async lock=>{
  if(lock)for(const s of await journal.sessions())if(s.state==='recording')await journal.save({...s,state:'interrupted',interrupted:true});
});
try{const saved=JSON.parse(sessionStorage.getItem('yod-meetings-connection'));if(saved){config={...saved,server:endpoint(saved.server)};$('server').value=config.server;}}catch{}
window.addEventListener('beforeunload',e=>{if(recorder.active||recorder.unsaved?.length){e.preventDefault();e.returnValue='';}});
window.addEventListener('online',()=>void sync());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&recorder.active){recorder.notice='La ventana pasó a segundo plano: comprueba que sigue entrando audio al volver. En web no se garantiza continuidad.';paint();}});
setInterval(()=>void sync(),30000);setInterval(()=>void renderSessions().catch(showError),15000);
await renderSessions();paint();void sync();

// Drive location belongs to this browser, never to the public source code.
try { $('drive-folder').value=localStorage.getItem('yod-meetings-drive')||''; } catch {}
$('save-drive').onclick=()=>{try { const url=driveFolder($('drive-folder').value.trim());localStorage.setItem('yod-meetings-drive',url);$('drive-folder').value=url;text($('handoff-status'),'Carpeta guardada en este dispositivo. Google comprobará tu acceso al abrirla.'); } catch(error){text($('handoff-status'),error.message);} };
$('open-drive').onclick=()=>{try {window.open(driveFolder($('drive-folder').value.trim()),'_blank','noopener,noreferrer');}catch(error){text($('handoff-status'),error.message);} };
$('copy-request').onclick=async()=>{try { const value=handoffText($('meeting-kind').value==='initial'?null:$('project').value.trim(),$('drive-folder').value.trim(),captureContext());$('request-text').value=value;$('request-text').hidden=false;try {await navigator.clipboard.writeText(value);text($('handoff-status'),'Encargo copiado. Pégalo en esta conversación y adjunta el audio o indica su nombre en Drive.');}catch{text($('handoff-status'),'Selecciona y copia el encargo de abajo; pégalo en esta conversación.');} }catch(error){text($('handoff-status'),error.message);} };

mountReview($('proposal-review'));
