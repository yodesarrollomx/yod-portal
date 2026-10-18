// Speech recognition starts only inside the human's button click. Nothing is sent to the task transport here.
export function bindTeamDictation({button, textarea, status, host = globalThis, canStart = () => true}) {
  const Recognition = host.SpeechRecognition || host.webkitSpeechRecognition;
  let active = null, destroyed = false;
  function stop() { if (active) { const previous=active; active=null; previous.abort(); } button.textContent='Dictar'; button.setAttribute('aria-pressed','false'); }
  if (!Recognition) {
    button.disabled=true;
    status.textContent='Puedes escribir o usar el dictado del teclado de tu dispositivo.';
    return {stop,dispose:() => {destroyed=true;}};
  }
  function click() {
    if (active) { stop(); return; }
    if (destroyed || !canStart()) return;
    const recognition = new Recognition();
    recognition.lang='es-MX'; recognition.continuous=false; recognition.interimResults=false;
    let consumed=0;
    active=recognition; button.textContent='Detener dictado'; button.setAttribute('aria-pressed','true');
    status.textContent='Escuchando. Revisa el texto antes de enviarlo.';
    recognition.onresult=event => {
      if (destroyed || active!==recognition || !canStart()) return;
      const parts=[];
      for (let i=Math.max(consumed,event.resultIndex || 0);i<event.results.length;i++) {
        if (event.results[i].isFinal) { parts.push(event.results[i][0].transcript); consumed=i+1; }
      }
      if (parts.length) {
        const addition=(textarea.value && !/\s$/.test(textarea.value)?' ':'')+parts.join(' ');
        if (textarea.value.length+addition.length>12000) { status.textContent='Llegaste al límite del texto; revisa lo escrito.'; stop(); return; }
        textarea.value+=addition;
        textarea.dispatchEvent(new Event('input',{bubbles:true}));
      }
    };
    recognition.onerror=() => { if(active!==recognition)return; status.textContent='No se pudo dictar. Puedes seguir escribiendo.'; stop(); };
    recognition.onend=() => { if(active!==recognition)return; active=null;button.textContent='Dictar';button.setAttribute('aria-pressed','false');status.textContent='Revisa y edita el texto antes de enviarlo.'; };
    try { recognition.start(); } catch { status.textContent='No se pudo iniciar el micrófono. Puedes escribir.'; stop(); }
  }
  button.addEventListener('click',click);
  return {stop,dispose(){destroyed=true;stop();button.removeEventListener('click',click);}};
}
