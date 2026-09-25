/* YOD Obra · cálculos puros (sin DOM). Se prueban con `node verify-obra-app.cjs`.
   REGLA: el avance global no lo escribe nadie. Sale de lo ejecutado contra lo presupuestado:
   cada concepto pesa lo que vale su importe. Si una unidad no tiene precios todavía,
   sus conceptos pesan igual (promedio simple) y se marca «sin costear». */
(function(root){
  'use strict';
  var n=function(v){v=Number(v);return isFinite(v)?v:0;};

  /* avance de un grupo de conceptos: {avance 0..1, importe, ejecutado, costeado} */
  function avanceDe(conceptos){
    var imp=0,eje=0,suma=0,cuantos=0;
    (conceptos||[]).forEach(function(c){
      var i=n(c.importe), cant=n(c.cantidad), hecho=n(c.cant_ejecutada), pu=n(c.precio_unitario);
      var p=c.avance_pct!=null&&c.avance_pct!==''?n(c.avance_pct):(cant>0?hecho/cant:0);
      p=Math.max(0,Math.min(1,p));
      if(i>0){imp+=i;eje+=(pu>0&&cant>0?Math.min(hecho,cant)*pu:p*i);}
      suma+=p;cuantos++;
    });
    if(imp>0) return {avance:Math.min(1,eje/imp),importe:imp,ejecutado:eje,costeado:true,n:cuantos};
    return {avance:cuantos?suma/cuantos:0,importe:0,ejecutado:0,costeado:false,n:cuantos};
  }

  /* agrupa los conceptos del motor por unidad (columna «frente») */
  function unidades(board){
    var grupos={};
    (board&&board.conceptos||[]).forEach(function(c){
      var u=String(c.frente||'Sin unidad').trim()||'Sin unidad';
      (grupos[u]=grupos[u]||[]).push(c);
    });
    var frenos=(board&&board.restricciones)||[];
    return Object.keys(grupos).sort(function(a,b){return a.localeCompare(b,'es',{numeric:true});}).map(function(u){
      var a=avanceDe(grupos[u]);
      a.unidad=u;a.conceptos=grupos[u];
      a.frenos=frenos.filter(function(r){return r.frente===u&&String(r.estado||'ABIERTA').toUpperCase()!=='CERRADA';}).length;
      return a;
    });
  }

  /* avance global: suma ponderada de TODOS los conceptos (no promedio de unidades) */
  function global(board){ return avanceDe(board&&board.conceptos||[]); }

  function estado(u){
    if(u.frenos) return 'freno';
    if(u.avance>=0.999) return 'terminado';
    if(u.avance>0) return 'en curso';
    return 'sin empezar';
  }

  /* lo que espera a alguien: firma de avances, con días de espera */
  function fechaAvance(a){return a.fecha_verificado||a.verificado_en||a.fecha_propuesta||a.propuesto_en||a.fecha||a.timestamp||a.creado||'';}
  function dias(f,hoy){
    if(!f) return 0;
    var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(f));
    var d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date(f);
    if(isNaN(d)) return 0;
    return Math.max(0,Math.floor(((hoy||Date.now())-d)/86400000));
  }
  function pendientes(board,rol,quien,hoy){
    var av=(board&&board.avances)||[], r=String(rol||'').toUpperCase();
    var mios=av.filter(function(a){
      if(r==='AUTORIZA') return a.estado==='VERIFICADO'||a.estado==='PROPUESTO';
      if(r==='VERIFICA') return a.estado==='PROPUESTO'&&a.propuesto_por!==quien;
      return false;
    }).map(function(a){return {tipo:'firma',id:a.id,titulo:(a.frente||'—')+' · '+(a.estado==='PROPUESTO'?'por verificar':'por autorizar'),dias:dias(fechaAvance(a),hoy),monto:n(a.monto_propuesto)};});
    var fr=((board&&board.restricciones)||[]).filter(function(x){return String(x.estado||'ABIERTA').toUpperCase()!=='CERRADA';})
      .map(function(x){return {tipo:'freno',id:x.id,titulo:'Freno: '+x.titulo+(x.frente?' · '+x.frente:''),dias:dias(x.fecha||x.creado,hoy)};});
    return mios.concat(fr).sort(function(a,b){return b.dias-a.dias;});
  }
  function colaFirma(board,hoy){
    var av=(board&&board.avances)||[];
    function tramo(est){var l=av.filter(function(a){return a.estado===est;});
      return {n:l.length,viejo:l.reduce(function(m,a){return Math.max(m,dias(fechaAvance(a),hoy));},0)};}
    return {verificar:tramo('PROPUESTO'),autorizar:tramo('VERIFICADO')};
  }

  /* folio hijo de una unidad: PRJ-ALYSA·C07 */
  function folioUnidad(folio,unidad){
    var u=String(unidad||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9-]+/g,'-').replace(/^-|-$/g,'');
    return String(folio||'').toUpperCase()+'·'+u;
  }

  /* alta de obra: renglones de CONCEPTOS para el Sheet (unidad × partida) */
  function plantilla(tipo,listaUnidades,partidas){
    var filas=[];
    (listaUnidades||[]).forEach(function(u){
      (partidas||[]).forEach(function(p,i){
        filas.push({id:folioUnidad('',u).slice(1)+'-'+String(i+1).padStart(2,'0'),frente:u,descripcion:p,cantidad:1,unidad:'lote',precio_unitario:''});
      });
    });
    return filas;
  }
  /* «C1..C15», «D-101..D-104», «A, B, C» → lista */
  function expandeUnidades(txt){
    var out=[];
    String(txt||'').split(/[,\n;]+/).map(function(s){return s.trim();}).filter(Boolean).forEach(function(s){
      var m=/^(.*?)(\d+)\s*\.\.\s*(?:\1)?(\d+)$/.exec(s);
      if(m){var a=+m[2],b=+m[3],w=m[2].length;if(b>=a&&b-a<500){for(var i=a;i<=b;i++) out.push(m[1]+String(i).padStart(w,'0'));return;}}
      out.push(s);
    });
    return out.filter(function(v,i,l){return l.indexOf(v)===i;});
  }

  /* gasto repetido: misma factura, o mismo importe y concepto el mismo día */
  function gastoDuplicado(movs,nuevo){
    var f=String(nuevo.factura||'').trim().toUpperCase();
    return (movs||[]).find(function(m){
      if(f&&String(m.factura||'').trim().toUpperCase()===f) return true;
      return n(m.importe)===n(nuevo.importe)&&String(m.fecha||'').slice(0,10)===String(nuevo.fecha||'').slice(0,10)&&
        String(m.concepto||'').trim().toLowerCase()===String(nuevo.concepto||'').trim().toLowerCase();
    })||null;
  }

  /* el cliente solo ve lo autorizado de SU unidad */
  function vistaCliente(board,unidad){
    var us=unidades(board), u=us.find(function(x){return x.unidad===unidad;});
    return {global:global(board),unidad:u?{unidad:u.unidad,avance:u.avance,
      partidas:u.conceptos.map(function(c){var a=avanceDe([c]);return {partida:c.descripcion,avance:a.avance};})}:null};
  }

  var api={avanceDe:avanceDe,unidades:unidades,global:global,estado:estado,pendientes:pendientes,colaFirma:colaFirma,
    dias:dias,folioUnidad:folioUnidad,plantilla:plantilla,expandeUnidades:expandeUnidades,gastoDuplicado:gastoDuplicado,vistaCliente:vistaCliente};
  root.YOD_OBRA_CALC=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
