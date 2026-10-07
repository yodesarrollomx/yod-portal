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
