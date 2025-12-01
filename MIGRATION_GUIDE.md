# EduHub Migration and Setup Guide

## Quick Start

### 1. Run Database Migrations

After the new models have been added, you need to create and run migrations:

```bash
# Enter backend container
docker-compose exec backend bash

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (if needed)
python manage.py createsuperuser
```

### 2. Verify Models

Check that all models are registered in Django admin:
- Go to http://localhost:8000/admin
- You should see all new models:
  - Schedules
  - Grades
  - Messages
  - Announcements
  - Resources
  - Invoices
  - Payments

### 3. Test API Endpoints

```bash
# Get authentication token
TOKEN=$(curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}' | jq -r '.access')

# Test new endpoints
curl -X GET http://localhost:8000/api/schedules/ \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8000/api/grades/ \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8000/api/messages/ \
  -H "Authorization: Bearer $TOKEN"
```

## Model Changes Summary

### CustomUser Model
**New Fields:**
- `avatar` - ImageField for user profile picture
- `center` - ForeignKey to Center (for multi-tenant)
- `children` - ManyToMany to CustomUser (for parent-student relationship)
- `role` - Now includes 'parent' option

**Migration Notes:**
- Existing users will have `center=None` and empty `children`
- Avatar field is optional

### ClassGroup Model
**New Fields:**
- `subject` - CharField for class subject
- `room` - CharField for classroom location

**Migration Notes:**
- Both fields are optional (blank=True)
- Existing classes will have empty values

### New Models
All new models are created from scratch:
- Schedule
- Grade
- Message
- Announcement
- Resource
- Invoice
- Payment

## File Upload Configuration

### Development
File uploads are configured for development. Files will be stored in:
```
backend/media/
  ├── avatars/
  └── resources/
```

### Production
For production, configure cloud storage:

1. **AWS S3** (recommended):
```python
# settings.py
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = 'your-key'
AWS_SECRET_ACCESS_KEY = 'your-secret'
AWS_STORAGE_BUCKET_NAME = 'eduhub-media'
```

2. **Or update MEDIA_ROOT**:
```python
MEDIA_ROOT = '/var/www/eduhub/media'
```

## Testing New Features

### 1. Create a Schedule
```python
# In Django shell: python manage.py shell
from core.models import ClassGroup, Schedule
from django.utils import time

class_group = ClassGroup.objects.first()
schedule = Schedule.objects.create(
    class_group=class_group,
    day_of_week='monday',
    start_time=time(9, 0),
    end_time=time(10, 30),
    room='Room 101'
)
```

### 2. Create a Grade
```python
from core.models import Grade, CustomUser, ClassGroup
from datetime import date

student = CustomUser.objects.filter(role='student').first()
class_group = ClassGroup.objects.first()

grade = Grade.objects.create(
    student=student,
    class_group=class_group,
    grade_type='homework',
    title='Assignment 1',
    score=85,
    max_score=100,
    date=date.today()
)
```

### 3. Send a Message
```python
from core.models import Message, CustomUser

teacher = CustomUser.objects.filter(role='teacher').first()
student = CustomUser.objects.filter(role='student').first()

message = Message.objects.create(
    sender=teacher,
    recipient=student,
    subject='Homework Reminder',
    body='Don\'t forget to submit your assignment by Friday.'
)
```

## Common Issues

### Issue: Migration conflicts
**Solution:**
```bash
# Reset migrations (WARNING: deletes data)
python manage.py migrate core zero
python manage.py makemigrations
python manage.py migrate
```

### Issue: File uploads not working
**Solution:**
1. Check MEDIA_ROOT and MEDIA_URL in settings.py
2. Ensure media directory exists: `mkdir -p backend/media/avatars backend/media/resources`
3. Check file permissions

### Issue: Parent role not showing
**Solution:**
- Parent role is added to ROLE_CHOICES in CustomUser model
- Create a user with role='parent' and link children via admin or API

## Next Steps

1. ✅ Run migrations
2. ✅ Test API endpoints
3. ⚠️ Create frontend pages (see IMPLEMENTATION_SUMMARY.md)
4. ⚠️ Add translations
5. ⚠️ Configure email/SMS (optional)
6. ⚠️ Set up payment integration (optional)

## Support

For issues or questions:
1. Check API_REFERENCE.md for endpoint details
2. Check IMPLEMENTATION_SUMMARY.md for feature status
3. Review model definitions in `backend/core/models.py`

