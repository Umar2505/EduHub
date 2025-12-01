# EduHub - Educational Management System

EduHub is a SaaS platform for managing educational centers, classes, and student attendance. Built with Django REST Framework backend and React frontend.

## Features

- **Role-based Access Control**: Support for Admin, Teacher, and Student roles
- **Attendance Management**: Teachers can mark attendance (present/absent/late) per class and date
- **Admin Dashboard**: Create centers, classes, teachers, and students
- **Student Dashboard**: View personal attendance records
- **Multi-language Support**: English, Uzbek (Latin), and Russian localization
- **JWT Authentication**: Secure API authentication using JWT tokens

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework 3.14.0
- djangorestframework-simplejwt 5.3.0
- PostgreSQL
- pytest for testing

### Frontend
- React 18.2.0
- React Router 6.20.0
- Axios for API calls
- Tailwind CSS for styling
- i18next for internationalization

## Project Structure

```
EduHub/
├── backend/
│   ├── core/              # Main Django app
│   │   ├── models.py      # CustomUser, Center, ClassGroup, Attendance
│   │   ├── serializers.py # DRF serializers
│   │   ├── viewsets.py    # API viewsets
│   │   ├── permissions.py # Custom permissions
│   │   └── tests/         # Unit tests
│   ├── eduhub/            # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── locales/       # i18n translation files
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Set up environment variables** (optional, defaults are provided):
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env if needed
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env if needed
   ```

3. **Start the services**:
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Django backend on port 8000
   - React frontend on port 3000

4. **Run migrations** (in a new terminal):
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. **Create a superuser** (optional, for Django admin):
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

6. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Or run specific test files
docker-compose exec backend pytest core/tests/test_models.py
docker-compose exec backend pytest core/tests/test_attendance_api.py
```

## API Documentation

### Authentication

All API endpoints (except login) require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

#### Login
```http
POST /api/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Refresh Token
```http
POST /api/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Endpoints

#### Users

- `GET /api/users/` - List users (Admin only)
- `GET /api/users/me/` - Get current user info
- `POST /api/users/` - Create user (Admin only)
- `GET /api/users/{id}/` - Get user details (Admin only)
- `PATCH /api/users/{id}/` - Update user (Admin only)
- `DELETE /api/users/{id}/` - Delete user (Admin only)

Query parameters:
- `role`: Filter by role (admin, teacher, student)

#### Centers

- `GET /api/centers/` - List centers (Admin only)
- `POST /api/centers/` - Create center (Admin only)
- `GET /api/centers/{id}/` - Get center details (Admin only)
- `PATCH /api/centers/{id}/` - Update center (Admin only)
- `DELETE /api/centers/{id}/` - Delete center (Admin only)

#### Class Groups

- `GET /api/class-groups/` - List class groups
  - Admin: sees all
  - Teacher: sees assigned classes
  - Student: sees enrolled classes
- `POST /api/class-groups/` - Create class group (Admin only)
- `GET /api/class-groups/{id}/` - Get class group details
- `GET /api/class-groups/{id}/students/` - Get students in class (Admin/Teacher)
- `PATCH /api/class-groups/{id}/` - Update class group (Admin only)
- `DELETE /api/class-groups/{id}/` - Delete class group (Admin only)

#### Attendance

- `GET /api/attendances/` - List attendance records
  - Admin: sees all
  - Teacher: sees attendance for their classes
  - Student: sees own attendance
- `POST /api/attendances/` - Create attendance record (Admin/Teacher)
- `GET /api/attendances/{id}/` - Get attendance details
- `PATCH /api/attendances/{id}/` - Update attendance (Admin/Teacher)
- `DELETE /api/attendances/{id}/` - Delete attendance (Admin/Teacher)
- `POST /api/attendances/bulk_create/` - Bulk create/update attendance (Admin/Teacher)
- `GET /api/attendances/my_attendance/` - Get current student's attendance

Query parameters:
- `class_group`: Filter by class group ID
- `date`: Filter by date (YYYY-MM-DD)

#### Bulk Attendance Example

```http
POST /api/attendances/bulk_create/
Content-Type: application/json
Authorization: Bearer <token>

