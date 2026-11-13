// Archive references only: no audio upload, provider call, task creation or PPP mutation.
export const ARCHIVE_SCHEMA='yod-meeting-archive/v1';
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
export function normalizeMeeting(input,caseId) {
 const keys=['meeting_id','case_id','title','occurred_at','summary','source_sha256','archive_url','minutes_url','transcript_url','origin'];
 if(!input||Object.keys(input).length!==keys.length||keys.some(k=>!Object.hasOwn(input,k))||input.case_id!==caseId||
 !/^[a-zA-Z0-9_-]{8,100}$/.test(input.meeting_id)||!text(input.title,160)||!text(input.summary,1600)||
 !['project','initial'].includes(input.origin)||!/^[a-f0-9]{64}$/.test(input.source_sha256)||
 !(input.occurred_at===null||typeof input.occurred_at==='string'&&/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(input.occurred_at)&&Number.isFinite(Date.parse(input.occurred_at))))throw Error('invalid_request');
 const out={};for(const key of keys)out[key]=input[key];
 for(const key of ['archive_url','minutes_url','transcript_url']) {
  if(!text(out[key],500))throw Error('invalid_source');
  let u;try{u=new URL(out[key]);}catch{throw Error('invalid_source');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||!['drive.google.com','docs.google.com'].includes(u.hostname)||
    !/^\/(?:drive\/folders\/[A-Za-z0-9_-]+|file\/d\/[A-Za-z0-9_-]+(?:\/view)?|document\/d\/[A-Za-z0-9_-]+(?:\/edit)?)\/?$/.test(u.pathname))throw Error('invalid_source');
  out[key]=u.origin+u.pathname;
 }
 const value={schema:ARCHIVE_SCHEMA,...out};if(JSON.stringify(value).length>4000)throw Error('invalid_record');return value;
}
export function archivedMeetings(board) {
 return (board.facts||[]).flatMap(record=>{
  try {const v=JSON.parse(record.value);if(v.schema!==ARCHIVE_SCHEMA)return [];const {schema,...raw}=v;
   return [{...normalizeMeeting(raw,board.case_id),record_id:record.id,recorded_at:record.updated_at}];
  }catch{return [];}
 });
}
