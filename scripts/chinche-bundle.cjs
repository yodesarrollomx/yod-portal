const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=['secuencia.js','entrega.js'].map(f=>fs.readFileSync(path.join(root,'chinche',f),'utf8')).join('\n');
const start='/* BEGIN CHINCHE SEQUENCE SHARED */',end='/* END CHINCHE SEQUENCE SHARED */';
for(const file of [path.join(root,'chinche.js'),...process.argv.slice(2)]){const old=fs.readFileSync(file,'utf8'),a=old.indexOf(start),b=old.indexOf(end);if(a<0||b<0)throw Error('Missing bundle markers: '+file);fs.writeFileSync(file,old.slice(0,a)+start+'\n'+source+'\n'+old.slice(b));}
