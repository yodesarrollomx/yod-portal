"""Durable private meeting journal. One SQLite writer, immutable content-addressed audio."""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import time
import uuid
from contextlib import contextmanager


class Conflict(ValueError):
    pass


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', value):
        raise ValueError('invalid_identifier')
    return value


class Store:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        (self.root / 'audio').mkdir(exist_ok=True, mode=0o700)
        with self.db() as db:
            db.executescript('''
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS meetings(
              id TEXT PRIMARY KEY, owner TEXT NOT NULL, project TEXT NOT NULL,
              mime TEXT NOT NULL, format TEXT NOT NULL, created REAL NOT NULL,
              state TEXT NOT NULL DEFAULT 'open', manifest TEXT, interrupted INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS chunks(
              meeting TEXT NOT NULL, seq INTEGER NOT NULL, hash TEXT NOT NULL,
              size INTEGER NOT NULL, duration REAL NOT NULL,
              PRIMARY KEY(meeting,seq));
            CREATE TABLE IF NOT EXISTS jobs(
              id TEXT PRIMARY KEY, meeting TEXT NOT NULL, kind TEXT NOT NULL,
              upto INTEGER NOT NULL, state TEXT NOT NULL DEFAULT 'pending',
              attempts INTEGER NOT NULL DEFAULT 0, retry REAL NOT NULL DEFAULT 0,
              lease TEXT, result TEXT, error TEXT);
            ''')

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.root / 'journal.sqlite3', timeout=30)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA synchronous=FULL')
        try:
            with db:
                yield db
        finally:
            db.close()

    def create(self, mid, owner, project, mime, fmt):
        identifier(mid)
        identifier(project)
        if fmt not in ('stream', 'wav_segments') or mime not in ('audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/wav'):
            raise ValueError('unsupported_audio')
        with self.db() as db:
            db.execute('INSERT OR IGNORE INTO meetings(id,owner,project,mime,format,created) VALUES(?,?,?,?,?,?)',
                       (mid, owner, project, mime, fmt, time.time()))
            row = db.execute('SELECT * FROM meetings WHERE id=?', (mid,)).fetchone()
            if (row['owner'], row['project'], row['mime'], row['format']) != (owner, project, mime, fmt):
                raise Conflict('meeting_identity_conflict')
        return self.status(mid, owner)

    def meeting(self, mid, owner):
        identifier(mid)
        with self.db() as db:
            row = db.execute('SELECT * FROM meetings WHERE id=? AND owner=?', (mid, owner)).fetchone()
        if not row:
            raise KeyError('meeting_not_found')
        return dict(row)

    def chunks(self, mid):
        with self.db() as db:
            return [dict(r) for r in db.execute('SELECT * FROM chunks WHERE meeting=? ORDER BY seq', (mid,))]

    def audio_path(self, digest):
        if not re.fullmatch('[0-9a-f]{64}', digest):
            raise ValueError('invalid_digest')
        return self.root / 'audio' / digest

    def put(self, mid, owner, seq, data, digest, duration):
        self.meeting(mid, owner)
        if not isinstance(seq, int) or not 0 <= seq < 50000 or not math.isfinite(duration) or not 0 <= duration <= 3600:
            raise ValueError('invalid_chunk')
        if not data or len(data) > 32 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != digest:
            raise ValueError('checksum_or_size_mismatch')
        # File and parent directory fsync precede the DB receipt. Orphans are safe;
        # a committed receipt must never point at a partially written file.
        path = self.audio_path(digest)
        temp = path.with_suffix('.' + uuid.uuid4().hex)
        try:
            with temp.open('xb') as out:
                os.chmod(temp, 0o600)
                out.write(data)
                out.flush()
                os.fsync(out.fileno())
            os.replace(temp, path)
            fd = os.open(path.parent, os.O_RDONLY)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)
        finally:
            temp.unlink(missing_ok=True)
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            old = db.execute('SELECT * FROM chunks WHERE meeting=? AND seq=?', (mid, seq)).fetchone()
            if old:
                if old['hash'] != digest or old['duration'] != duration:
                    raise Conflict('chunk_conflict')
            else:
                state = db.execute('SELECT state FROM meetings WHERE id=?', (mid,)).fetchone()[0]
                if state != 'open':
                    raise Conflict('meeting_closed')
                db.execute('INSERT INTO chunks VALUES(?,?,?,?,?)', (mid, seq, digest, len(data), duration))
        self.schedule(mid)
        return {'seq': seq, 'sha256': digest, 'size': len(data), 'durable': True}

    def schedule(self, mid):
        rows = self.chunks(mid)
        prefix = []
        for r in rows:
            if r['seq'] != len(prefix):
                break
            prefix.append(r)
        seconds = sum(r['duration'] for r in prefix)
        bucket = int(seconds // 300)
        if bucket:
            with self.db() as db:
                db.execute('INSERT OR IGNORE INTO jobs(id,meeting,kind,upto) VALUES(?,?,?,?)',
                           (f'{mid}:preview:{bucket}', mid, 'preview', len(prefix) - 1))

    def finalize(self, mid, owner, manifest, interrupted=False):
        self.meeting(mid, owner)
        if not manifest or len(manifest) > 50000:
            raise ValueError('empty_or_large_manifest')
        canonical = json.dumps(manifest, sort_keys=True, separators=(',', ':'))
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT * FROM meetings WHERE id=?', (mid,)).fetchone()
            if row['manifest']:
                if row['manifest'] != canonical or bool(row['interrupted']) != bool(interrupted):
                    raise Conflict('manifest_conflict')
            else:
                chunks = [dict(r) for r in db.execute('SELECT * FROM chunks WHERE meeting=? ORDER BY seq', (mid,))]
                expected = [{'seq': r['seq'], 'sha256': r['hash'], 'size': r['size']} for r in chunks]
                if manifest != expected or [r['seq'] for r in chunks] != list(range(len(chunks))):
                    raise Conflict('missing_or_mismatched_chunks')
                for r in chunks:
                    if hashlib.sha256(self.audio_path(r['hash']).read_bytes()).hexdigest() != r['hash']:
                        raise Conflict('stored_audio_corrupt')
                db.execute("UPDATE meetings SET state='sealed',manifest=?,interrupted=? WHERE id=?", (canonical, int(interrupted), mid))
                db.execute('INSERT OR IGNORE INTO jobs(id,meeting,kind,upto) VALUES(?,?,?,?)', (f'{mid}:final', mid, 'final', len(chunks)-1))
                db.execute('INSERT OR IGNORE INTO jobs(id,meeting,kind,upto) VALUES(?,?,?,?)', (f'{mid}:drive', mid, 'drive', len(chunks)-1))
        return self.status(mid, owner)

    def status(self, mid, owner):
        meeting = self.meeting(mid, owner)
        with self.db() as db:
            jobs = [dict(r) for r in db.execute('SELECT kind,upto,state,attempts,result,error FROM jobs WHERE meeting=? ORDER BY upto', (mid,))]
        for j in jobs:
            if j['result']:
                j['result'] = json.loads(j['result'])
        return {'id': mid, 'project': meeting['project'], 'state': meeting['state'],
                'interrupted': bool(meeting['interrupted']), 'chunks': self.chunks(mid), 'jobs': jobs}

    def claim(self):
        now = time.time()
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute("SELECT * FROM jobs WHERE state!='done' AND retry<=? ORDER BY CASE kind WHEN 'final' THEN 0 WHEN 'preview' THEN 1 ELSE 2 END, rowid LIMIT 1", (now,)).fetchone()
            if not row:
                return None
            lease = uuid.uuid4().hex
            db.execute("UPDATE jobs SET state='running',lease=?,retry=?,attempts=attempts+1 WHERE id=?", (lease, now+1800, row['id']))
            return {**dict(row), 'lease': lease}

    def finish_job(self, job, result=None, error=None):
        with self.db() as db:
            db.execute('UPDATE jobs SET state=?,result=?,error=?,retry=? WHERE id=? AND lease=?',
                       ('retry' if error else 'done', json.dumps(result) if result is not None else None,
                        error, time.time()+min(3600, 30*2**min(job['attempts'], 7)), job['id'], job['lease']))
