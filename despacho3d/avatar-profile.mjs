// A visual profile is optional metadata of the case authorized by the server.
// This module never discovers identities or grants access from a clicked ID.
const forms=new Set(['child','child_female','young_female','young_male','woman','man','robot','spirit','deity','tool','visitor']);
const hairstyles=new Set(['bob','waves','bun','swept','curly','crop']);
const color=v=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
const bounded=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
export function validateAvatarProfile(input,selection){
 if(input===undefined||input===null)return null; // Older authorized servers remain compatible.
 if(!input||Array.isArray(input)||input.id!==selection.case_id||input.case_id!==selection.case_id||input.entity_kind!=='case'||input.name!==selection.name||!bounded(input.id,256)||!forms.has(input.form)||!color(input.color))throw Error('invalid_selection');
 if(input.display_name!==undefined&&(!bounded(input.display_name,120)||!input.display_name.trim()))throw Error('invalid_selection');
 const visual={};
 if(input.visual!==undefined){
  if(!input.visual||typeof input.visual!=='object'||Array.isArray(input.visual))throw Error('invalid_selection');
  for(const key of ['skin','hair','accent','iris','glow'])if(Object.hasOwn(input.visual,key)){if(!color(input.visual[key]))throw Error('invalid_selection');visual[key]=input.visual[key];}
  if(Object.hasOwn(input.visual,'seed')){if(!bounded(input.visual.seed,256))throw Error('invalid_selection');visual.seed=input.visual.seed;}
  if(Object.hasOwn(input.visual,'hairStyle')){if(!hairstyles.has(input.visual.hairStyle))throw Error('invalid_selection');visual.hairStyle=input.visual.hairStyle;}
  for(const key of ['myth','role'])if(Object.hasOwn(input.visual,key)){if(!bounded(input.visual[key],60))throw Error('invalid_selection');visual[key]=input.visual[key];}
  if(Object.hasOwn(input.visual,'presentation')){if(!['feminine','masculine'].includes(input.visual.presentation))throw Error('invalid_selection');visual.presentation=input.visual.presentation;}
 }
 return {id:input.id,case_id:input.case_id,entity_kind:'case',name:input.display_name||selection.name,form:input.form,color:input.color,visual};
}
