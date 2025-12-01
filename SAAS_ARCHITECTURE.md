# SaaS Multi-Tenant Architecture

## System Hierarchy

```
Superuser (Main Admin)
  ├── Manages everything through Django Admin Panel
  └── Main responsibility: Create new Admin users (customers)

Admin 1 (Customer 1)
  ├── Can create multiple Centers (Branches)
  │   ├── Center 1 (Branch 1)
  │   └── Center 2 (Branch 2)
  ├── Can create Teachers
  ├── Can create Students
  ├── Can create Classes
  ├── Can manage Attendance
  ├── Can manage Grades
  ├── Can upload Resources
  ├── Can create Homework
  ├── Can manage Billing/Invoices
  └── Complete data isolation from other Admins

Admin 2 (Customer 2)
  ├── Can create multiple Centers (Branches)
  │   ├── Center 1 (Branch 1)
  │   └── Center 2 (Branch 2)
  ├── Can create Teachers
  ├── Can create Students
  ├── Can create Classes
  └── Complete data isolation from Admin 1
```

## Key Principles

### 1. **Complete Data Isolation**
- Admin 1's data is **completely invisible** to Admin 2
- Admin 2's data is **completely invisible** to Admin 1
- Each admin operates in their own isolated workspace

### 2. **Multiple Centers (Branches)**
- Each admin can create **multiple centers** (branches)
- Example: Admin can have "Main Campus", "Online Division", "Evening Classes", etc.
- All data is filtered by centers owned by the admin

### 3. **Full Functionality**
- Each admin has **full access** to all features:
  - Create/manage centers
  - Create/manage classes
  - Create/manage teachers
  - Create/manage students
  - Manage attendance
  - Manage grades
  - Upload resources
  - Create homework
  - Manage billing

### 4. **Automatic Assignment**
- When admin creates a student/teacher → automatically assigned to one of admin's centers
- When admin creates a class → automatically assigned to one of admin's centers
- When admin creates anything → automatically linked to admin's workspace

## How It Works

### Filtering Logic

All data is filtered by checking if it belongs to **any center owned by the admin**:

```python
# Get all centers owned by admin
admin_centers = Center.objects.filter(owner=admin)

# Filter classes: only classes from admin's centers
classes = ClassGroup.objects.filter(center__in=admin_centers)

# Filter users: only users from admin's centers
users = CustomUser.objects.filter(center__in=admin_centers)

# Filter everything else similarly
```

### Data Creation

When an admin creates data:
1. **Center**: Automatically sets `owner=admin`
2. **Class**: Automatically assigns to one of admin's centers
3. **User (Teacher/Student)**: Automatically assigns to one of admin's centers
4. **Everything else**: Automatically linked to admin's centers

### New Admin Experience

1. **Superuser creates new Admin**:
   - Admin account created
   - Admin receives login credentials
   - **No centers created yet** (empty workspace)

2. **Admin logs in**:
   - Sees completely empty dashboard
   - Can start creating their first center (branch)
   - Can create multiple centers if needed

3. **Admin starts using system**:
   - Creates first center: "Main Campus"
   - Creates teachers → auto-assigned to "Main Campus"
   - Creates students → auto-assigned to "Main Campus"
   - Creates classes → auto-assigned to "Main Campus"
   - Can create more centers later: "Online Division", etc.

## Database Structure

### Center Model
```python
class Center(models.Model):
    name = models.CharField(...)
    address = models.TextField(...)
    owner = models.ForeignKey(CustomUser, ...)  # Links to Admin
    # Admin can own multiple centers
```

### Filtering Pattern
```python
# All viewsets filter like this:
if user.role == 'admin':
    admin_centers = Center.objects.filter(owner=user)
    queryset = queryset.filter(center__in=admin_centers)
```

## Testing Scenarios

### Scenario 1: New Admin
1. Superuser creates Admin "Client A"
2. Admin "Client A" logs in
3. Sees empty dashboard
4. Creates center "Client A Main Branch"
5. Creates teachers, students, classes
6. All data belongs to "Client A"

### Scenario 2: Multiple Centers
1. Admin "Client A" creates:
   - Center 1: "Downtown Branch"
   - Center 2: "Uptown Branch"
2. Creates classes in both centers
3. Creates students and assigns to different centers
4. All data still isolated to "Client A"

### Scenario 3: Data Isolation
1. Admin "Client A" creates: "Math Class", "John Student"
2. Admin "Client B" logs in
3. Admin "Client B" sees: **empty lists** (no "Math Class", no "John Student")
4. Admin "Client B" creates: "Science Class", "Jane Student"
5. Admin "Client A" logs back in
6. Admin "Client A" sees: only their data (no "Science Class", no "Jane Student")

## API Behavior

### For Regular Admins
- **GET requests**: Only return data from admin's owned centers
- **POST requests**: Automatically assign to admin's centers
- **PUT/DELETE requests**: Only allowed on admin's own data

### For Superusers
- **GET requests**: Return all data (no filtering)
- **POST/PUT/DELETE requests**: Can manage everything

## Frontend Behavior

### Empty State
- New admin sees empty dashboard
- All tabs show "No data" messages
- Admin can start creating their first center

### Data Display
- Admin only sees their own data
- Cannot see other admins' data
- Complete isolation in UI

## Migration Notes

If you have existing data:
1. Run: `python manage.py migrate`
2. Existing centers need `owner` field set
3. Run: `python manage.py setup_admin_centers` (if needed)
4. Each admin should own at least one center

## Benefits

✅ **True SaaS**: Each admin is a separate customer
✅ **Scalable**: Easy to add new customers (admins)
✅ **Flexible**: Admins can have multiple branches/centers
✅ **Secure**: Complete data isolation at database level
✅ **Full Featured**: Each admin has access to all features

