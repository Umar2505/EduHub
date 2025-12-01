# Django Admin Panel Access

## ✅ Admin Panel is Now Ready!

The Django admin panel is accessible at:
**http://localhost:8000/admin/**

## 🔑 Login Credentials

You already have a superuser account:
- **Username**: `Umar`
- **Email**: `rustamovumar0@gmail.com`
- **Password**: (the password you set when creating the account)

## 📝 How to Access

1. Make sure your Docker containers are running:
   ```bash
   docker-compose up -d
   ```

2. Open your browser and go to:
   ```
   http://localhost:8000/admin/
   ```

3. Login with your superuser credentials

## 🔧 If You Forgot Your Password

Reset the password using:
```bash
docker-compose exec backend python manage.py changepassword Umar
```

Or create a new superuser:
```bash
docker-compose exec backend python manage.py createsuperuser
```

## 📋 What You Can Do in Admin Panel

The admin panel allows you to manage:
- **Users** (CustomUser) - Admins, Teachers, Students
- **Centers** - Educational centers
- **Class Groups** - Classes/courses
- **Attendance** - Attendance records
- **Schedules** - Class schedules
- **Grades** - Student grades
- **Messages** - Internal messaging
- **Announcements** - Announcement board
- **Resources** - Learning materials
- **Invoices** - Billing and invoices
- **Payments** - Payment records
- **Homework** - Homework assignments
- **Homework Submissions** - Student submissions

## 🛠️ Troubleshooting

### Can't access admin panel?
1. Check if backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend`
3. Verify the URL: `http://localhost:8000/admin/` (not `/api/admin/`)

### Getting 404 error?
- Make sure migrations are run: `docker-compose exec backend python manage.py migrate`
- Check that the admin URL is correct: `/admin/` not `/admin`

### Static files not loading?
- Run: `docker-compose exec backend python manage.py collectstatic --noinput`

### Need to create another admin?
```bash
docker-compose exec backend python manage.py createsuperuser
```

## 🔒 Security Note

The admin panel is only accessible to superusers. Regular admins (role='admin') cannot access the Django admin panel - they use the React frontend admin dashboard instead.

