"""One disk / one instance. Supervise API and worker; persistent leases survive restarts."""
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

os.umask(0o077)
data = Path(os.environ.get('MEETINGS_DATA', './private-meetings'))
data.mkdir(parents=True, exist_ok=True)
credentials = os.environ.get('MEETINGS_GOOGLE_CREDENTIALS_JSON')
if credentials:
    target = data / 'google-credentials.json'
    target.write_text(credentials)
    os.chmod(target, 0o600)
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(target.resolve())
commands = [[sys.executable,'-m','uvicorn','api:app','--host','0.0.0.0','--port',os.environ.get('PORT','8080')],
            [sys.executable,'worker.py']]
processes = [subprocess.Popen(c) for c in commands]
stopping = False
def stop(*_):
    global stopping
    stopping = True
    for p in processes:
        if p.poll() is None:
            p.terminate()
signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
try:
    while not stopping:
        for i,p in enumerate(processes):
            if p.poll() is not None:
                time.sleep(2)
                if not stopping:
                    processes[i] = subprocess.Popen(commands[i])
        time.sleep(1)
finally:
    stop()
    for p in processes:
        try: p.wait(timeout=20)
        except subprocess.TimeoutExpired: p.kill()
