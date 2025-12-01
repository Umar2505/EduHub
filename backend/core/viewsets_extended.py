"""
Extended ViewSets for additional core models.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Schedule, Grade, Message, Announcement, Resource, Invoice, Payment,
    Homework, HomeworkSubmission
)
from .serializers import (
    ScheduleSerializer, GradeSerializer, MessageSerializer,
    AnnouncementSerializer, ResourceSerializer, InvoiceSerializer, PaymentSerializer,
    CustomUserSerializer, HomeworkSerializer, HomeworkSubmissionSerializer
)
from .permissions import IsAdmin, IsTeacher, IsStudent, IsAdminOrTeacher


class ScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for Schedule."""
    queryset = Schedule.objects.select_related('class_group')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter schedules based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'teacher':
            queryset = queryset.filter(class_group__teacher=user)
        elif user.role == 'student':
            queryset = queryset.filter(class_group__students=user)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see schedules from their owned centers
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(class_group__center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        class_group_id = self.request.query_params.get('class_group')
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        return queryset
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        """Get weekly timetable for current user."""
        user = request.user
        schedules = self.get_queryset()
        
        # Group by day
        weekly_data = {}
        for schedule in schedules:
            day = schedule.day_of_week
            if day not in weekly_data:
                weekly_data[day] = []
            weekly_data[day].append(ScheduleSerializer(schedule).data)
        
        return Response(weekly_data)


class GradeViewSet(viewsets.ModelViewSet):
    """ViewSet for Grade."""
    queryset = Grade.objects.select_related('student', 'class_group')
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter grades based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            queryset = queryset.filter(class_group__teacher=user)
        elif user.role == 'parent':
            # Parents see their children's grades
            children = user.children.all()
            queryset = queryset.filter(student__in=children)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see grades from their owned centers
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(class_group__center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        class_group_id = self.request.query_params.get('class_group')
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get grade statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total_grades': queryset.count(),
            'average_score': queryset.aggregate(Avg('score'))['score__avg'] or 0,
            'by_type': {},
        }
        
        # Group by grade type
        for grade_type, _ in Grade.GRADE_TYPES:
            type_grades = queryset.filter(grade_type=grade_type)
            stats['by_type'][grade_type] = {
                'count': type_grades.count(),
                'average': type_grades.aggregate(Avg('score'))['score__avg'] or 0,
            }
        
        return Response(stats)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Message."""
    queryset = Message.objects.select_related('sender', 'recipient')
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter messages for current user. For admins, only show messages between users in their centers."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # For admins, only show messages between users in their owned centers
        if user.role == 'admin':
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                # Only messages where both sender and recipient are in admin's centers
                queryset = queryset.filter(
                    Q(sender__center__in=admin_centers) & Q(recipient__center__in=admin_centers)
                )
            else:
                queryset = queryset.none()
        else:
            # Regular users see messages they sent or received
            queryset = queryset.filter(Q(sender=user) | Q(recipient=user))
        
        # Filter by inbox/sent
        box = self.request.query_params.get('box', 'inbox')
        if box == 'inbox':
            queryset = queryset.filter(recipient=user)
        elif box == 'sent':
            queryset = queryset.filter(sender=user)
        
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Set sender to current user."""
        serializer.save(sender=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark message as read."""
        message = self.get_object()
        if message.recipient == request.user:
            message.is_read = True
            message.save()
            return Response({'status': 'marked as read'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread messages."""
        count = Message.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'count': count})


class AnnouncementViewSet(viewsets.ModelViewSet):
    """ViewSet for Announcement."""
    queryset = Announcement.objects.select_related('author', 'center', 'class_group')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter announcements based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Tenant isolation: Admins only see announcements from their owned centers
        if user.role == 'admin':
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        elif user.center:
            # Other roles filter by center if they have one
            queryset = queryset.filter(
                Q(center=user.center) | Q(center__isnull=True)
            )
        
        # Filter by class if student/teacher
        if user.role == 'student':
            queryset = queryset.filter(
                Q(class_group__students=user) | Q(class_group__isnull=True)
            )
        elif user.role == 'teacher':
            queryset = queryset.filter(
                Q(class_group__teacher=user) | Q(class_group__isnull=True)
            )
        
        center_id = self.request.query_params.get('center')
        if center_id:
            queryset = queryset.filter(center_id=center_id)
        
        class_group_id = self.request.query_params.get('class_group')
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set author and center to one of admin's owned centers."""
        user = self.request.user
        if user.role == 'admin':
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                # Use the first center if no center specified
                center = serializer.validated_data.get('center') or admin_centers.first()
                serializer.save(author=user, center=center)
            else:
                # Auto-create a default center
                default_center = Center.objects.create(
                    name=f"{user.get_full_name() or user.username}'s Main Center",
                    owner=user,
                    address=''
                )
                serializer.save(author=user, center=default_center)
        else:
            serializer.save(author=user)
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]


class ResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for Resource."""
    queryset = Resource.objects.select_related('class_group', 'uploaded_by')
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter resources based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'student':
            queryset = queryset.filter(class_group__students=user)
        elif user.role == 'teacher':
            queryset = queryset.filter(class_group__teacher=user)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see resources from their owned centers
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(class_group__center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        class_group_id = self.request.query_params.get('class_group')
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto-assign uploaded_by and validate class_group belongs to admin's centers."""
        user = self.request.user
        class_group = serializer.validated_data.get('class_group')
        
        # For admins, ensure the class_group belongs to one of their owned centers
        if user.role == 'admin' and class_group:
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                if class_group.center not in admin_centers:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only create resources for classes in your centers.")
            else:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You need to create a center first.")
        
        serializer.save(uploaded_by=user)
    
    def get_serializer_context(self):
        """Add request to serializer context for file URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set uploaded_by to current user."""
        serializer.save(uploaded_by=self.request.user)
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice."""
    queryset = Invoice.objects.select_related('student', 'center')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter invoices based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'parent':
            # Parents see their children's invoices
            children = user.children.all()
            queryset = queryset.filter(student__in=children)
        elif user.role == 'teacher':
            # Teachers see invoices for their classes
            queryset = queryset.filter(student__enrolled_classes__teacher=user).distinct()
        elif user.role == 'admin':
            # Tenant isolation: Admins only see invoices from their owned centers
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        """Auto-generate invoice number and assign center for admins."""
        user = self.request.user
        if user.role == 'admin':
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                # Use the center from student or first admin center
                center = serializer.validated_data.get('center') or admin_centers.first()
                serializer.validated_data['center'] = center
            else:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("You need to create a center first.")
        
        if not serializer.validated_data.get('invoice_number'):
            # Generate invoice number
            center = serializer.validated_data.get('center')
            prefix = center.name[:3].upper() if center else 'INV'
            timestamp = timezone.now().strftime('%Y%m%d')
            count = Invoice.objects.filter(
                invoice_number__startswith=f"{prefix}-{timestamp}"
            ).count() + 1
            invoice_number = f"{prefix}-{timestamp}-{count:04d}"
            serializer.save(invoice_number=invoice_number)
        else:
            serializer.save()
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid."""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save()
        return Response(InvoiceSerializer(invoice).data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_payment(self, request):
        """Create a payment request for student."""
        from .payment_service import get_payment_service
        from .models import Invoice, ClassGroup
        
        student = request.user
        class_group_id = request.data.get('class_group')
        payment_method = request.data.get('payment_method', 'click')  # 'click' or 'payme'
        amount = request.data.get('amount')
        
        if not class_group_id or not amount:
            return Response(
                {'error': 'class_group and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get class group
            class_group = ClassGroup.objects.get(id=class_group_id)
            
            # Check if student is enrolled
            if student not in class_group.students.all():
                return Response(
                    {'error': 'Student is not enrolled in this class'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create invoice if doesn't exist
            invoice, created = Invoice.objects.get_or_create(
                student=student,
                center=class_group.center,
                defaults={
                    'amount': float(amount),
                    'due_date': timezone.now().date(),
                    'status': 'draft',
                    'description': f'Payment for {class_group.name}',
                }
            )
            
            # Create payment request
            payment_service = get_payment_service(payment_method)
            payment_result = payment_service.create_payment(
                amount=amount,
                order_id=invoice.id,
                description=f'Payment for {class_group.name}'
            )
            
            if payment_result.get('success'):
                return Response({
                    'payment_url': payment_result.get('payment_url'),
                    'payment_id': payment_result.get('payment_id'),
                    'invoice_id': invoice.id,
                })
            else:
                return Response(
                    {'error': payment_result.get('error', 'Payment creation failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ClassGroup.DoesNotExist:
            return Response(
                {'error': 'Class group not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment."""
    queryset = Payment.objects.select_related('invoice')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Filter payments."""
        queryset = super().get_queryset()
        
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        return queryset


class HomeworkViewSet(viewsets.ModelViewSet):
    """ViewSet for Homework."""
    queryset = Homework.objects.select_related('class_group', 'created_by')
    serializer_class = HomeworkSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter homeworks based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'teacher':
            queryset = queryset.filter(created_by=user)
        elif user.role == 'student':
            queryset = queryset.filter(class_group__students=user)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see homeworks from their owned centers
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(class_group__center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        class_group_id = self.request.query_params.get('class_group')
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by and ensure class_group belongs to admin's owned centers."""
        user = self.request.user
        class_group = serializer.validated_data.get('class_group')
        
        # For admins, ensure the class_group belongs to one of their owned centers
        if user.role == 'admin' and class_group:
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                if class_group.center not in admin_centers:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You can only create homework for classes in your centers.")
            else:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You need to create a center first.")
        
        serializer.save(created_by=user)
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for a homework."""
        homework = self.get_object()
        submissions = homework.submissions.all()
        serializer = HomeworkSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class HomeworkSubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for HomeworkSubmission."""
    queryset = HomeworkSubmission.objects.select_related('homework', 'student')
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter submissions based on user role. Filter by center for tenant isolation."""
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            queryset = queryset.filter(homework__created_by=user)
        elif user.role == 'admin':
            # Tenant isolation: Admins only see submissions from their owned centers
            from .models import Center
            admin_centers = Center.objects.filter(owner=user)
            if admin_centers.exists():
                queryset = queryset.filter(homework__class_group__center__in=admin_centers)
            else:
                # If admin has no centers, show nothing (empty workspace)
                queryset = queryset.none()
        
        homework_id = self.request.query_params.get('homework')
        if homework_id:
            queryset = queryset.filter(homework_id=homework_id)
        
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        is_completed = self.request.query_params.get('is_completed')
        if is_completed is not None:
            queryset = queryset.filter(is_completed=is_completed.lower() == 'true')
        
        return queryset
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated()]
        elif self.action == 'destroy':
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Automatically assign student from request.user if user is a student."""
        user = self.request.user
        if user.role == 'student':
            is_completed = serializer.validated_data.get('is_completed', False)
            serializer.save(
                student=user,
                submitted_at=timezone.now() if is_completed else None
            )
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark submission as completed."""
        submission = self.get_object()
        submission.is_completed = True
        from django.utils import timezone
        submission.submitted_at = timezone.now()
        submission.save()
        serializer = self.get_serializer(submission)
        return Response(serializer.data)

