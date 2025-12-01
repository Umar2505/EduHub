"""
ViewSets for core models.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
from .models import CustomUser, Center, ClassGroup, Attendance
from .serializers import (
    CustomUserSerializer, CenterSerializer, ClassGroupSerializer,
    ClassGroupListSerializer, AttendanceSerializer, AttendanceCreateSerializer
)
from .permissions import IsAdmin, IsTeacher, IsStudent, IsAdminOrTeacher


class CustomUserViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomUser."""
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Filter users by role if specified. Hide superusers from ordinary admins. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Hide superusers from ordinary admins (except the designated superuser)
        user = self.request.user
        if user and not user.is_superuser:
            # Exclude all superusers except the one with email rustamovumar0@gmail.com
            queryset = queryset.filter(
                ~Q(is_superuser=True) | Q(email='rustamovumar0@gmail.com', username='Umar')
            )
            
            # Tenant isolation: Admins only see users from their owned centers
            if user.role == 'admin':
                # Get all centers owned by this admin
                admin_centers = Center.objects.filter(owner=user)
                if admin_centers.exists():
                    queryset = queryset.filter(center__in=admin_centers)
                else:
                    # If admin has no centers, show nothing (empty workspace)
                    queryset = queryset.none()
        
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user info."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def suggest_credentials(self, request):
        """Suggest username and password based on first and last name."""
        from .utils import generate_username, generate_random_password
        
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not first_name or not last_name:
            return Response(
                {'error': 'first_name and last_name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        suggested_username = generate_username(first_name, last_name)
        suggested_password = generate_random_password()
        
        # Check if username exists
        if suggested_username and CustomUser.objects.filter(username=suggested_username).exists():
            base_username = suggested_username
            counter = 1
            while CustomUser.objects.filter(username=suggested_username).exists():
                suggested_username = f"{base_username[:-3]}{counter:03d}"
                counter += 1
        
        return Response({
            'suggested_username': suggested_username,
            'suggested_password': suggested_password
        })


class CenterViewSet(viewsets.ModelViewSet):
    """ViewSet for Center."""
    queryset = Center.objects.all()
    serializer_class = CenterSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Filter centers by owner for tenant isolation - admins only see their own center."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Superusers can see all centers
        if user.is_superuser:
            return queryset
        
        # Regular admins only see centers they own (can have multiple centers/branches)
        if user.role == 'admin':
            queryset = queryset.filter(owner=user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically assign the center owner to the current admin."""
        user = self.request.user
        if user.role == 'admin':
            # Admin can create multiple centers (branches)
            serializer.save(owner=user)
        else:
            serializer.save()


class ClassGroupViewSet(viewsets.ModelViewSet):
    """ViewSet for ClassGroup."""
    queryset = ClassGroup.objects.select_related('center', 'teacher').prefetch_related('students')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClassGroupListSerializer
        return ClassGroupSerializer
    
    def get_queryset(self):
        """Filter classes based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'teacher':
            queryset = queryset.filter(teacher=user)
        elif user.role == 'student':
            queryset = queryset.filter(students=user)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see classes from their owned centers
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically assign center to one of the admin's owned centers if not provided."""
        user = self.request.user
        if user.role == 'admin':
            # Check if center is already provided in validated_data
            center = serializer.validated_data.get('center')
            
            if center:
                # Verify the center belongs to the admin
                admin_centers = Center.objects.filter(owner=user)
                if center not in admin_centers:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only create classes in your own centers.")
                serializer.save()
            else:
                # Get admin's first center, or create one if none exists
                admin_centers = Center.objects.filter(owner=user)
                if admin_centers.exists():
                    # Use the first center (admin can change it later)
                    serializer.save(center=admin_centers.first())
                else:
                    # Auto-create a default center for the admin
                    default_center = Center.objects.create(
                        name=f"{user.get_full_name() or user.username}'s Main Center",
                        owner=user,
                        address=''
                    )
                    serializer.save(center=default_center)
        else:
            serializer.save()
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrTeacher])
    def students(self, request, pk=None):
        """Get students for a class group."""
        class_group = self.get_object()
        students = class_group.students.all()
        serializer = CustomUserSerializer(students, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdmin])
    def billing_summary(self, request):
        """Get billing summary showing all students and their total amounts owed."""
        from django.db.models import Sum, F
        from .models import Invoice
        
        # Tenant isolation: Only show students from admin's owned centers
        user = self.request.user
        if user.role == 'admin':
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                students = CustomUser.objects.filter(role='student', center__in=admin_centers)
            else:
                # If admin has no centers, return empty list
                return Response([])
        else:
            students = CustomUser.objects.filter(role='student')
        students = students.prefetch_related('enrolled_classes')
        
        billing_data = []
        for student in students:
            # Calculate total cost from enrolled classes
            total_cost = student.enrolled_classes.aggregate(
                total=Sum('cost')
            )['total'] or 0
            
            # Calculate total paid from invoices
            total_paid = Invoice.objects.filter(
                student=student,
                status='paid'
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # Calculate total owed (unpaid invoices)
            total_owed = Invoice.objects.filter(
                student=student
            ).exclude(
                status='paid'
            ).aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # If no invoices exist but student has classes with cost, show the cost as owed
            if total_owed == 0 and total_cost > 0:
                # Check if there are any invoices at all
                has_invoices = Invoice.objects.filter(student=student).exists()
                if not has_invoices:
                    total_owed = total_cost
            
            billing_data.append({
                'student_id': student.id,
                'student_name': student.get_full_name() or student.username,
                'username': student.username,
                'email': student.email,
                'total_cost': float(total_cost),
                'total_paid': float(total_paid),
                'total_owed': float(total_owed),
                'classes_count': student.enrolled_classes.count(),
            })
        
        # Sort by total_owed descending
        billing_data.sort(key=lambda x: x['total_owed'], reverse=True)
        
        return Response(billing_data)


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance."""
    queryset = Attendance.objects.select_related('student', 'class_group')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter attendance based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            # Teachers can see attendance for their classes
            queryset = queryset.filter(class_group__teacher=user)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see attendance from their owned centers
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(class_group__center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        # Filter by class_group if provided
        class_group_id = self.request.query_params.get('class_group')
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        # Filter by date if provided
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        return queryset
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'bulk_create']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        elif self.action == 'list':
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdminOrTeacher])
    def bulk_create(self, request):
        """Bulk create or update attendance records."""
        serializer = AttendanceCreateSerializer(data=request.data)
        if serializer.is_valid():
            attendances = serializer.save()
            response_serializer = AttendanceSerializer(attendances, many=True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsStudent])
    def my_attendance(self, request):
        """Get current student's attendance."""
        attendances = self.get_queryset().filter(student=request.user)
        serializer = self.get_serializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrTeacher])
    def report(self, request):
        """Generate attendance report."""
        class_group_id = request.query_params.get('class_group')
        student_id = request.query_params.get('student')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        month = request.query_params.get('month')  # Format: YYYY-MM
        
        queryset = self.get_queryset()
        
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        elif month:
            # Filter by month
            year, month_num = month.split('-')
            queryset = queryset.filter(date__year=year, date__month=month_num)
        
        # Calculate statistics
        total = queryset.count()
        present = queryset.filter(status='present').count()
        absent = queryset.filter(status='absent').count()
        late = queryset.filter(status='late').count()
        
        present_rate = (present / total * 100) if total > 0 else 0
        
        # Group by student
        by_student = {}
        for attendance in queryset:
            student_id = attendance.student.id
            if student_id not in by_student:
                by_student[student_id] = {
                    'student': attendance.student.username,
                    'student_name': f"{attendance.student.get_full_name() or attendance.student.username}",
                    'present': 0,
                    'absent': 0,
                    'late': 0,
                    'total': 0,
                }
            by_student[student_id][attendance.status] += 1
            by_student[student_id]['total'] += 1
        
        # Calculate rates for each student
        for student_data in by_student.values():
            if student_data['total'] > 0:
                student_data['present_rate'] = (student_data['present'] / student_data['total']) * 100
            else:
                student_data['present_rate'] = 0
        
        return Response({
            'summary': {
                'total': total,
                'present': present,
                'absent': absent,
                'late': late,
                'present_rate': round(present_rate, 2),
            },
            'by_student': list(by_student.values()),
        })

