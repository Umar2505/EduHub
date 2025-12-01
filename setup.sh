#!/bin/bash

# EduHub Setup Script
echo "Setting up EduHub..."

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
DATABASE_URL=postgresql://postgres:postgres@db:5432/eduhub
TIMEZONE=Asia/Tashkent" > backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env 2>/dev/null || echo "REACT_APP_API_URL=http://localhost:8000/api" > frontend/.env
fi

echo "Starting Docker containers..."
docker-compose up -d --build

echo "Waiting for database to be ready..."
sleep 5

echo "Running migrations..."
docker-compose exec -T backend python manage.py migrate

echo "Creating superuser (optional)..."
echo "You can create a superuser manually with:"
echo "  docker-compose exec backend python manage.py createsuperuser"

echo ""
echo "Setup complete!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000/api"
echo "Django Admin: http://localhost:8000/admin"
echo ""
echo "To run tests:"
echo "  docker-compose exec backend pytest"

