# EduHub API Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints (except login) require JWT authentication:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication
- `POST /api/token/` - Login (get access/refresh tokens)
- `POST /api/token/refresh/` - Refresh access token

### Users
- `GET /api/users/` - List users (Admin only)
- `POST /api/users/` - Create user (Admin only)
- `GET /api/users/{id}/` - Get user details
- `PATCH /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `GET /api/users/me/` - Get current user

### Centers
- `GET /api/centers/` - List centers (Admin only)
- `POST /api/centers/` - Create center (Admin only)
- `GET /api/centers/{id}/` - Get center details
- `PATCH /api/centers/{id}/` - Update center
- `DELETE /api/centers/{id}/` - Delete center

### Class Groups
- `GET /api/class-groups/` - List classes (filtered by role)
- `POST /api/class-groups/` - Create class (Admin only)
- `GET /api/class-groups/{id}/` - Get class details
- `GET /api/class-groups/{id}/students/` - Get class students
- `PATCH /api/class-groups/{id}/` - Update class
- `DELETE /api/class-groups/{id}/` - Delete class

### Attendance
- `GET /api/attendances/` - List attendance (filtered by role)
- `POST /api/attendances/` - Create attendance record
- `POST /api/attendances/bulk_create/` - Bulk create/update attendance
- `GET /api/attendances/my_attendance/` - Get student's attendance
- `GET /api/attendances/report/` - Generate attendance report
  - Query params: `class_group`, `student`, `start_date`, `end_date`, `month`

### Schedules (NEW)
- `GET /api/schedules/` - List schedules
- `POST /api/schedules/` - Create schedule (Admin/Teacher)
- `GET /api/schedules/{id}/` - Get schedule details
- `PATCH /api/schedules/{id}/` - Update schedule
- `DELETE /api/schedules/{id}/` - Delete schedule
- `GET /api/schedules/weekly/` - Get weekly timetable

### Grades (NEW)
- `GET /api/grades/` - List grades (filtered by role)
- `POST /api/grades/` - Create grade (Admin/Teacher)
- `GET /api/grades/{id}/` - Get grade details
- `PATCH /api/grades/{id}/` - Update grade
- `DELETE /api/grades/{id}/` - Delete grade
- `GET /api/grades/statistics/` - Get grade statistics
  - Query params: `class_group`, `student`

### Messages (NEW)
- `GET /api/messages/` - List messages (inbox/sent)
  - Query params: `box` (inbox/sent), `is_read` (true/false)
- `POST /api/messages/` - Send message
- `GET /api/messages/{id}/` - Get message details
- `PATCH /api/messages/{id}/` - Update message
- `DELETE /api/messages/{id}/` - Delete message
- `POST /api/messages/{id}/mark_read/` - Mark as read
- `GET /api/messages/unread_count/` - Get unread count

### Announcements (NEW)
- `GET /api/announcements/` - List announcements
  - Query params: `center`, `class_group`
- `POST /api/announcements/` - Create announcement (Admin/Teacher)
- `GET /api/announcements/{id}/` - Get announcement details
- `PATCH /api/announcements/{id}/` - Update announcement
- `DELETE /api/announcements/{id}/` - Delete announcement

### Resources (NEW)
- `GET /api/resources/` - List resources
  - Query params: `class_group`, `resource_type`
- `POST /api/resources/` - Upload resource (Admin/Teacher)
  - Form data: `file`, `title`, `description`, `resource_type`, `url`, `class_group`
- `GET /api/resources/{id}/` - Get resource details
- `PATCH /api/resources/{id}/` - Update resource
- `DELETE /api/resources/{id}/` - Delete resource

### Invoices (NEW)
- `GET /api/invoices/` - List invoices (filtered by role)
  - Query params: `status`
- `POST /api/invoices/` - Create invoice (Admin only)
- `GET /api/invoices/{id}/` - Get invoice details
- `PATCH /api/invoices/{id}/` - Update invoice
- `DELETE /api/invoices/{id}/` - Delete invoice
- `POST /api/invoices/{id}/mark_paid/` - Mark invoice as paid

### Payments (NEW)
- `GET /api/payments/` - List payments (Admin only)
  - Query params: `invoice`
- `POST /api/payments/` - Create payment (Admin only)
- `GET /api/payments/{id}/` - Get payment details
- `PATCH /api/payments/{id}/` - Update payment
- `DELETE /api/payments/{id}/` - Delete payment

## Example Requests

### Create Schedule
```bash
curl -X POST http://localhost:8000/api/schedules/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "class_group": 1,
    "day_of_week": "monday",
    "start_time": "09:00",
    "end_time": "10:30",
    "room": "Room 101"
  }'
```

### Create Grade
```bash
curl -X POST http://localhost:8000/api/grades/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student": 3,
    "class_group": 1,
    "grade_type": "homework",
    "title": "Assignment 1",
    "score": 85,
    "max_score": 100,
    "date": "2024-01-15"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:8000/api/messages/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": 2,
    "subject": "Question about homework",
    "body": "Can you clarify the assignment requirements?"
  }'
```

### Upload Resource
```bash
curl -X POST http://localhost:8000/api/resources/ \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "title=Course Material" \
  -F "description=Important reading" \
  -F "resource_type=pdf" \
  -F "class_group=1"
```

### Get Attendance Report
```bash
curl -X GET "http://localhost:8000/api/attendances/report/?class_group=1&month=2024-01" \
  -H "Authorization: Bearer <token>"
```

### Get Grade Statistics
```bash
curl -X GET "http://localhost:8000/api/grades/statistics/?class_group=1" \
  -H "Authorization: Bearer <token>"
```

## Response Formats

All endpoints return JSON. List endpoints are paginated (20 items per page).

### Success Response
```json
{
  "id": 1,
  "name": "Example",
  ...
}
```

### Error Response
```json
{
  "detail": "Error message",
  "field_name": ["Field error message"]
}
```

## Role-Based Access

- **Admin**: Full access to all endpoints
- **Teacher**: Can manage their classes, mark attendance, add grades, upload resources
- **Student**: Can view their own data (attendance, grades, invoices)
- **Parent**: Can view their children's data (attendance, grades, invoices)

