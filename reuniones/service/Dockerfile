FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api.py store.py worker.py drive.py run.py ./
ENV PYTHONUNBUFFERED=1 MEETINGS_DATA=/data/meetings HF_HOME=/data/models
CMD ["python", "run.py"]
