const scenes={
 gallery:`<path d="M45 182h230l-28 22H73Z"/><g class="moving"><path d="M57 120h53v58H57Zm0 0 27-19 26 19m-39 13v13m20-13v13m-20 13v12m20-12v12"/><path d="M48 178h70v13H48Z"/></g><g class="moving second"><path d="M134 88h53v85h-53Zm0 0 27-15 26 15m-42 18h32m-32 18h32m-32 18h32m-32 18h32"/><path d="M125 173h71v18h-71Z"/></g><g class="moving third"><path d="M218 122h43v55h-43Zm0 0 21-22 22 22m-29 15h15v18h-15"/><path d="M209 177h61v14h-61Z"/></g>`,

 easel:`<path d="m160 51-48 151m48-151 49 151m-90-22h80"/><g class="moving"><rect x="92" y="63" width="137" height="98" rx="5"/><path d="M105 80h110m-110 14h64m-63 51 27-26 24 12 35-31 22 7"/><circle cx="205" cy="91" r="7"/></g>`,
 dock:`<path d="m48 149 56 43h151l25-43Z"/><g class="moving"><rect x="53" y="82" width="63" height="71" rx="9"/><path d="M65 104h39v27H65Zm0 0 19 14 20-14"/></g><g class="moving second"><rect x="129" y="72" width="63" height="81" rx="9"/><path d="M142 94h37v27h-18l-12 9v-9h-7Z"/></g><g class="moving third"><rect x="205" y="82" width="63" height="71" rx="9"/><path d="M216 103h17l6 7h17v25h-40Z"/></g>`,
};
export const newEngines=Object.fromEntries(Object.entries(scenes).map(([name,drawing])=>[name,(host,options={})=>{
 host.classList.add('custom-figure');host.innerHTML=`<svg viewBox="0 0 320 260" role="img"><title></title><g fill="var(--hairline-plate,#f8f8f2)" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${drawing}</g></svg>`;host.querySelector('title').textContent=options.label||name;
 const move=e=>{const r=host.getBoundingClientRect();host.style.setProperty('--lift',`${-4-12*Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))}px`);host.classList.add('exploring');};const rest=()=>host.classList.remove('exploring');host.addEventListener('pointermove',move);host.addEventListener('pointerleave',rest);
 return {update(o){if('play'in o)host.classList.toggle('playing',o.play);},destroy(){host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',rest);host.replaceChildren();}};
} ]));
