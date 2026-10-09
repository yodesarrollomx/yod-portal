const test=require('node:test'),assert=require('node:assert/strict');
const fixture=()=>({goal_id:'goal-synthetic',case_id:'case-synthetic',title:'Entrega de prueba',instruction:'Analizar',criterion:'Evidencia',scope:'local_analysis_v1',status:'ready_for_review',source_revision:'s1',revision:'r1',sequence:1,created_at:'2026-10-09T00:00:00Z',updated_at:'2026-10-09T00:01:00Z',tasks:[{id:'task-1',title:'Tema <script>',criterion:'Fuente',status:'ready_for_review',summary:'Resultado de prueba',evidence_ids:['e1']}],evidence:[{id:'e1',task_id:'task-1',title:'Documento',text:'Evidencia',sha256:'a'.repeat(64),bytes:9}],summary:'Preparado'});
test('meeting is derived from validated case evidence; exactly one slide per topic',async()=>{
 const {buildMeeting,meetingDocument}=await import('../despacho3d/project-meeting.mjs');
 const g=fixture(),d=buildMeeting(g,g.case_id,'Personaje sintético');
 assert.equal(d.slides.length,1);assert.equal(d.slides[0].evidence[0].text,'Evidencia');assert.match(d.status,/revisar/);
 assert.deepEqual(d,buildMeeting(g,g.case_id,'Personaje sintético'));
 assert.throws(()=>buildMeeting(g,'case-other','Otro'));
 assert.throws(()=>buildMeeting({...g,status:'running'},g.case_id,'Personaje'));
 const html=meetingDocument(d);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes(d.slides[0].script));assert.equal((html.match(/<article>/g)||[]).length,1);
 const partial=buildMeeting({...g,status:'awaiting_data',tasks:[{...g.tasks[0],status:'blocked',evidence_ids:[]}],evidence:[]},g.case_id,'Personaje');
 assert.match(partial.status,/parcial/);assert.match(partial.slides[0].checkpoint,/Bloqueado/);assert.equal(partial.slides[0].evidence.length,0);
});
test('room observation remains read-only, serial and clears revoked cases during a request',async()=>{
 const {createRoomWork}=await import('../despacho3d/room-work.mjs');let resolve,calls=[],values=[],clock=1000;
 const room=createRoomWork({request:(path,data,id)=>{calls.push([path,id]);return new Promise(r=>resolve=r);},now:()=>clock,schedule:()=>1,cancel:()=>{}});
 room.subscribe(s=>values=s);
 room.reconcile([{id:'one',case_id:'one',entity_kind:'case'}]);await room.refresh();assert.equal(calls.length,1);
 room.reconcile([]);resolve({ok:true,available:false,case_id:'one',work:null,screen:null});await new Promise(r=>setImmediate(r));
 assert.deepEqual(values,[]);assert.equal(room.has('one'),false);assert.equal(calls[0][0],'/computer/work');room.dispose();
});
module.exports={fixture};

test('source excerpts are bounded, tied to the active run and rejected across cases',async()=>{
 const {validateObservation}=await import('../despacho3d/work-observer.mjs');
 const raw={ok:true,available:true,case_id:'case-synthetic',screen:null,work:{schema:1,case_id:'case-synthetic',run_id:'run1',goal_id:'goal1',source_revision:'s1',title:'Leer',criterion:'Fuente',phase:'working',started_at:'2026-10-09T00:00:00Z',updated_at:'2026-10-09T00:01:00Z',current_tool:null,progress:{sequence:0,progress:{tasks:[],evidence:[],summary:''}},sources:[],events:[],result:null,document:{case_id:'case-synthetic',run_id:'run1',goal_id:'goal1',task_id:null,id:'doc1',title:'Documento',content:'Texto',tab:'',range:'',truncated:false,read_at:'2026-10-09T00:01:00Z',url:null}}};
 assert.equal(validateObservation(raw,'case-synthetic').work.document.content,'Texto');
 for(const mutation of [{case_id:'other'},{run_id:'old'},{content:'x'.repeat(8001)}])assert.throws(()=>validateObservation({...raw,work:{...raw.work,document:{...raw.work.document,...mutation}}},'case-synthetic'));
});
