"""
Core models for EduHub application.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    """Custom user model with role field."""
    ROLE_CHOICES = [
        ('admin', _('Admin')),
        ('teacher', _('Teacher')),
        ('student', _('Student')),
        ('parent', _('Parent')),
    ]
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student',
        verbose_name=_('Role')
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name=_('Phone'))
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name=_('Avatar'))
    center = models.ForeignKey(
        'Center',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name=_('Center')
    )
    # For parents: link to their children (students)
    children = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        limit_choices_to={'role': 'student'},
        related_name='parents',
        verbose_name=_('Children')
    )
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class Center(models.Model):
    """Educational center model - each admin has their own center (tenant isolation)."""
    name = models.CharField(max_length=200, verbose_name=_('Name'))
    address = models.TextField(blank=True, verbose_name=_('Address'))
    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='owned_centers',
        limit_choices_to={'role': 'admin'},
        null=True,
        blank=True,
        verbose_name=_('Owner'),
        help_text=_('Admin who owns this center (for tenant isolation)')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Center')
        verbose_name_plural = _('Centers')
        ordering = ['name']
        indexes = [
            models.Index(fields=['owner']),
        ]
    
    def __str__(self):
        return self.name


class ClassGroup(models.Model):
    """Class/Group model."""
    name = models.CharField(max_length=100, verbose_name=_('Name'))
    subject = models.CharField(max_length=100, blank=True, verbose_name=_('Subject'))
    center = models.ForeignKey(
        Center,
        on_delete=models.CASCADE,
        related_name='class_groups',
        verbose_name=_('Center')
    )
    teacher = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'teacher'},
        related_name='taught_classes',
        verbose_name=_('Teacher')
    )
    students = models.ManyToManyField(
        CustomUser,
        limit_choices_to={'role': 'student'},
        related_name='enrolled_classes',
        blank=True,
        verbose_name=_('Students')
    )
    room = models.CharField(max_length=50, blank=True, verbose_name=_('Room'))
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name=_('Cost'),
        help_text=_('Cost per student for this class')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Class Group')
        verbose_name_plural = _('Class Groups')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.center.name})"


class Attendance(models.Model):
    """Attendance model for tracking student attendance."""
    STATUS_CHOICES = [
        ('present', _('Present')),
        ('absent', _('Absent')),
        ('late', _('Late')),
    ]
    
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='attendances',
        verbose_name=_('Student')
    )
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='attendances',
        verbose_name=_('Class Group')
    )
    date = models.DateField(verbose_name=_('Date'))
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='absent',
        verbose_name=_('Status')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Attendance')
        verbose_name_plural = _('Attendances')
        unique_together = [['student', 'class_group', 'date']]
        ordering = ['-date', 'student']
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['class_group', 'date']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.class_group.name} - {self.date} - {self.status}"


class Schedule(models.Model):
    """Class schedule/timetable model."""
    DAY_CHOICES = [
        ('monday', _('Monday')),
        ('tuesday', _('Tuesday')),
        ('wednesday', _('Wednesday')),
        ('thursday', _('Thursday')),
        ('friday', _('Friday')),
        ('saturday', _('Saturday')),
        ('sunday', _('Sunday')),
    ]
    
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name=_('Class Group')
    )
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES, verbose_name=_('Day'))
    start_time = models.TimeField(verbose_name=_('Start Time'))
    end_time = models.TimeField(verbose_name=_('End Time'))
    room = models.CharField(max_length=50, blank=True, verbose_name=_('Room'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Schedule')
        verbose_name_plural = _('Schedules')
        ordering = ['day_of_week', 'start_time']
        unique_together = [['class_group', 'day_of_week', 'start_time']]
    
    def __str__(self):
        return f"{self.class_group.name} - {self.get_day_of_week_display()} {self.start_time}"


class Grade(models.Model):
    """Grade/evaluation model."""
    GRADE_TYPES = [
        ('homework', _('Homework')),
        ('quiz', _('Quiz')),
        ('midterm', _('Midterm')),
        ('final', _('Final')),
        ('project', _('Project')),
        ('participation', _('Participation')),
        ('other', _('Other')),
    ]
    
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='grades',
        verbose_name=_('Student')
    )
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='grades',
        verbose_name=_('Class Group')
    )
    grade_type = models.CharField(max_length=20, choices=GRADE_TYPES, verbose_name=_('Grade Type'))
    title = models.CharField(max_length=200, verbose_name=_('Title'))
    score = models.DecimalField(max_digits=5, decimal_places=2, verbose_name=_('Score'))
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100, verbose_name=_('Max Score'))
    date = models.DateField(verbose_name=_('Date'))
    notes = models.TextField(blank=True, verbose_name=_('Notes'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Grade')
        verbose_name_plural = _('Grades')
        ordering = ['-date', 'student']
        indexes = [
            models.Index(fields=['student', 'class_group']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.title} - {self.score}/{self.max_score}"
    
    @property
    def percentage(self):
        """Calculate percentage score."""
        if self.max_score > 0:
            return (self.score / self.max_score) * 100
        return 0


class Message(models.Model):
    """Internal messaging model."""
    sender = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name=_('Sender')
    )
    recipient = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='received_messages',
        verbose_name=_('Recipient')
    )
    subject = models.CharField(max_length=200, verbose_name=_('Subject'))
    body = models.TextField(verbose_name=_('Body'))
    is_read = models.BooleanField(default=False, verbose_name=_('Is Read'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['sender']),
        ]
    
    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.subject}"


class Announcement(models.Model):
    """Announcement board model."""
    center = models.ForeignKey(
        Center,
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        verbose_name=_('Center')
    )
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        verbose_name=_('Class Group')
    )
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='announcements',
        verbose_name=_('Author')
    )
    title = models.CharField(max_length=200, verbose_name=_('Title'))
    content = models.TextField(verbose_name=_('Content'))
    is_pinned = models.BooleanField(default=False, verbose_name=_('Is Pinned'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Announcement')
        verbose_name_plural = _('Announcements')
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.author.username}"


class Resource(models.Model):
    """Learning materials/resources model."""
    RESOURCE_TYPES = [
        ('pdf', _('PDF')),
        ('video', _('Video')),
        ('link', _('Link')),
        ('document', _('Document')),
        ('image', _('Image')),
        ('other', _('Other')),
    ]
    
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='resources',
        verbose_name=_('Class Group')
    )
    title = models.CharField(max_length=200, verbose_name=_('Title'))
    description = models.TextField(blank=True, verbose_name=_('Description'))
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES, verbose_name=_('Type'))
    file = models.FileField(upload_to='resources/', blank=True, null=True, verbose_name=_('File'))
    url = models.URLField(blank=True, verbose_name=_('URL'))
    uploaded_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='uploaded_resources',
        verbose_name=_('Uploaded By')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Resource')
        verbose_name_plural = _('Resources')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.class_group.name}"


class Invoice(models.Model):
    """Billing/invoice model."""
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('sent', _('Sent')),
        ('paid', _('Paid')),
        ('overdue', _('Overdue')),
        ('cancelled', _('Cancelled')),
    ]
    
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='invoices',
        verbose_name=_('Student')
    )
    center = models.ForeignKey(
        Center,
        on_delete=models.CASCADE,
        related_name='invoices',
        verbose_name=_('Center')
    )
    invoice_number = models.CharField(max_length=50, unique=True, verbose_name=_('Invoice Number'))
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Amount'))
    due_date = models.DateField(verbose_name=_('Due Date'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name=_('Status'))
    description = models.TextField(blank=True, verbose_name=_('Description'))
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Paid At'))
    payment_method = models.CharField(max_length=50, blank=True, verbose_name=_('Payment Method'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.student.username}"


class Payment(models.Model):
    """Payment record model."""
    PAYMENT_METHODS = [
        ('cash', _('Cash')),
        ('card', _('Card')),
        ('bank_transfer', _('Bank Transfer')),
        ('stripe', _('Stripe')),
        ('paypal', _('PayPal')),
        ('other', _('Other')),
    ]
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('Invoice')
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Amount'))
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, verbose_name=_('Payment Method'))
    transaction_id = models.CharField(max_length=100, blank=True, verbose_name=_('Transaction ID'))
    notes = models.TextField(blank=True, verbose_name=_('Notes'))
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.amount} - {self.invoice.invoice_number}"


class Homework(models.Model):
    """Homework model for teachers to assign and track homework."""
    class_group = models.ForeignKey(
        ClassGroup,
        on_delete=models.CASCADE,
        related_name='homeworks',
        verbose_name=_('Class Group')
    )
    title = models.CharField(max_length=200, verbose_name=_('Title'))
    description = models.TextField(blank=True, verbose_name=_('Description'))
    due_date = models.DateField(verbose_name=_('Due Date'))
    assigned_date = models.DateField(auto_now_add=True, verbose_name=_('Assigned Date'))
    max_points = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=100.00,
        verbose_name=_('Max Points'),
        help_text=_('Maximum points for this homework')
    )
    file = models.FileField(upload_to='homeworks/assignments/', blank=True, null=True, verbose_name=_('Attachment'))
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'teacher'},
        related_name='created_homeworks',
        verbose_name=_('Created By')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Homework')
        verbose_name_plural = _('Homeworks')
        ordering = ['-due_date', '-created_at']
        indexes = [
            models.Index(fields=['class_group', 'due_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.class_group.name}"


class HomeworkSubmission(models.Model):
    """Student homework submission and completion tracking."""
    homework = models.ForeignKey(
        Homework,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name=_('Homework')
    )
    student = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'},
        related_name='homework_submissions',
        verbose_name=_('Student')
    )
    is_completed = models.BooleanField(default=False, verbose_name=_('Is Completed'))
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Submitted At'))
    file = models.FileField(upload_to='homeworks/submissions/', blank=True, null=True, verbose_name=_('Submission File'))
    notes = models.TextField(blank=True, verbose_name=_('Notes'))
    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Score'),
        help_text=_('Score given by teacher (out of homework max_points)')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Homework Submission')
        verbose_name_plural = _('Homework Submissions')
        unique_together = [['homework', 'student']]
        ordering = ['-submitted_at', 'student']
        indexes = [
            models.Index(fields=['homework', 'student']),
            models.Index(fields=['is_completed']),
        ]
    
    def __str__(self):
        status = 'Completed' if self.is_completed else 'Pending'
        return f"{self.student.username} - {self.homework.title} ({status})"

