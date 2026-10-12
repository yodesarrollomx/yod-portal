import {Journal,synchronize,endpoint} from './journal.mjs';
import {MeetingRecorder} from './recorder.mjs';
const $=id=>document.getElementById(id),journal=await new Journal().open();
const recorder=new MeetingRecorder(journal,paint);
let config=null,syncing=false,currentStatus=null;
const project=new URL(location.href).searchParams.get('case_id');
if(project&&/^[A-Za-z0-9_-]{1,100}$/.test(project))$('project').value=project;
if(/iPhone|iPad/.test(navigator.userAgent)&&project&&/^[A-Za-z0-9_-]{1,100}$/.test(project)) {
  $('iphone').hidden=false;$('iphone').href='yodmeeting://record?case_id='+encodeURIComponent(project);
  $('iphone').title='Requiere instalar primero YOD Reuniones en el iPhone.';
}
const text=(node,value)=>node.textContent=value;
function paint() {
  const active=recorder.active,paused=recorder.recorder?.state==='paused';
  document.body.dataset.recording=String(active&&!paused);
  $('project').disabled=active;$('start').disabled=active;$('pause').disabled=!active;$('stop').disabled=!active;
  text($('pause'),paused?'Continuar':'Pausar');
  text($('phase'),active?(paused?'En pausa':'Grabando · '+Math.floor((recorder.session?.duration||0)/60)+' min guardados'):'Lista para grabar');
  $('level').value=recorder.level||0;
  if(recorder.notice)text($('notice'),recorder.notice);
  else if(recorder.silent&&active&&!paused)text($('notice'),'No se detecta sonido desde hace 20 segundos. Comprueba el micrófono.');
}
function download(blob,name) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function exportSession(s) {
  const chunks=await journal.chunks(s.id),extras=recorder.session?.id===s.id?recorder.unsaved||[]:[];
  const ext=s.mime.includes('mp4')?'m4a':s.mime.includes('ogg')?'ogg':'webm';
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
    const title=document.createElement('h3');title.textContent=s.project+' · '+new Date(s.created).toLocaleString('es-MX');
    const state=document.createElement('p');state.textContent=`${chunks.length} fragmentos guardados en este dispositivo · ${remote} con acuse del servidor. ${s.state==='interrupted'?'Grabación interrumpida: revisar el final.':s.state==='recording'?'Grabando.':'Captura finalizada.'}`;
    const actions=document.createElement('div');actions.className='actions';actions.append(button('Descargar audio',()=>exportSession(s)));
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
      currentStatus=await synchronize(journal,s,config);renderFeedback(currentStatus);
    }
    text($('connection'),'Conectado. Los acuses verifican fragmentos; Drive se confirma por separado.');
  }catch(e){text($('connection'),e.message+' El audio local se conserva. Se reintentará.');}
  finally{syncing=false;await renderSessions();}
}
$('start').onclick=async()=>{try{recorder.notice='';text($('notice'),'');await recorder.start($('project').value.trim());if(!recorder.persistent)text($('notice'),'El navegador no concedió almacenamiento persistente. Descarga una copia al terminar.');await renderSessions();}catch(e){showError(e);}};
$('pause').onclick=()=>recorder.recorder?.state==='paused'?recorder.resume():recorder.pause();
$('stop').onclick=async()=>{await recorder.stop();await renderSessions();await sync();};
$('refresh').onclick=()=>renderSessions().catch(showError);
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
