// This module never uploads audio or calls a paid API.
export function driveFolder(value) {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='drive.google.com'||url.username||url.password||url.port||!/^\/drive\/(?:u\/\d+\/)?folders\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))throw Error('Pega el enlace de una carpeta de Google Drive.');
  return url.origin+url.pathname.replace(/\/$/,'');
}
export function audioExtension(mime) {
  return mime.includes('mp4')?'m4a':mime.includes('wav')?'wav':mime.includes('mpeg')?'mp3':mime.includes('ogg')?'ogg':'webm';
}
export function handoffText(project,folder='',context={}) {
  if(project!==null&&!/^[A-Za-z0-9_-]{1,100}$/.test(project))throw Error('Selecciona el identificador del proyecto.');
  return `Procesa mi reunión ${project?'del proyecto '+project:'inicial, sin PPP (no crees un proyecto)'} con el flujo privado de reuniones y Whisper ya instalado. ${folder?'Carpeta privada: '+driveFolder(folder)+'. ':'Usa el audio que adjunto o el enlace privado que compartiré. '}Usa los conectores existentes, sin API de pago ni nuevas suscripciones. Conserva el original. Entrega transcripción con tiempos, minuta, decisiones confirmadas, propuestas, pendientes con evidencia y preguntas abiertas. No inventes responsables ni fechas. Archiva audio, transcripción y minuta en una carpeta individual de la reunión, dentro del proyecto autorizado; si no hay PPP, usa Conversaciones iniciales. Conserva el meeting_id de la ficha de captura. Entrega además una ficha yod-meeting-delivery/v1 con referencias Drive verificadas y pendientes en estado proposed, para incorporarla al historial del agente y seleccionar la lista para autorizar en MOAC. No des por archivado en el agente hasta comprobar su recibo. Si hay varios audios nuevos, identifica el que corresponde al proyecto antes de procesar. No envíes a terceros ni publiques la reunión.`;
}
export async function shareFile(file,navigatorObject=navigator) {
  if(!navigatorObject.canShare?.({files:[file]}))throw Error('Este navegador no permite compartir archivos. Usa Descargar audio y súbelo desde Drive.');
  await navigatorObject.share({files:[file],title:'Audio de la reunión'});
  // A dismissed share sheet is not a verified Drive upload.
  return 'Compartir terminó. Comprueba en Drive que el archivo abre; todavía no hay un recibo de respaldo verificado.';
}
