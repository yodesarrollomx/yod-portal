
// Prototype message state only. Partial speech and typed input share a single turn record.
export function updateTurn(state,event){
 if(!event||event.case_id!==state.case_id||!event.id||!['user','agent'].includes(event.who)||!Number.isInteger(event.seq)||event.seq<0||typeof event.text!=='string'||!['partial','final','cancelled'].includes(event.phase))return false;
 const prior=state.messages.find(m=>m.id===event.id);
 if(prior){
  if(prior.who!==event.who||prior.case_id&&prior.case_id!==event.case_id||event.seq<=(prior.seq??-1)||prior.phase==='final'||prior.phase==='cancelled')return false;
  prior.text=event.text;prior.seq=event.seq;prior.phase=event.phase;prior.input_kind=event.input_kind||prior.input_kind||'text';return true;
 }
 state.messages.push({id:event.id,case_id:event.case_id,who:event.who,text:event.text,seq:event.seq,phase:event.phase,input_kind:event.input_kind||'text',...(event.source_id?{source_id:event.source_id}:{}),scenario_id:event.scenario_id});
 return true;
}
