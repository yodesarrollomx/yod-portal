#!/usr/bin/env python3
"""Read local source hashes; publish only relative names and hashes to grafo-datos."""
import argparse,datetime,hashlib,json,subprocess,base64,os
from pathlib import Path

def compare(files):
    changes=[]
    for item in files:
        if item.get('html_source'): continue
        path=Path(item['source'])
        digest=hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
        if digest!=item['sha256']:
            changes.append({'file':item['copy'].removeprefix('corpus/'),'status':'modified' if digest else 'deleted','sha256':digest,'baseline':item['sha256']})
    return changes

def additions(manifest):
    known={x['source'] for x in manifest['files']}; found=[]
    skip={'.git','node_modules','__pycache__','venv','.venv','dist','build','web_dist','tests','tests-js','test','test_data','fixtures','data','datos','inbox','salida','privado','reports','research','research_notes','backups','respaldos','trabajos','cache','skills','optional-skills','website','vendor','assets','screenshots','logs','sesiones','sessions'}
    for root in manifest.get('scan_roots',[]):
        base=Path(root['source'])
        for directory,dirs,files in os.walk(base,followlinks=False):
            dirs[:]=[d for d in dirs if root['recursive'] and d not in skip and not d.startswith('.') and not Path(directory,d).is_symlink()]
            for name in files:
                f=Path(directory,name)
                if str(f) in known or f.is_symlink() or f.suffix not in {'.py','.js','.ts','.tsx','.jsx','.mjs','.cjs','.css','.html'}:continue
                if name.startswith(('.', 'test_')) or any(x in name.lower() for x in ['credential','credencial','oauth','token','.antes-','.min.','candidato','propuestas-']):continue
                found.append({'file':root['prefix']+'/'+str(f.relative_to(base)),'status':'added'})
    return found

def main():
    p=argparse.ArgumentParser();p.add_argument('manifest');p.add_argument('--publish',action='store_true');p.add_argument('--output',required=True);a=p.parse_args()
    m=json.loads(Path(a.manifest).read_text());result={'baseline':m['observed_at'],'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'changes':compare(m['files'])+additions(m),'scope':'Huellas del corte y nuevos archivos de código en las carpetas analizadas; datos y secretos excluidos.'}
    data=json.dumps(result,ensure_ascii=False,indent=2)+'\n';Path(a.output).write_text(data)
    if a.publish:
        endpoint='repos/yodesarrollomx/potenciales-yod/contents/jarvis-estado.json'
        read=subprocess.run(['gh','api',endpoint+'?ref=grafo-datos'],capture_output=True,text=True)
        if read.returncode:raise RuntimeError('No se pudo leer el estado remoto; no se sobrescribe.')
        old=json.loads(read.stdout)
        payload={'message':'Jarvis: comprobar huellas del corte publicado','branch':'grafo-datos','sha':old['sha'],'content':base64.b64encode(data.encode()).decode()}
        subprocess.run(['gh','api','--method','PUT',endpoint,'--input','-'],input=json.dumps(payload),text=True,stdout=subprocess.DEVNULL,check=True)
    print(json.dumps({'changes':len(result['changes']),'checked_at':result['checked_at'],'published':a.publish}))
if __name__=='__main__':main()
