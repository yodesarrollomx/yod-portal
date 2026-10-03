import {useEffect,useRef} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
export function TerminalPanel({link,state,authorized}:{link:any,state:any,authorized:boolean}){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const term=new Terminal({cursorBlink:true,screenReaderMode:true,scrollback:2500,fontSize:13,theme:{background:'#101b20',foreground:'#f1f0e9'}}),fit=new FitAddon();
  term.loadAddon(fit);term.open(mount.current!);fit.fit();
  const input=term.onData(data=>link.terminal({t:'input',data})),resize=term.onResize(({cols,rows})=>link.terminal({t:'resize',cols,rows}));
  const unsubscribe=link.subscribeTerminal((m:any)=>{if(m.t==='clear'){term.reset();return;}if(m.t==='snapshot'){term.reset();term.resize(m.cols,m.rows);term.write(m.data,()=>fit.fit());}if(m.t==='data')term.write(m.data);if(m.t==='size')term.resize(m.cols,m.rows);});
  const observer=new ResizeObserver(()=>fit.fit());observer.observe(mount.current!);
  return()=>{unsubscribe();observer.disconnect();input.dispose();resize.dispose();term.dispose();};
 },[link,state.status==='connected']);
 const live=state.runtime?.live,mode=state.runtime?.mode,connected=state.status==='connected';
 return <section className="terminal-puesto">
  <div className="terminal-controls">
   {!connected?<button className="btn" disabled={!authorized||state.status!=='disconnected'} onClick={()=>link.connect()}>Conectar mi terminal</button>:<>
    <button className="btn" disabled={live||!state.runtime} onClick={()=>link.control('start')}>Nueva sesión</button>
    <button className="btn" disabled={live||!state.runtime} onClick={()=>link.control('resume')}>Reabrir sesión</button>
    <button className="btn" disabled={live||!state.runtime?.room_link||state.runtime?.needs_review} onClick={()=>link.control('room')}>Atender Despacho</button>
    <button className="btn" disabled={!live} onClick={()=>link.control('stop')}>Detener agente</button>
    <button className="btn" onClick={()=>link.disconnect()}>Desconectar</button>
   </>}
  </div>
  <p className="terminal-notice" role="status">{state.status==='connecting'?'Abriendo la conexión local…':state.status==='approving'?'Confirma la conexión en la ventana local.':connected?mode==='room'?'Motor del Despacho activo · envía los mensajes desde Conversación.':mode==='manual'?'Sesión interactiva · escribe directamente en la terminal.':'Terminal conectada · elige cómo continuar.':'Conecta la terminal desde la misma Chromebook donde está instalado Codex.'}</p>
  {state.error&&<p className="conversation-notice" role="alert">{state.error}</p>}
  {state.runtime?.needs_review&&<p className="conversation-notice">Hay un turno sin confirmar. Revisa su guardado antes de reactivar el motor del Despacho.</p>}
  <div ref={mount} className="terminal-screen" aria-label="Terminal interactiva del puesto"/>
  <p className="muted small">Una sesión a la vez. La sesión manual trabaja en la carpeta del agente; su pantalla y sus cambios no se guardan automáticamente en Sheets. Conserva abierta la ventana de conexión local. Cerrar este panel no detiene el trabajo. Desde el teclado: Ctrl + Mayús + X cierra el panel.</p>
 </section>;
}
