# Testing Multi-Tenant System

## Quick Test Steps

### 1. Verify Centers Are Assigned
```bash
docker-compose exec backend python manage.py shell -c "from core.models import CustomUser, Center; admins = CustomUser.objects.filter(role='admin'); [print(f'{a.username}: center={a.center.name if a.center else None}') for a in admins]"
```

### 2. Test Data Isolation

**As Admin 1:**
1. Login as `admin` (or any admin)
2. Create a class: "Math 101"
3. Create a student: "John Doe"
4. Create a teacher: "Jane Smith"

**As Admin 2:**
1. Login as `admin2` (or another admin)
2. Check classes - should see empty list (no "Math 101")
3. Check students - should see empty list (no "John Doe")
4. Check teachers - should see empty list (no "Jane Smith")
5. Create different data - "Science 201", "Bob Student", etc.

**Verify Isolation:**
1. Login back as Admin 1
2. Should only see Admin 1's data
3. Should NOT see Admin 2's data

### 3. Test New Admin Creation

1. Create a new admin via API or admin panel
2. Login as the new admin
3. Should see:
   - Empty centers list (except their own center)
   - Empty classes list
   - Empty students list
   - Empty teachers list
   - Empty everything (fresh workspace)

### 4. Test Auto-Assignment

**As Admin:**
1. Create a new student
2. Student should automatically be assigned to admin's center
3. Create a new teacher
4. Teacher should automatically be assigned to admin's center
5. Create a new class
6. Class should automatically be assigned to admin's center

### 5. API Testing

**Test as Admin 1:**
```bash
# Get token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'

# Get classes (should only see Admin 1's classes)
curl -X GET http://localhost:8000/api/class-groups/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get students (should only see Admin 1's students)
curl -X GET http://localhost:8000/api/users/?role=student \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test as Admin 2:**
```bash
# Get token for Admin 2
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin2", "password": "your_password"}'

# Get classes (should be empty or only Admin 2's classes)
curl -X GET http://localhost:8000/api/class-groups/ \
  -H "Authorization: Bearer ADMIN2_TOKEN"
```

## Common Issues & Fixes

### Issue: Admin sees all data
**Fix:** Check if admin has a center assigned:
```bash
docker-compose exec backend python manage.py setup_admin_centers
```

### Issue: New users not assigned to center
**Fix:** The serializer should auto-assign. Check if the request context is passed correctly.

### Issue: Can't create data
**Fix:** Make sure admin has a center. Run `setup_admin_centers` command.

### Issue: Filtering not working
**Fix:** 
1. Check backend logs for errors
2. Verify admin has center: `admin.center` should not be None
3. Restart backend: `docker-compose restart backend`

## Expected Behavior

✅ **New Admin**: Empty dashboard, can start creating data
✅ **Existing Admin**: Only sees their own data
✅ **Data Creation**: Automatically assigned to admin's center
✅ **Data Isolation**: Complete separation between admins
✅ **Superuser**: Can see all data (no filtering)

