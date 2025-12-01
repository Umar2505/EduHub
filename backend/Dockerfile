FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make startup script executable
RUN chmod +x start.sh || true

# Expose port (Render will set PORT env var)
EXPOSE 8000

# Use startup script that handles migrations and starts gunicorn
CMD ["/bin/bash", "start.sh"]

