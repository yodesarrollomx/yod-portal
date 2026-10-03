// Explicit aliases only. Display similarity never establishes identity.
export function createIdentityIndex(profiles,aliases={}){
 if(!Array.isArray(profiles))throw new TypeError('Profiles must be an array');
 const records=new Map();for(const p of profiles){if(!p||typeof p.id!=='string'||!p.id||records.has(p.id))throw new Error('Missing or duplicate identity');records.set(p.id,p);}
 const links=new Map(Object.entries(aliases));
 for(const [alias] of links){if(records.has(alias))throw new Error('Alias collides with a canonical identity');let id=alias;const seen=new Set();while(links.has(id)){if(seen.has(id))throw new Error('Alias cycle');seen.add(id);id=links.get(id);}if(!records.has(id))throw new Error('Alias target is not in authorized profiles');links.set(alias,id);}
 const resolve=id=>records.has(id)?id:links.get(id)||null;
 return {resolve,get:id=>records.get(resolve(id))||null,ids:()=>[...records.keys()],aliases:()=>Object.fromEntries(links)};
}
export function migrateLocalState(input,index){
 const state=JSON.parse(JSON.stringify(input||{}));state.identityArchive??={};
 for(const bucket of ['looks','events','chat']){
  state[bucket]??={};
  for(const [oldId,newId] of Object.entries(index.aliases())){
   if(!Object.hasOwn(state[bucket],oldId))continue;
   state.identityArchive[bucket]??={};state.identityArchive[bucket][oldId]=state[bucket][oldId];
   if(bucket==='looks'){if(!Object.hasOwn(state[bucket],newId))state[bucket][newId]=state[bucket][oldId];}
   else{const rows=[...(state[bucket][newId]||[]),...(state[bucket][oldId]||[])],seen=new Set();state[bucket][newId]=rows.filter(row=>{const key=JSON.stringify(row);if(seen.has(key))return false;seen.add(key);return true;});}
   delete state[bucket][oldId];
  }
 }
 state.identityVersion=3;return state;
}
