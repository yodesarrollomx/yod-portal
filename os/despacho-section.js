(function(root){
  'use strict';
  // Escena estática del mismo portal: no recibe sesión, rutas ni datos del OS.
  var FRAME_PATH='../despacho3d/index.html?v=entrada100';
  function create(options){
    var win=options.window,doc=options.document,host=doc.getElementById('seccionDespacho'),
        canvas=doc.getElementById('despachoCanvas'),status=doc.getElementById('despachoEstado'),
        open=doc.getElementById('despachoAbrir'),tray=doc.getElementById('despachoBandeja'),
        frame=null,mountedEpoch=null,suspended=false;
    if(!host||!canvas||!status||!open||!tray)throw new Error('Sección Despacho incompleta');
    function active(){return win.location.hash==='#/despacho';}
    function access(){return options.readAccess();}
    function authorized(){var a=access();return !suspended&&active()&&a.ready===true&&a.allowed===true;}
    function teardown(){
      var tools=doc.getElementById('despachoTools');if(tools)tools.removeAttribute('open');
      if(frame){frame.removeAttribute('src');frame.remove();frame=null;}
      mountedEpoch=null;
      if(options.onTeardown)options.onTeardown();
    }
    function paint(){
      var a=access(),on=active(),ok=authorized();
      host.hidden=!on;
      if(on)doc.body.setAttribute('data-workspace-route','despacho');else doc.body.removeAttribute('data-workspace-route');
      doc.querySelectorAll('#nav-modules a').forEach(function(link){if(link.getAttribute('href')==='#/despacho')link.classList.toggle('activo',on);});
      var home=doc.querySelector('.nav-item[href="#inicio"]');
      var internal=on||/^#\/embudo(\/|$)/.test(win.location.hash||'');
      if(home){home.classList.toggle('nav-item-activo-off',internal);home.classList.toggle('activo-no',internal);}
      open.hidden=tray.hidden=!ok;
      if(!ok){
        teardown();open.removeAttribute('href');
        status.hidden=false;status.textContent=a.ready?'El Despacho no está incluido en los permisos de esta cuenta.':'Valida tu acceso a YOD OS para abrir El Despacho.';
        return;
      }
      open.href=FRAME_PATH;
      if(frame&&mountedEpoch!==a.epoch)teardown();
      if(!frame){
        status.hidden=false;status.textContent='Abriendo la oficina…';
        frame=doc.createElement('iframe');
        frame.id='despachoFrame';frame.title='El Despacho · oficina 3D';
        frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('allow','fullscreen; microphone; autoplay');
        var current=frame;
        frame.addEventListener('load',function(){if(frame===current&&authorized())status.hidden=true;});
        frame.setAttribute('src',FRAME_PATH);canvas.appendChild(frame);mountedEpoch=a.epoch;
      }
    }
    [open,tray].forEach(function(link){link.addEventListener('click',function(event){if(!authorized()){event.preventDefault();paint();}});});
    win.addEventListener('hashchange',paint);win.addEventListener('popstate',paint);
    // Una página congelada no conserva un marco autorizado entre personas.
    win.addEventListener('pagehide',function(){suspended=true;teardown();});
    win.addEventListener('pageshow',function(e){if(e.persisted){suspended=false;if(options.revalidate)options.revalidate();else teardown();}});
    paint();
    return Object.freeze({refresh:paint,teardown:teardown,isAuthorized:authorized,getIframeWindow:function(){return frame&&authorized()&&mountedEpoch===access().epoch?frame.contentWindow:null;}});
  }
  root.YodDespachoSection=Object.freeze({create:create});
})(typeof globalThis!=='undefined'?globalThis:this);
