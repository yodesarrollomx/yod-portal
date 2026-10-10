// Presentation only. These labels never grant access or confirm a business write.
export function voiceView(state = {}) {
  const live = !['idle','error'].includes(state.phase);
  const listening = state.phase === 'listening';
  const titles = {idle:state.working_without_voice?'Trabajando sin voz':state.paused?'En pausa (toca para seguir)':state.finalized?'Conversación finalizada':'Disponible para conversar',
    error:'No se pudo conectar',starting:'Conectando voz',listening:state.muted?'En llamada · micrófono silenciado':'En llamada',
    reconnecting:'Recuperando conexión',closing:'Finalizando conversación'};
  let context = !live ? 'El expediente se comprueba al conectar. Las tareas conservan su estado.' :
    state.mode === 'basic' ? 'Conversación básica: sin acceso a datos ni herramientas del expediente.' :
    state.context_phase === 'ready' && state.tools_ready ? 'Expediente conectado. Herramientas autorizadas disponibles.' :
    state.context_phase === 'unavailable' ? 'Expediente pendiente. Puedes conversar; los datos y acciones del proyecto aún no están disponibles.' :
    state.context_phase === 'installing' ? 'Confirmando acceso a las herramientas del expediente…' :
    'Cargando expediente en segundo plano. Sus datos todavía no están confirmados.';
  if (state.phase === 'closing') context = 'Cerrando la conversación. Las tareas mantienen su propio seguimiento.';
  const blocks = Number.isSafeInteger(state.blocks) && state.blocks > 0 ? state.blocks : 0;
  const saved = Number.isSafeInteger(state.saved) && state.saved >= 0 ? Math.min(state.saved,blocks) : 0;
  const pending = Number.isSafeInteger(state.pending) && state.pending > 0 ? state.pending : 0;
  let history = state.incomplete ? 'Cierre o guardado sin confirmar. Conserva esta transcripción y revisa el historial antes de repetir un encargo.' :
    state.status_pending ? 'No se pudo comprobar el guardado. Esto no corta una conexión de voz sana.' :
    pending ? 'Guardado pendiente. '+saved+' de '+blocks+' bloques confirmados; no repitas el encargo para guardarlo.' :
    blocks ? saved+' de '+blocks+' bloques confirmados'+(state.finalized && saved===blocks?'. Conversación respaldada.':'; el resto se comprueba al finalizar.') :
    state.fragments ? 'Transcripción recibida. El guardado todavía no está confirmado.' :
    'Aquí aparecerá la confirmación de guardado; recibir texto no significa que ya esté guardado.';
  return {live,listening,title:titles[state.phase]||'Comprobando conversación',context,history,
    startLabel:state.paused?'Toca para seguir':state.phase==='error'?'Volver a intentar':state.finalized||state.incomplete?'Nueva conversación':'Iniciar conversación',
    stopLabel:state.phase==='starting'?'Cancelar conexión':state.phase==='closing'?'Finalizando…':'Finalizar conversación',
    audioBlocked:live && state.playback_blocked === true,
    retryContext:listening && state.context_phase === 'unavailable'};
}

// Canonical goal snapshots drive workspace notices, never voice lifetime or permissions.
export function createVoiceGoalView(){
 let previous=new Map();
 return {reset(){previous.clear();},update(goals=[]){
  const ready=goals.find(g=>['ready_for_review','awaiting_data','completed'].includes(g.status)&&['queued','running'].includes(previous.get(g.goal_id)));
  previous=new Map(goals.map(g=>[g.goal_id,g.status]));
  return {working:goals.some(g=>['queued','running'].includes(g.status)),notice:ready?'Hay un resultado disponible. Abre Pendientes para revisarlo.':''};
 }};
}
