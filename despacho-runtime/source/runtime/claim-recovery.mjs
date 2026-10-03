// A claim that was not acknowledged has not invoked the executor. Reusing its
// durable ID is safe; uncertainty after execution must remain stopped for review.
export function canResumeClaim(result,claimId){
 return result?.state==='unconfirmed'&&result.diagnostic?.code==='claim_unconfirmed'
  &&result.claim_request_id===claimId&&!result.job_id&&!result.completion_id;
}

export async function recoverClaim(createWorker,{pause=()=>new Promise(r=>setTimeout(r,5000))}={}){
 for(let attempt=0;attempt<2;attempt++){
  const result=await createWorker().runOnce();
  if(result.state!=='unconfirmed'||result.diagnostic?.code!=='claim_unconfirmed'||attempt===1)return result;
  await pause();
 }
}
