# Quick Start Guide

## 1. Start the Application

```bash
# Option 1: Use the setup script
./setup.sh

# Option 2: Manual setup
docker-compose up --build
```

## 2. Run Migrations

```bash
docker-compose exec backend python manage.py migrate
```

## 3. Create Initial Users

### Option A: Using Django Admin
1. Create superuser: `docker-compose exec backend python manage.py createsuperuser`
2. Access admin at http://localhost:8000/admin
3. Create users through admin interface

### Option B: Using API (after creating admin user)
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}' | jq -r '.access')

# Create teacher
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher1",
    "email": "teacher@example.com",
    "password": "password123",
    "role": "teacher",
    "first_name": "John",
    "last_name": "Teacher"
  }'

# Create student
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student@example.com",
    "password": "password123",
    "role": "student",
    "first_name": "Jane",
    "last_name": "Student"
  }'
```

## 4. Test the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:8000/api
3. **Admin Panel**: http://localhost:8000/admin

## 5. Run Tests

```bash
docker-compose exec backend pytest
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build

# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d db
docker-compose exec backend python manage.py migrate
```

