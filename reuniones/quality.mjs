// A processing receipt is not a business approval. Failed audio must not yield proposals.
export function requireReviewedAudio(receipt,delivery){
 if(!receipt||receipt.status!=='completed'||receipt.transcript_valid===false||receipt.summary_status!=='completed_assistant_review')throw Error('Audio sin revisión fiable: conservar original y diagnóstico; no generar acuerdos ni pendientes de negocio.');
 if(receipt.sha256!==delivery.meeting.source_sha256)throw Error('La ficha no corresponde al audio revisado.');
 if(!Number.isFinite(receipt.duration_seconds)||receipt.duration_seconds<=0||delivery.proposals.some(p=>p.start>=receipt.duration_seconds))throw Error('La evidencia queda fuera del audio revisado.');
 return true;
}
