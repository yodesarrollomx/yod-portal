"""Generate a scoped device credential into a private local file, never stdout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
from store import identifier

parser=argparse.ArgumentParser()
parser.add_argument('--owner',required=True)
parser.add_argument('--project',action='append',required=True)
parser.add_argument('--out',required=True)
args=parser.parse_args()
identifier(args.owner)
for project in args.project: identifier(project)
token=secrets.token_urlsafe(32)
result={'device_token':token,'server_grant':{'owner':args.owner,'projects':args.project,'sha256':hashlib.sha256(token.encode()).hexdigest()}}
out=Path(args.out)
fd=os.open(out,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as file: json.dump(result,file,indent=2)
print('Credencial y grant creados en el archivo privado indicado; no publicar ni enviar por chat.')
