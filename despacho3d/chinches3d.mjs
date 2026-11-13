import {mountChincheUI} from './chinches-ui.mjs?v=126';
let instance=null;
const BOARD_ORIGIN=location.origin;
const ZONES=new Set(['editing','editorial','funnel','entry','reception','patio','potential','case','projects','delivery','decisions','lounge']);
const MODEL_VERSION='despacho-v2';

export function createChinches3D(options){
  if(instance){instance.configure(options);return instance;}
  let {readView,readZone=()=> 'entry',closeSheets=()=>{},onChange=()=>{}}=options;
  let ready=false,selectedZone=null,pending=null,timeout=null;
  const bar=document.createElement('div');
  bar.id='pin-selection';bar.hidden=true;
  const notice=document.createElement('span');notice.setAttribute('role','status');
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';
  bar.append(notice,cancel);document.querySelector('#workspace').append(bar);
  cancel.onclick=()=>stop();
  function setNotice(text){notice.textContent=text;bar.hidden=false;}
  function stop(){selectedZone=null;pending=null;clearTimeout(timeout);bar.hidden=true;uiController?.stop();onChange(false);}
  function refreshButtons(){document.querySelectorAll('[data-office-pin]').forEach(b=>b.disabled=!ready||(b.dataset.officePin==='zone'&&readView().mode==='map'));}
  function announce(){if(window.parent!==window)window.parent.postMessage({type:'yod:despacho:hello',version:1},BOARD_ORIGIN);}
  function snapshot(zone,kind,point,ui){
    const view=readView();
    return {type:'yod:despacho:pin',version:ui?2:1,requestId:crypto.randomUUID(),
      target:{id:(kind==='interface'?'panel:':'zone:')+zone,zone,kind,point,...(ui?{ui}:{})},
      view:{position:view.position,quaternion:view.quaternion,fov:view.fov,mode:view.mode,...(view.orthographic?{orthographic:{...view.orthographic}}:{})},
      modelVersion:MODEL_VERSION,viewport:{width:innerWidth,height:innerHeight}};
  }
  function send(zone,kind,point,ui){
    if(!ready||!ZONES.has(zone)||pending)return false;
    const request=snapshot(zone,kind,point,ui);
    // A selection delegated by the shared composer must end in both documents.
    // Do this before setting pending: the parent's exit also calls our adapter's stop().
    try{window.parent.YODChinche?.salirSenalar?.();}catch{}
    selectedZone=null;pending=request.requestId;uiController.stop();onChange(false);
    setNotice('Abriendo la chinche en tu tablero…');cancel.hidden=false;cancel.textContent='Ocultar aviso';
    window.parent.postMessage(request,BOARD_ORIGIN);
    clearTimeout(timeout);timeout=setTimeout(()=>{
      if(pending!==request.requestId)return;
      pending=null;setNotice('No recibimos confirmación. Vuelve al tablero y señala el cambio otra vez.');
    },5000);
    return true;
  }
  function bindPanel(zone){
    if(!ZONES.has(zone))return;
    uiController.setPanelZone(zone);
    const section=document.createElement('div');section.className='pin-actions';
    const buttons=[['zone','Señalar cambio en el espacio'],['interface','Pedir cambio en esta ficha']];
    for(const [kind,label]of buttons){
      const b=document.createElement('button');b.type='button';b.dataset.officePin=kind;b.textContent=label;b.disabled=!ready||(kind==='zone'&&readView().mode==='map');
      b.onclick=()=>{
        if(!ready||kind==='zone'&&readView().mode==='map')return;
        if(kind==='interface'&&readView().mode==='map'){uiController.pinNode(document.getElementById('panel'));return;}
        closeSheets();
        if(kind==='interface'){send(zone,kind,null);return;}
        selectedZone=zone;pending=null;cancel.hidden=false;cancel.textContent='Cancelar';
        setNotice('Toca el lugar que quieres cambiar.');onChange(true);
      };
      section.append(b);
    }
    const p=document.createElement('p');p.className='note';
    p.textContent=ready?'Describe y clava el cambio en la ventana habitual de tu tablero.':'Las chinches se habilitan al entrar desde Despacho en YOD OS.';
    section.append(p);document.querySelector('#panel-body').append(section);
  }
  function selectPoint(point,hitZone){
    if(!selectedZone||!ready||readView().mode==='map')return false;
    if(!Array.isArray(point)||point.length!==3||point.some(n=>!Number.isFinite(n)))return false;
    return send(ZONES.has(hitZone)?hitZone:selectedZone,'zone',point.map(n=>Math.round(n*1000)/1000));
  }
  function onMessage(event){
    if(window.parent===window||event.source!==window.parent||event.origin!==BOARD_ORIGIN)return;
    const d=event.data;
    if(!d||d.version!==1)return;
    const keys=Object.keys(d);
    if(d.type==='yod:despacho:ready'||d.type==='yod:despacho:disabled'){if(keys.length!==2||!keys.includes('type')||!keys.includes('version'))return;}
    else if(d.type==='yod:despacho:pin-ack'){if(keys.length!==4||!['type','version','requestId','status'].every(k=>keys.includes(k)))return;}
    else return;
    if(d.type==='yod:despacho:ready'){
      ready=true;uiController.setReady(true);refreshButtons();document.querySelectorAll('.pin-actions .note').forEach(p=>p.textContent='Describe y clava el cambio en la ventana habitual de tu tablero.');return;
    }
    if(d.type==='yod:despacho:disabled'){
      ready=false;stop();uiController.setReady(false);refreshButtons();return;
    }
    if(d.type==='yod:despacho:pin-ack'&&d.requestId===pending){
      clearTimeout(timeout);pending=null;
      if(d.status==='composer_opened'){setNotice('Chinche abierta en tu tablero. Describe ahí qué quieres cambiar.');cancel.textContent='Cerrar';}
      else setNotice('No pudimos abrir la chinche. Revisa tu acceso en el tablero.');
    }
  }
  const uiController=mountChincheUI({send:(zone,ui)=>send(zone,'interface',null,ui),onSelecting:active=>{if(active)stop();onChange(active);},onSceneStart:()=>{
    if(!ready||readView().mode==='map')return false;
    selectedZone=ZONES.has(readZone())?readZone():'entry';pending=null;setNotice('Toca el lugar que quieres cambiar.');onChange(true);return true;
  },bar});
  window.addEventListener('message',onMessage);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(selectedZone||pending))stop();});
  window.addEventListener('pagehide',()=>{ready=false;stop();uiController.setReady(false);refreshButtons();});
  window.addEventListener('yod-office-view-unavailable',()=>{stop();refreshButtons();});
  window.addEventListener('pageshow',e=>{if(e.persisted)announce();});
  const adapter=window.YODChinche||(window.YODChinche={});
  adapter.senalar=()=>ready?uiController.startGlobal():false;adapter.salirSenalar=stop;
  announce();
  instance={bindPanel,selectPoint,stop,isSelecting:()=>!!selectedZone,configure:options=>{readView=options.readView;readZone=options.readZone||(()=> 'entry');closeSheets=options.closeSheets||(()=>{});onChange=options.onChange||(()=>{});refreshButtons();}};
  return instance;
}
