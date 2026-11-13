// Presentation-only projection. The authenticated private service owns derivation.
export function validateAutonStatus(raw,caseId,now=Date.now()){
 const fail=()=>{throw Error('invalid_auton_status');};
 if(!raw||raw.ok!==true||raw.schema!==1||raw.case_id!==caseId)fail();
 const {admission,activity,library_only}=raw;
 if(!['alta','standby','baja','unconfirmed'].includes(admission))fail();
 if(!['working','waiting','presenting','unconfirmed',null].includes(activity))fail();
 if(admission==='alta'?activity===null:!['unconfirmed',null].includes(activity))fail();
 if(typeof library_only!=='boolean'||library_only!==(admission==='baja'))fail();
 const at=Date.parse(raw.observed_at);
 if(!Number.isFinite(at)||at>now+5000||now-at>90000)fail();
 if(typeof raw.reason!=='string'||!/^[a-z][a-z0-9_]{0,95}$/.test(raw.reason))fail();
 const bounded=v=>typeof v==='string'&&v.length<=240&&!/[\u0000-\u001f]/.test(v);
 if(!bounded(raw.source_ref)||!bounded(raw.source_revision))fail();
 return {schema:1,case_id:caseId,admission,activity,reason:raw.reason,source_ref:raw.source_ref,source_revision:raw.source_revision,observed_at:raw.observed_at,library_only};
}
