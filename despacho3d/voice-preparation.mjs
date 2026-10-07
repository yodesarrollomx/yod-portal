// Local WebRTC preparation only: no capture, provider session or business operation.
export function createVoicePreparation({Peer,gather,now=Date.now,ttl=60000}={}){
 let entry=null;
 function discard(){const old=entry;entry=null;if(!old)return;clearTimeout(old.timer);old.channel?.close?.();old.peer.close();}
 async function warm(caseId){
  if(!caseId||typeof Peer?.prototype?.addTransceiver!=='function')return null;
  if(entry?.caseId===caseId&&now()-entry.createdAt<ttl)return entry.promise;
  discard();
  const candidate={caseId,createdAt:now(),peer:new Peer()};entry=candidate;
  candidate.timer=setTimeout(discard,ttl);candidate.timer?.unref?.();
  candidate.promise=(async()=>{
   try{
    candidate.sender=candidate.peer.addTransceiver('audio',{direction:'sendrecv'}).sender;
    candidate.channel=candidate.peer.createDataChannel('oai-events');
    await candidate.peer.setLocalDescription(await candidate.peer.createOffer());
    await gather(candidate.peer);
    if(entry!==candidate||now()-candidate.createdAt>=ttl)return null;
    return candidate;
   }catch{if(entry===candidate)discard();return null;}
  })();
  return candidate.promise;
 }
 async function take(caseId){
  if(entry?.caseId!==caseId){discard();return null;}
  const candidate=entry,result=await candidate.promise;
  if(!result||entry!==candidate||now()-candidate.createdAt>=ttl){if(entry===candidate)discard();return null;}
  clearTimeout(candidate.timer);entry=null;return candidate;
 }
 return {warm,take,discard};
}
