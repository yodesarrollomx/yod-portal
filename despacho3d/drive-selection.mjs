// Navigation preference held in memory only. Never fetches or persists a case.
export function validateDriveSelection(input){
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>120||typeof input.url!=='string'||input.url.length>2000)throw Error('seleccion_invalida');
 const url=new URL(input.url);
 if(url.protocol!=='https:'||url.username||url.password||!['docs.google.com','drive.google.com'].includes(url.hostname))throw Error('enlace_invalido');
 if(!/^\/(?:spreadsheets|document|presentation)\/d\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname)&&!/^\/file\/d\/[A-Za-z0-9_-]+(?:\/|$)/.test(url.pathname))throw Error('enlace_invalido');
 return {name:input.name.trim(),url:url.href};
}
