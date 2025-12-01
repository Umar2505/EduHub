"""
Serializers for core models.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    CustomUser, Center, ClassGroup, Attendance, Schedule,
    Grade, Message, Announcement, Resource, Invoice, Payment,
    Homework, HomeworkSubmission
)


class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser."""
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'password', 'avatar', 'center', 'children']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
            'email': {'required': False},
        }
    
    def create(self, validated_data):
        from .utils import generate_username, generate_random_password, send_user_credentials_email
        from .models import CustomUser
        import random
        import string
        
        password = validated_data.pop('password', None)
        
        # Generate username if not provided
        if not validated_data.get('username'):
            if validated_data.get('first_name') and validated_data.get('last_name'):
                suggested_username = generate_username(validated_data['first_name'], validated_data['last_name'])
                if suggested_username:
                    # Check if username exists, if so add more random digits
                    base_username = suggested_username
                    counter = 1
                    while CustomUser.objects.filter(username=suggested_username).exists():
                        suggested_username = f"{base_username[:-3]}{counter:03d}"
                        counter += 1
                    validated_data['username'] = suggested_username
            else:
                # Generate a random username if no name provided
                while True:
                    random_username = 'user_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
                    if not CustomUser.objects.filter(username=random_username).exists():
                        validated_data['username'] = random_username
                        break
        
        # Ensure username is set
        if not validated_data.get('username'):
            raise serializers.ValidationError({'username': 'Username is required'})
        
        # Generate password if not provided
        if not password:
            password = generate_random_password()
        
        # Auto-assign center for non-admin users if created by an admin
        request = self.context.get('request') if self.context else None
        if request and request.user and request.user.role == 'admin':
            if validated_data.get('role') != 'admin':
                # Assign new user to one of the admin's owned centers
                from .models import Center
                admin_centers = Center.objects.filter(owner=request.user)
                if admin_centers.exists():
                    # Use the first center (admin can change it later)
                    validated_data['center'] = admin_centers.first()
                else:
                    # Auto-create a default center for the admin
                    default_center = Center.objects.create(
                        name=f"{request.user.get_full_name() or request.user.username}'s Main Center",
                        owner=request.user,
                        address=''
                    )
                    validated_data['center'] = default_center
        
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Note: We don't auto-create a center for new admins
        # They will create their own centers/branches when they start using the system
        # This allows them to have multiple centers (branches) from the start
        
        # Send email with credentials (fail silently if email sending fails)
        try:
            email_from = None
            if self.context and self.context.get('request'):
                email_from = getattr(self.context.get('request'), 'email_from', None)
            send_user_credentials_email(user, password, email_from)
        except Exception as e:
            # Log error but don't fail user creation if email fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send credentials email to {user.email}: {e}")
        
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CenterSerializer(serializers.ModelSerializer):
    """Serializer for Center."""
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Center
        fields = ['id', 'name', 'address', 'owner', 'owner_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'owner']
    
    def get_owner_name(self, obj):
        return f"{obj.owner.get_full_name() or obj.owner.username}" if obj.owner else None


class ClassGroupSerializer(serializers.ModelSerializer):
    """Serializer for ClassGroup."""
    center_name = serializers.CharField(source='center.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassGroup
        fields = [
            'id', 'name', 'subject', 'center', 'center_name', 'teacher', 'teacher_name',
            'students', 'student_count', 'room', 'cost', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        return f"{obj.teacher.get_full_name()}" if obj.teacher else None
    
    def get_student_count(self, obj):
        return obj.students.count()


class ClassGroupListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ClassGroup list."""
    center_name = serializers.CharField(source='center.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    
    class Meta:
        model = ClassGroup
        fields = ['id', 'name', 'center_name', 'teacher_name', 'student_count']
    
    def get_teacher_name(self, obj):
        return f"{obj.teacher.get_full_name()}" if obj.teacher else None


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance."""
    student_name = serializers.SerializerMethodField()
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'class_group', 'class_group_name',
            'date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.get_full_name() or obj.student.username}"


class AttendanceCreateSerializer(serializers.Serializer):
    """Serializer for bulk attendance creation."""
    class_group = serializers.PrimaryKeyRelatedField(queryset=ClassGroup.objects.all())
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_attendances(self, value):
        """Validate attendance data structure."""
        for att in value:
            if 'student_id' not in att or 'status' not in att:
                raise serializers.ValidationError("Each attendance must have 'student_id' and 'status'.")
            if att['status'] not in ['present', 'absent', 'late']:
                raise serializers.ValidationError(f"Invalid status: {att['status']}")
        return value
    
    def create(self, validated_data):
        """Create or update attendance records."""
        class_group = validated_data['class_group']
        date = validated_data['date']
        attendances_data = validated_data['attendances']
        
        created = []
        for att_data in attendances_data:
            student_id = att_data['student_id']
            status = att_data['status']
            
            attendance, created_flag = Attendance.objects.update_or_create(
                student_id=student_id,
                class_group=class_group,
                date=date,
                defaults={'status': status}
            )
            created.append(attendance)
        
        return created


class ScheduleSerializer(serializers.ModelSerializer):
    """Serializer for Schedule."""
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Schedule
        fields = [
            'id', 'class_group', 'class_group_name', 'day_of_week', 'day_display',
            'start_time', 'end_time', 'room', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class GradeSerializer(serializers.ModelSerializer):
    """Serializer for Grade."""
    student_name = serializers.SerializerMethodField()
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    percentage = serializers.ReadOnlyField()
    grade_type_display = serializers.CharField(source='get_grade_type_display', read_only=True)
    
    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'class_group', 'class_group_name',
            'grade_type', 'grade_type_display', 'title', 'score', 'max_score',
            'percentage', 'date', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'percentage']
    
    def get_student_name(self, obj):
        return f"{obj.student.get_full_name() or obj.student.username}"


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message."""
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'recipient', 'recipient_name',
            'subject', 'body', 'is_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'sender']
    
    def get_sender_name(self, obj):
        return f"{obj.sender.get_full_name() or obj.sender.username}"
    
    def get_recipient_name(self, obj):
        return f"{obj.recipient.get_full_name() or obj.recipient.username}"


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for Announcement."""
    author_name = serializers.SerializerMethodField()
    center_name = serializers.CharField(source='center.name', read_only=True)
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'center', 'center_name', 'class_group', 'class_group_name',
            'author', 'author_name', 'title', 'content', 'is_pinned',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'author']
    
    def get_author_name(self, obj):
        return f"{obj.author.get_full_name() or obj.author.username}"


class ResourceSerializer(serializers.ModelSerializer):
    """Serializer for Resource."""
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Resource
        fields = [
            'id', 'class_group', 'class_group_name', 'title', 'description',
            'resource_type', 'resource_type_display', 'file', 'file_url', 'url',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'uploaded_by']
    
    def get_uploaded_by_name(self, obj):
        return f"{obj.uploaded_by.get_full_name() or obj.uploaded_by.username}"
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice."""
    student_name = serializers.SerializerMethodField()
    center_name = serializers.CharField(source='center.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payments = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'student', 'student_name', 'center', 'center_name',
            'invoice_number', 'amount', 'due_date', 'status', 'status_display',
            'description', 'paid_at', 'payment_method', 'payments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'invoice_number']
    
    def get_student_name(self, obj):
        return f"{obj.student.get_full_name() or obj.student.username}"
    
    def get_payments(self, obj):
        return PaymentSerializer(obj.payments.all(), many=True).data


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment."""
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_number', 'amount', 'payment_method',
            'payment_method_display', 'transaction_id', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']


class HomeworkSerializer(serializers.ModelSerializer):
    """Serializer for Homework."""
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Homework
        fields = [
            'id', 'class_group', 'class_group_name', 'title', 'description',
            'due_date', 'assigned_date', 'max_points', 'file', 'file_url', 'created_by', 'created_by_name',
            'submission_count', 'completed_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'assigned_date', 'created_by']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.get_full_name() or obj.created_by.username}"
    
    def get_submission_count(self, obj):
        return obj.submissions.count()
    
    def get_completed_count(self, obj):
        return obj.submissions.filter(is_completed=True).count()
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for HomeworkSubmission."""
    homework_title = serializers.CharField(source='homework.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    class_group_name = serializers.CharField(source='homework.class_group.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = HomeworkSubmission
        fields = [
            'id', 'homework', 'homework_title', 'student', 'student_name',
            'class_group_name', 'is_completed', 'submitted_at', 'file', 'file_url', 'notes',
            'score', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'submitted_at', 'student']
    
    def get_student_name(self, obj):
        return f"{obj.student.get_full_name() or obj.student.username}"
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def update(self, instance, validated_data):
        """Update submission and set submitted_at when marked as completed."""
        if validated_data.get('is_completed') and not instance.is_completed:
            from django.utils import timezone
            validated_data['submitted_at'] = timezone.now()
        return super().update(instance, validated_data)

