"""Retryable jobs. Original audio is never deleted or overwritten by transcription."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import time
import wave
import shutil
import zipfile

from store import Store


def assemble(store, meeting, rows, output):
    if meeting['format'] == 'wav_segments':
        with wave.open(str(output), 'wb') as dst:
            dst.setparams((1, 2, 16000, 0, 'NONE', 'not compressed'))
            for row in rows:
                data = store.audio_path(row['hash']).read_bytes()
                if hashlib.sha256(data).hexdigest() != row['hash']:
                    raise ValueError('audio_integrity_failed')
                import io
                with wave.open(io.BytesIO(data), 'rb') as src:
                    if (src.getnchannels(), src.getsampwidth(), src.getframerate()) != (1, 2, 16000):
                        raise ValueError('unsupported_wav_format')
                    dst.writeframes(src.readframes(src.getnframes()))
    else:
        with output.open('wb') as out:
            for row in rows:
                data = store.audio_path(row['hash']).read_bytes()
                if hashlib.sha256(data).hexdigest() != row['hash']:
                    raise ValueError('audio_integrity_failed')
                out.write(data)


def feedback(segments):
    """Evidence extraction, not attribution or autonomous task creation."""
    items = []
    for seg in segments:
        text = seg['text'].strip()
        lower = text.lower()
        if any(word in lower for word in ('pendiente', 'hay que', 'tenemos que', 'vamos a', 'acordamos', 'se acuerda', 'enviará', 'revisará', 'entregará', 'preparará', 'se comprometió')):
            items.append({'kind': 'por_confirmar', 'quote': text, 'start': seg['start'], 'end': seg['end'],
                          'question': '¿Qué entrega concreta se espera, quién la asume y para qué fecha?',
                          'owner': None, 'deadline': None})
        elif any(word in lower for word in ('millones', 'por ciento', 'presupuesto', 'rendimiento', 'capital')):
            items.append({'kind': 'cifra_por_revisar', 'quote': text, 'start': seg['start'], 'end': seg['end'],
                          'question': '¿Esta cifra es una estimación o un acuerdo, y qué conceptos incluye?'})
    return items[-30:]


class Worker:
    def __init__(self, store, transcriber=None):
        self.store = store
        self.models = {}
        self.preview = False
        self.transcriber = transcriber or self.transcribe

    def transcribe(self, audio):
        from faster_whisper import WhisperModel
        name = os.environ.get('WHISPER_PREVIEW_MODEL', 'base') if self.preview else os.environ.get('WHISPER_MODEL', 'turbo')
        if name not in self.models:
            self.models[name] = WhisperModel(name, device='cpu', compute_type='int8', cpu_threads=4)
        # ffmpeg decoding avoids platform-specific PyAV failures; no shell input.
        import numpy as np
        offset = 0
        if self.preview:
            probe = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(audio)],capture_output=True,check=True,timeout=30)
            try: offset = max(0, float(probe.stdout.strip())-315)
            except ValueError: offset = 0  # open WebM may lack duration; decoder still works
        raw = subprocess.run(['ffmpeg','-v','error','-i',str(audio),'-ss',str(offset),'-f','s16le','-ac','1','-ar','16000','pipe:1'], capture_output=True, check=True, timeout=600).stdout
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)/32768.0
        # Open WebM often has no duration metadata: bound preview after decoding too.
        if self.preview and len(samples)>315*16000:
            offset += (len(samples)-315*16000)/16000; samples=samples[-315*16000:]
        segments, _ = self.models[name].transcribe(samples, language='es', vad_filter=True, beam_size=5)
        return [{'start': s.start+offset, 'end': s.end+offset, 'text': s.text.strip(),
                 'review': s.avg_logprob < -1 or s.no_speech_prob > .6 or s.compression_ratio > 2.4} for s in segments]

    def process(self, job):
        with self.store.db() as db:
            meeting = dict(db.execute('SELECT * FROM meetings WHERE id=?', (job['meeting'],)).fetchone())
        rows = self.store.chunks(meeting['id'])[:job['upto']+1]
        if len(rows) != job['upto']+1 or [r['seq'] for r in rows] != list(range(len(rows))):
            raise ValueError('audio_gap')
        with tempfile.TemporaryDirectory(dir=self.store.root) as temp:
            audio = Path(temp)/('audio.wav' if meeting['format']=='wav_segments' else 'audio.media')
            assemble(self.store, meeting, rows, audio)
            if job['kind'] == 'drive':
                with self.store.db() as db:
                    final = db.execute('SELECT result FROM jobs WHERE id=? AND state=?', (meeting['id']+':final','done')).fetchone()
                if not final:
                    raise ValueError('final_transcript_pending')
                result = json.loads(final['result'])
                archive = Path(temp)/'reunion.zip'
                extension = 'wav' if meeting['format']=='wav_segments' else ('m4a' if meeting['mime']=='audio/mp4' else 'webm' if 'webm' in meeting['mime'] else 'ogg')
                with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as z:
                    # Fixed ZIP metadata makes retry bytes identical, including after restart.
                    with z.open(zipfile.ZipInfo('audio.'+extension),'w') as dst, audio.open('rb') as src:
                        shutil.copyfileobj(src,dst)
                    z.writestr(zipfile.ZipInfo('transcripcion.json'), json.dumps(result, ensure_ascii=False, indent=2))
                    z.writestr(zipfile.ZipInfo('transcripcion.txt'), '\n'.join(f"[{s['start']:.1f}–{s['end']:.1f}] {s['text']}" for s in result['segments']))
                    z.writestr(zipfile.ZipInfo('manifiesto.json'), meeting['manifest'])
                from drive import upload_verified
                return upload_verified(self.store, meeting, archive)
            self.preview = job['kind']=='preview'
            segments = self.transcriber(audio)
            usable = [s for s in segments if not s.get('review')]
            return {'provisional': job['kind']!='final', 'requires_human_review': True,
                    'interrupted': bool(meeting['interrupted']), 'upto': job['upto'],
                    'audio_sha256': hashlib.sha256(audio.read_bytes()).hexdigest(),
                    'segments': segments, 'candidates': feedback(usable),
                    'notice': 'Sin voz utilizable; revisar el audio.' if not usable else 'Revisar cifras y acuerdos contra el audio. No se crearon tareas ni se modificó el PPP.'}

    def once(self):
        job = self.store.claim()
        if not job:
            return False
        stop = threading.Event()
        def heartbeat():
            while not stop.wait(30):
                with self.store.db() as db:
                    db.execute('UPDATE jobs SET retry=? WHERE id=? AND lease=? AND state=?', (time.time()+1800,job['id'],job['lease'],'running'))
        thread = threading.Thread(target=heartbeat, daemon=True)
        thread.start()
        try:
            self.store.finish_job(job, result=self.process(job))
        except Exception as exc:
            # Never persist provider responses, credentials or audio in error logs.
            self.store.finish_job(job, error=type(exc).__name__)
        finally:
            stop.set()
            thread.join(timeout=2)
        return True


if __name__ == '__main__':
    worker = Worker(Store(os.environ.get('MEETINGS_DATA', './private-meetings')))
    while True:
        if not worker.once():
            time.sleep(3)
