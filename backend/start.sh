#!/bin/bash
set -e

# Get port from environment or default to 8000
PORT=${PORT:-8000}

echo "Starting EduHub backend on port $PORT"

# Wait for database to be ready (with timeout)
echo "Waiting for database connection..."
python << END
import sys
import time
import os

try:
    import psycopg2
except ImportError:
    print("psycopg2 not available, skipping database check")
    sys.exit(0)

max_attempts = 30
attempt = 0
db_url = os.getenv('DATABASE_URL')

if not db_url:
    print("No DATABASE_URL set, skipping database check")
    sys.exit(0)

while attempt < max_attempts:
    try:
        conn = psycopg2.connect(db_url, connect_timeout=5)
        conn.close()
        print("Database is ready!")
        sys.exit(0)
    except Exception as e:
        attempt += 1
        if attempt < max_attempts:
            print(f"Waiting for database... ({attempt}/{max_attempts})")
            time.sleep(2)
        else:
            print(f"Database connection failed after {max_attempts} attempts: {e}")
            sys.exit(1)
END

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput || echo "Migration failed, continuing anyway..."

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static files collection failed, continuing anyway..."

# Start server with gunicorn
echo "Starting Gunicorn server..."
exec gunicorn eduhub.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile - \
    --log-level info

