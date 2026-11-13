// Best-effort background election; no authorization, payloads or distributed write lock.
export function createTabContinuity({id,channel=null,now=()=>Date.now(),onPause=()=>{},onWake=()=>{},onDirty=()=>{},
 schedule=setTimeout,cancel=clearTimeout,heartbeatMs=5000,leaseMs=15000}={}){
 if(typeof id!=='string'||!id||id.length>100)throw Error('invalid_tab_id');
 let visible=true,online=true,closed=false,leader=true,timer=null,wake=null,lastDirty=-Infinity;
 const peers=new Map();
 const send=type=>{try{channel?.postMessage({version:1,type,id});}catch{}};
 function elect(){
  for(const [key,at] of peers)if(now()-at>=leaseMs||now()<at)peers.delete(key);
  leader=![...peers.keys()].some(key=>key<id);
  onPause(!visible||!online||!leader);
 }
 function requestWake(){
  if(closed||!visible||!online||wake!==null)return;
  wake=schedule(()=>{wake=null;if(!closed&&visible&&online)onWake();},200);
 }
 function tick(){if(closed)return;if(visible&&online)send('pulse');elect();timer=schedule(tick,heartbeatMs);}
 function receive(event){
  const m=event.data;
  if(!m||Object.keys(m).sort().join(',')!=='id,type,version'||m.version!==1||typeof m.id!=='string'||!m.id||m.id.length>100||m.id===id)return;
  if(m.type==='pulse'){if(peers.size<64||peers.has(m.id))peers.set(m.id,now());elect();}
  else if(m.type==='bye'){peers.delete(m.id);elect();}
  else if(m.type==='dirty'&&now()-lastDirty>=1000){lastDirty=now();onDirty();requestWake();}
 }
 if(channel)channel.onmessage=receive;
 tick();
 return Object.freeze({
  state(next){const was=visible&&online;visible=next.visible;online=next.online;
   if(!visible||!online){send('bye');if(wake!==null){cancel(wake);wake=null;}}
   else{send('pulse');if(!was)requestWake();}elect();},
  changed(){send('dirty');requestWake();},
  snapshot:()=>({leader,visible,online,peers:peers.size}),
  close(){closed=true;send('bye');cancel(timer);if(wake!==null)cancel(wake);if(channel){channel.onmessage=null;channel.close();}peers.clear();}
 });
}