{
  "class_group": 1,
  "date": "2024-01-15",
  "attendances": [
    {"student_id": 1, "status": "present"},
    {"student_id": 2, "status": "late"},
    {"student_id": 3, "status": "absent"}
  ]
}
```

## Sample API Requests

### Create Center (Admin)
```bash
curl -X POST http://localhost:8000/api/centers/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tashkent Center",
    "address": "123 Main St, Tashkent"
  }'
```

### Create Class Group (Admin)
```bash
curl -X POST http://localhost:8000/api/class-groups/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Math 101",
    "center": 1,
    "teacher": 2,
    "students": [3, 4, 5]
  }'
```

### Mark Attendance (Teacher)
```bash
curl -X POST http://localhost:8000/api/attendances/bulk_create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "class_group": 1,
    "date": "2024-01-15",
    "attendances": [
      {"student_id": 3, "status": "present"},
      {"student_id": 4, "status": "late"}
    ]
  }'
```

### Get Student Attendance
```bash
curl -X GET http://localhost:8000/api/attendances/my_attendance/ \
  -H "Authorization: Bearer <token>"
```

## Acceptance Criteria

### ✅ Automated Tests

- [x] Backend unit tests for models (CustomUser, Center, ClassGroup, Attendance)
- [x] Backend unit tests for attendance API endpoints
- [x] Tests verify role-based permissions
- [x] Tests verify unique attendance constraints

### ✅ Manual Testing Checklist

1. **Docker Setup**
   - [x] `docker-compose up` successfully starts all services
   - [x] Backend connects to PostgreSQL
   - [x] Frontend connects to backend API

2. **Admin Functionality**
   - [x] Admin can create a Center
   - [x] Admin can create a ClassGroup
   - [x] Admin can create users (Teacher, Student)
   - [x] Admin can assign teacher to class
   - [x] Admin can add students to class

3. **Teacher Functionality**
   - [x] Teacher can login and see assigned classes
   - [x] Teacher can fetch students for a class
   - [x] Teacher can mark attendance for a chosen date
   - [x] Teacher can bulk update attendance

4. **Student Functionality**
   - [x] Student can login
   - [x] Student can view their own attendance records
   - [x] Student cannot create or modify attendance

5. **Internationalization**
   - [x] UI supports English, Uzbek (Latin), and Russian
   - [x] Language switcher works in frontend
   - [x] API error messages support i18n

6. **Authentication**
   - [x] JWT authentication works
   - [x] Token refresh works
   - [x] Protected routes require authentication

## Development

### Backend Development

```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
pytest

# Run development server (if not using Docker)
python manage.py runserver
```

### Frontend Development

```bash
# Enter frontend container
docker-compose exec frontend sh

# Install dependencies (if needed)
npm install

# Run development server (if not using Docker)
npm start
```

## Database Models

### CustomUser
- Extends Django's AbstractUser
- `role`: admin, teacher, or student
- `phone`: optional phone number

### Center
- `name`: center name
- `address`: center address

### ClassGroup
- `name`: class name
- `center`: ForeignKey to Center
- `teacher`: ForeignKey to CustomUser (role=teacher)
- `students`: ManyToMany to CustomUser (role=student)

### Attendance
- `student`: ForeignKey to CustomUser (role=student)
- `class_group`: ForeignKey to ClassGroup
- `date`: DateField
- `status`: present, absent, or late
- Unique constraint: (student, class_group, date)

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://postgres:postgres@db:5432/eduhub
TIMEZONE=Asia/Tashkent
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check database credentials in `.env` file
- Run migrations: `docker-compose exec backend python manage.py migrate`

### Frontend Not Loading
- Check if backend is running: `curl http://localhost:8000/api/`
- Verify CORS settings in `backend/eduhub/settings.py`
- Check browser console for errors

### Authentication Issues
- Verify JWT tokens are being stored in localStorage
- Check token expiration (default: 1 hour)
- Try refreshing the token

## License

This project is for educational purposes.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

