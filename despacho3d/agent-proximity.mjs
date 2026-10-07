// Local interaction only; authority always comes from the current resident selection.
export function createProximityGate({enter=1.8,leave=2.5,dwell=450}={}){
 let identity=null,since=null,latched=false;
 return {
  suppress(caseId){identity=caseId;since=null;latched=true;},
  sample({caseId,distance,visible=false,enabled=false,now=0}={}){
   if(caseId!==identity){identity=caseId;since=null;latched=false;}
   if(!caseId||!Number.isFinite(distance)){since=null;return null;}
   if(distance>=leave){latched=false;since=null;return null;}
   if(latched||!enabled||!visible||distance>enter){since=null;return null;}
   if(since===null){since=now;return null;}
   if(now-since<dwell)return null;
   latched=true;since=null;return caseId;
  }
 };
}

export const ENCOUNTER_RANGE=Object.freeze({prepare:10,release:12,menu:2.6,voice:2,leave:3.2,dwell:450});
// One encounter per deliberate approach. Scene units are metres (walking speed 2.1 m/s).
export function createEncounterGate({menuDistance=ENCOUNTER_RANGE.menu,voiceDistance=ENCOUNTER_RANGE.voice,leaveDistance=ENCOUNTER_RANGE.leave,dwell=ENCOUNTER_RANGE.dwell}={}){
 let identity=null,armed=false,menu=false,voice=false,suppressed=false,since=null;
 const reset=()=>{armed=false;menu=false;voice=false;suppressed=false;since=null;};
 return {
  approach(caseId){if(identity!==caseId){identity=caseId;reset();}if(caseId)armed=true;},
  dismiss(caseId){if(identity===caseId){suppressed=true;since=null;}},
  sample({caseId,distance,enabled=false,visible=false,facing=false,moving=false,agentMoving=false,canTalk=false,now=0}={}){
   if(identity!==caseId){identity=caseId;reset();}
   if(!caseId||!Number.isFinite(distance)){reset();return null;}
   if(distance>=leaveDistance){const close=menu;reset();if(enabled&&moving&&!agentMoving&&distance<ENCOUNTER_RANGE.prepare)armed=true;return close?'leave':null;}
   if(!enabled){since=null;return null;}
   if(moving&&!agentMoving)armed=true;
   if(suppressed||!armed||!visible||agentMoving){since=null;return null;}
   if(distance<=menuDistance&&!menu){menu=true;return 'menu';}
   if(!canTalk||voice||distance>voiceDistance||!facing||moving){since=null;return null;}
   if(since===null){since=now;return null;}
   if(now-since<dwell)return null;
   voice=true;since=null;return 'voice';
  }
 };
}

// Prepare early without recording microphone or starting a provider conversation.
export function createPreparationGate({enter=ENCOUNTER_RANGE.prepare,leave=ENCOUNTER_RANGE.release,retry=30000}={}){
 let id=null,inside=false,last=-Infinity;
 return {sample({caseId,distance,enabled=false,now=0}={}){
  if(id!==caseId){id=caseId;inside=false;last=-Infinity;}
  if(!enabled||!caseId||!Number.isFinite(distance)||distance>=leave){
   const release=inside;inside=false;last=-Infinity;return release?'release':null;
  }
  if(distance<=enter&&(!inside||now-last>=retry)){inside=true;last=now;return 'prepare';}
  return null;
 }};
}
