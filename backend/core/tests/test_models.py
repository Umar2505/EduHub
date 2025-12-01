"""
Unit tests for core models.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from core.models import Center, ClassGroup, Attendance

CustomUser = get_user_model()


@pytest.fixture
def admin_user():
    """Create an admin user."""
    return CustomUser.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123',
        role='admin'
    )


@pytest.fixture
def teacher_user():
    """Create a teacher user."""
    return CustomUser.objects.create_user(
        username='teacher',
        email='teacher@test.com',
        password='testpass123',
        role='teacher',
        first_name='John',
        last_name='Teacher'
    )


@pytest.fixture
def student_user():
    """Create a student user."""
    return CustomUser.objects.create_user(
        username='student',
        email='student@test.com',
        password='testpass123',
        role='student',
        first_name='Jane',
        last_name='Student'
    )


@pytest.fixture
def center():
    """Create a center."""
    return Center.objects.create(
        name='Test Center',
        address='123 Test St'
    )


@pytest.fixture
def class_group(center, teacher_user, student_user):
    """Create a class group."""
    group = ClassGroup.objects.create(
        name='Math 101',
        center=center,
        teacher=teacher_user
    )
    group.students.add(student_user)
    return group


@pytest.mark.django_db
class TestCustomUser:
    """Tests for CustomUser model."""
    
    def test_create_user(self):
        """Test user creation."""
        user = CustomUser.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='student'
        )
        assert user.username == 'testuser'
        assert user.role == 'student'
        assert user.check_password('testpass123')
    
    def test_user_str(self, student_user):
        """Test user string representation."""
        assert str(student_user) == 'student (student)'


@pytest.mark.django_db
class TestCenter:
    """Tests for Center model."""
    
    def test_create_center(self):
        """Test center creation."""
        center = Center.objects.create(
            name='New Center',
            address='456 New St'
        )
        assert center.name == 'New Center'
        assert str(center) == 'New Center'


@pytest.mark.django_db
class TestClassGroup:
    """Tests for ClassGroup model."""
    
    def test_create_class_group(self, center, teacher_user):
        """Test class group creation."""
        group = ClassGroup.objects.create(
            name='Science 101',
            center=center,
            teacher=teacher_user
        )
        assert group.name == 'Science 101'
        assert group.center == center
        assert group.teacher == teacher_user
    
    def test_class_group_str(self, class_group):
        """Test class group string representation."""
        assert 'Math 101' in str(class_group)
        assert 'Test Center' in str(class_group)
    
    def test_add_students(self, class_group, admin_user):
        """Test adding students to class group."""
        student2 = CustomUser.objects.create_user(
            username='student2',
            email='student2@test.com',
            password='testpass123',
            role='student'
        )
        class_group.students.add(student2)
        assert class_group.students.count() == 2


@pytest.mark.django_db
class TestAttendance:
    """Tests for Attendance model."""
    
    def test_create_attendance(self, class_group, student_user):
        """Test attendance creation."""
        today = timezone.now().date()
        attendance = Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='present'
        )
        assert attendance.student == student_user
        assert attendance.class_group == class_group
        assert attendance.status == 'present'
    
    def test_attendance_str(self, class_group, student_user):
        """Test attendance string representation."""
        today = timezone.now().date()
        attendance = Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='late'
        )
        assert 'student' in str(attendance)
        assert 'Math 101' in str(attendance)
        assert 'late' in str(attendance)
    
    def test_unique_attendance(self, class_group, student_user):
        """Test that attendance is unique per student, class, and date."""
        today = timezone.now().date()
        Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='present'
        )
        # Try to create duplicate
        with pytest.raises(Exception):  # IntegrityError
            Attendance.objects.create(
                student=student_user,
                class_group=class_group,
                date=today,
                status='absent'
            )
    
    def test_update_attendance(self, class_group, student_user):
        """Test updating attendance status."""
        today = timezone.now().date()
        attendance = Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='present'
        )
        attendance.status = 'late'
        attendance.save()
        assert Attendance.objects.get(id=attendance.id).status == 'late'

