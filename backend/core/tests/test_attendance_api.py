"""
Unit tests for attendance API endpoints.
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Center, ClassGroup, Attendance

CustomUser = get_user_model()


@pytest.fixture
def api_client():
    """Create API client."""
    return APIClient()


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
        role='teacher'
    )


@pytest.fixture
def student_user():
    """Create a student user."""
    return CustomUser.objects.create_user(
        username='student',
        email='student@test.com',
        password='testpass123',
        role='student'
    )


@pytest.fixture
def center():
    """Create a center."""
    return Center.objects.create(name='Test Center')


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


@pytest.fixture
def authenticated_admin(api_client, admin_user):
    """Authenticate as admin."""
    response = api_client.post('/api/token/', {
        'username': 'admin',
        'password': 'testpass123'
    })
    token = response.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def authenticated_teacher(api_client, teacher_user):
    """Authenticate as teacher."""
    response = api_client.post('/api/token/', {
        'username': 'teacher',
        'password': 'testpass123'
    })
    token = response.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def authenticated_student(api_client, student_user):
    """Authenticate as student."""
    response = api_client.post('/api/token/', {
        'username': 'student',
        'password': 'testpass123'
    })
    token = response.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.mark.django_db
class TestAttendanceAPI:
    """Tests for attendance API endpoints."""
    
    def test_list_attendance_as_student(self, authenticated_student, class_group, student_user):
        """Test student can list their own attendance."""
        today = timezone.now().date()
        Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='present'
        )
        
        response = authenticated_student.get('/api/attendances/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == 'present'
    
    def test_list_attendance_as_teacher(self, authenticated_teacher, class_group, student_user):
        """Test teacher can list attendance for their classes."""
        today = timezone.now().date()
        Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='late'
        )
        
        response = authenticated_teacher.get('/api/attendances/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
    
    def test_create_attendance_as_teacher(self, authenticated_teacher, class_group, student_user):
        """Test teacher can create attendance."""
        today = timezone.now().date()
        data = {
            'student': student_user.id,
            'class_group': class_group.id,
            'date': str(today),
            'status': 'present'
        }
        
        response = authenticated_teacher.post('/api/attendances/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'present'
    
    def test_bulk_create_attendance(self, authenticated_teacher, class_group, student_user):
        """Test bulk create attendance."""
        today = timezone.now().date()
        student2 = CustomUser.objects.create_user(
            username='student2',
            email='student2@test.com',
            password='testpass123',
            role='student'
        )
        class_group.students.add(student2)
        
        data = {
            'class_group': class_group.id,
            'date': str(today),
            'attendances': [
                {'student_id': student_user.id, 'status': 'present'},
                {'student_id': student2.id, 'status': 'late'}
            ]
        }
        
        response = authenticated_teacher.post('/api/attendances/bulk_create/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 2
    
    def test_student_cannot_create_attendance(self, authenticated_student, class_group, student_user):
        """Test student cannot create attendance."""
        today = timezone.now().date()
        data = {
            'student': student_user.id,
            'class_group': class_group.id,
            'date': str(today),
            'status': 'present'
        }
        
        response = authenticated_student.post('/api/attendances/', data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_my_attendance_endpoint(self, authenticated_student, class_group, student_user):
        """Test my_attendance endpoint for students."""
        today = timezone.now().date()
        Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='present'
        )
        
        response = authenticated_student.get('/api/attendances/my_attendance/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
    
    def test_filter_attendance_by_date(self, authenticated_student, class_group, student_user):
        """Test filtering attendance by date."""
        today = timezone.now().date()
        yesterday = today - timezone.timedelta(days=1)
        
        Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=today,
            status='present'
        )
        Attendance.objects.create(
            student=student_user,
            class_group=class_group,
            date=yesterday,
            status='absent'
        )
        
        response = authenticated_student.get(f'/api/attendances/?date={today}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == 'present'

