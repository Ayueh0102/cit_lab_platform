FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn eventlet
COPY . .
RUN mkdir -p src/database src/static/uploads
EXPOSE 5001
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-b", "0.0.0.0:5001", "src.main_v2:app"]
