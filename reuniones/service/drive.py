"""Private Drive export with stable file identity across lost responses."""
import hashlib
import json
import os
import requests
import google.auth
from google.auth.transport.requests import AuthorizedSession


def upload_verified(store, meeting, archive):
    folders = json.loads(os.environ.get('MEETINGS_DRIVE_FOLDERS', '{}'))
    folder = folders.get(meeting['project'])
    if not folder:
        raise ValueError('drive_folder_not_configured')
    credentials, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/drive.file'])
    client = AuthorizedSession(credentials)
    base = 'https://www.googleapis.com/drive/v3/files'
    with store.db() as db:
        db.execute('CREATE TABLE IF NOT EXISTS exports(meeting TEXT PRIMARY KEY, file_id TEXT NOT NULL)')
        row = db.execute('SELECT file_id FROM exports WHERE meeting=?', (meeting['id'],)).fetchone()
    if row:
        fid = row[0]
    else:
        response = client.get(base+'/generateIds', params={'count':1,'space':'drive'}, timeout=30)
        response.raise_for_status()
        generated = response.json()['ids'][0]
        with store.db() as db:
            db.execute('INSERT OR IGNORE INTO exports VALUES(?,?)', (meeting['id'],generated))
            fid = db.execute('SELECT file_id FROM exports WHERE meeting=?', (meeting['id'],)).fetchone()[0]
    # Check before create, including recovery after an uncertain upload response.
    md5 = hashlib.md5(archive.read_bytes()).hexdigest()
    fields = 'id,size,md5Checksum,parents,trashed'
    def verify():
        r = client.get(base+'/'+fid, params={'fields':fields,'supportsAllDrives':'true'}, timeout=30)
        if r.status_code==404:
            return False
        r.raise_for_status()
        data = r.json()
        if data.get('trashed') or folder not in data.get('parents',[]) or data.get('md5Checksum')!=md5 or int(data.get('size',0))!=archive.stat().st_size:
            raise ValueError('drive_integrity_conflict')
        return True
    if not verify():
        metadata = {'id':fid,'name':meeting['id']+'.zip','parents':[folder],
                    'appProperties':{'meeting_id':meeting['id']}}
        r = client.post('https://www.googleapis.com/upload/drive/v3/files',
                        params={'uploadType':'resumable','supportsAllDrives':'true'},json=metadata,
                        headers={'X-Upload-Content-Type':'application/zip','X-Upload-Content-Length':str(archive.stat().st_size)}, timeout=30)
        r.raise_for_status()
        location = r.headers['Location']
        # Google returns the upload URL; do not follow an arbitrary host with credentials.
        from urllib.parse import urlparse
        parsed = urlparse(location)
        if parsed.scheme!='https' or parsed.hostname!='www.googleapis.com':
            raise ValueError('unexpected_upload_host')
        with archive.open('rb') as src:
            r = client.put(location, data=src, headers={'Content-Type':'application/zip'}, timeout=600)
        r.raise_for_status()
        if not verify():
            raise ValueError('drive_not_verified')
    return {'verified': True,'file_id':fid,'url':'https://drive.google.com/file/d/'+fid+'/view','md5':md5}
