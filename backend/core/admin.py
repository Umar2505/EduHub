"""
Admin configuration for core models.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Center, ClassGroup, Attendance, Schedule,
    Grade, Message, Announcement, Resource, Invoice, Payment,
    Homework, HomeworkSubmission
)


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin interface for CustomUser."""
    list_display = ['username', 'email', 'role', 'first_name', 'last_name']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'avatar', 'center', 'children')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'center')}),
    )
    filter_horizontal = ['children']


@admin.register(Center)
class CenterAdmin(admin.ModelAdmin):
    """Admin interface for Center."""
    list_display = ['name', 'address', 'created_at']
    search_fields = ['name', 'address']


@admin.register(ClassGroup)
class ClassGroupAdmin(admin.ModelAdmin):
    """Admin interface for ClassGroup."""
    list_display = ['name', 'center', 'teacher', 'created_at']
    list_filter = ['center', 'teacher']
    search_fields = ['name', 'center__name']
    filter_horizontal = ['students']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    """Admin interface for Attendance."""
    list_display = ['student', 'class_group', 'date', 'status', 'created_at']
    list_filter = ['status', 'date', 'class_group']
    search_fields = ['student__username', 'class_group__name']
    date_hierarchy = 'date'


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """Admin interface for Schedule."""
    list_display = ['class_group', 'day_of_week', 'start_time', 'end_time', 'room']
    list_filter = ['day_of_week', 'class_group']
    search_fields = ['class_group__name']


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    """Admin interface for Grade."""
    list_display = ['student', 'class_group', 'title', 'score', 'max_score', 'grade_type', 'date']
    list_filter = ['grade_type', 'date', 'class_group']
    search_fields = ['student__username', 'title', 'class_group__name']
    date_hierarchy = 'date'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin interface for Message."""
    list_display = ['sender', 'recipient', 'subject', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['subject', 'body', 'sender__username', 'recipient__username']
    date_hierarchy = 'created_at'


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    """Admin interface for Announcement."""
    list_display = ['title', 'author', 'center', 'class_group', 'is_pinned', 'created_at']
    list_filter = ['is_pinned', 'created_at', 'center']
    search_fields = ['title', 'content', 'author__username']
    date_hierarchy = 'created_at'


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    """Admin interface for Resource."""
    list_display = ['title', 'class_group', 'resource_type', 'uploaded_by', 'created_at']
    list_filter = ['resource_type', 'created_at', 'class_group']
    search_fields = ['title', 'description', 'class_group__name']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin interface for Invoice."""
    list_display = ['invoice_number', 'student', 'center', 'amount', 'status', 'due_date', 'created_at']
    list_filter = ['status', 'due_date', 'center']
    search_fields = ['invoice_number', 'student__username']
    date_hierarchy = 'created_at'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment."""
    list_display = ['invoice', 'amount', 'payment_method', 'transaction_id', 'created_at']
    list_filter = ['payment_method', 'created_at']
    search_fields = ['invoice__invoice_number', 'transaction_id']
    date_hierarchy = 'created_at'


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    """Admin interface for Homework."""
    list_display = ['title', 'class_group', 'created_by', 'due_date', 'assigned_date', 'created_at']
    list_filter = ['due_date', 'assigned_date', 'class_group']
    search_fields = ['title', 'description', 'class_group__name']
    date_hierarchy = 'due_date'


@admin.register(HomeworkSubmission)
class HomeworkSubmissionAdmin(admin.ModelAdmin):
    """Admin interface for HomeworkSubmission."""
    list_display = ['homework', 'student', 'is_completed', 'submitted_at', 'created_at']
    list_filter = ['is_completed', 'submitted_at', 'homework']
    search_fields = ['homework__title', 'student__username']
    date_hierarchy = 'submitted_at'

