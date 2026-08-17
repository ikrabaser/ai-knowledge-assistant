#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

if [ "$#" -gt 0 ]; then
    echo "Starting: $*"
    exec "$@"
else
    echo "Starting application..."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
