# Multi-Tenant SaaS System

## Overview

EduHub now implements a **multi-tenant SaaS architecture** where each admin has complete data isolation. When a new admin is registered, they get their own empty workspace and can only see/manage data they create.

## How It Works

### 1. **Center Ownership**
- Each admin automatically gets their own `Center` when created
- The center is named: `"{Admin Name}'s Center"`
- The center is linked to the admin via the `owner` field
- The admin is automatically assigned to their center

### 2. **Automatic Center Creation**
When a new admin is created:
1. User account is created with `role='admin'`
2. A new `Center` is automatically created
3. The center's `owner` is set to the admin
4. The admin's `center` field is set to their new center
5. Admin receives login credentials via email

### 3. **Data Isolation**
All data is filtered by the admin's center:
- **Users**: Only users from admin's center
- **Classes**: Only classes from admin's center
- **Students**: Only students from admin's center
- **Teachers**: Only teachers from admin's center
- **Attendance**: Only attendance from admin's center classes
- **Grades**: Only grades from admin's center classes
- **Schedules**: Only schedules from admin's center classes
- **Resources**: Only resources from admin's center classes
- **Invoices**: Only invoices from admin's center
- **Homework**: Only homework from admin's center classes
- **Announcements**: Only announcements from admin's center

### 4. **Superuser Access**
- Superusers (like the main admin) can see all data across all centers
- Regular admins can only see their own center's data
- This allows the main admin to manage the entire system while clients have isolated workspaces

## Database Schema

### Center Model
```python
class Center(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    owner = models.ForeignKey(CustomUser, ...)  # Links to admin
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### CustomUser Model
```python
class CustomUser(AbstractUser):
    role = models.CharField(...)
    center = models.ForeignKey(Center, ...)  # Links user to center
    ...
```

## API Behavior

### For Regular Admins
- All GET requests filter by `center=request.user.center`
- All POST/PUT/DELETE requests automatically assign/validate center
- Cannot access data from other centers
- Cannot create data for other centers

### For Superusers
- Can see all data (no filtering)
- Can manage all centers
- Full system access

## Frontend Experience

### New Admin Login
1. Admin logs in with provided credentials
2. Sees empty dashboard (no centers, classes, users, etc.)
3. Can start creating their own data:
   - Create their center (already done automatically)
   - Create classes
   - Add teachers
   - Add students
   - Upload materials
   - etc.

### Existing Admin
- Sees only their own data
- Cannot see other admins' data
- Complete isolation

## Management Commands

### Setup Centers for Existing Admins
If you have existing admins without centers, run:
```bash
docker-compose exec backend python manage.py setup_admin_centers
```

This will:
- Find all admins without centers
- Create a center for each
- Set the center owner
- Assign the admin to their center

## Testing Multi-Tenancy

1. **Create Admin 1**:
   - Register new admin via API or admin panel
   - Login as Admin 1
   - Create some classes, students, etc.

2. **Create Admin 2**:
   - Register another admin
   - Login as Admin 2
   - Should see empty dashboard
   - Create different classes, students, etc.

3. **Verify Isolation**:
   - Login as Admin 1 → Should only see Admin 1's data
   - Login as Admin 2 → Should only see Admin 2's data
   - Login as Superuser → Should see all data

## Security Notes

1. **Data Isolation**: Enforced at the database query level
2. **API Validation**: All create/update operations validate center ownership
3. **Frontend Filtering**: Additional layer of filtering in frontend
4. **Superuser Override**: Only designated superusers can see all data

## Migration Notes

If you have existing data:
1. Run migrations: `python manage.py migrate`
2. Run setup command: `python manage.py setup_admin_centers`
3. Existing admins will get centers assigned
4. Existing data will be linked to appropriate centers

## Benefits

✅ **Complete Data Isolation**: Each admin's data is completely separate
✅ **Automatic Setup**: New admins get their workspace automatically
✅ **Scalable**: Easy to add new clients (admins)
✅ **Secure**: Data isolation enforced at multiple levels
✅ **Flexible**: Superusers can still manage everything

## Example Flow

1. **Superuser creates Admin**:
   ```
   POST /api/users/
   {
     "username": "client1",
     "email": "client1@example.com",
     "role": "admin",
     "first_name": "Client",
     "last_name": "One"
   }
   ```

2. **System automatically**:
   - Creates user account
   - Creates "Client One's Center"
   - Links center to admin
   - Assigns admin to center
   - Sends credentials email

3. **Admin logs in**:
   - Sees empty dashboard
   - Can start creating their data
   - All data is automatically linked to their center

4. **Data Isolation**:
   - Admin can only see their own data
   - Cannot access other admins' data
   - Complete isolation achieved

