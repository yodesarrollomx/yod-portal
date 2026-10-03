import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createConversationVoice} from '../despacho3d/conversation-voice.mjs';

type SavedResponse = {id:string, role:string, body:string};
type Props = {
 active:boolean;
 contextKey:string;
 disabled?:boolean;
 response:SavedResponse|null;
 onTranscript:(text:string)=>void;
};

export function VoiceControls({active,contextKey,disabled=false,response,onTranscript}:Props){
 const callback=useRef(onTranscript);callback.current=onTranscript;
 const voice=useRef<any>(null);
 const [state,setState]=useState<any>({phase:'idle',notice:'',supportedDictation:false,supportedPlayback:false});
 useLayoutEffect(()=>{
  const current=createConversationVoice({onTranscript:(text:string)=>callback.current(text),onChange:setState});
  voice.current=current;setState(current.snapshot());
  return()=>{current.dispose();if(voice.current===current)voice.current=null;};
 },[]);
 useLayoutEffect(()=>{voice.current?.setContext(contextKey,active&&!disabled);},[active,contextKey,disabled]);
 useEffect(()=>{
  const stop=()=>voice.current?.stop();
  const hidden=()=>{if(document.visibilityState==='hidden')stop();};
  window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',hidden);
  return()=>{window.removeEventListener('pagehide',stop);document.removeEventListener('visibilitychange',hidden);};
 },[]);
 const blocked=disabled||!active||!contextKey;
 const speaking=state.phase==='speaking',listening=state.phase==='starting'||state.phase==='listening';
 return <div className="conversation-voice" aria-label="Voz de la conversación">
  <div className="conversation-voice-buttons">
   <button type="button" className="btn" disabled={blocked||!state.supportedDictation} aria-pressed={listening} onClick={()=>listening?voice.current?.stop('Dictado detenido.'):voice.current?.dictate()}>{listening?'Detener dictado':'Dictar'}</button>
   <button type="button" className="btn" disabled={blocked||!state.supportedPlayback||(!speaking&&!response)} aria-pressed={speaking} onClick={()=>speaking?voice.current?.stop('Lectura detenida.'):voice.current?.speak(response)}>{speaking?'Detener lectura':'Escuchar respuesta'}</button>
  </div>
  {state.notice&&<p className="muted small" role="status">{state.notice}</p>}
  {!state.supportedDictation&&<p className="muted small">El dictado no está disponible en este navegador. Puedes escribir el mensaje.</p>}
  {!state.supportedPlayback&&<p className="muted small">La lectura en voz alta no está disponible en este navegador.</p>}
  {state.supportedDictation&&<p className="muted small">El navegador puede usar su servicio de voz. Revisa el dictado y pulsa Enviar.</p>}
 </div>;
}
