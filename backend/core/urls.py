"""
URL configuration for core app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import CustomUserViewSet, CenterViewSet, ClassGroupViewSet, AttendanceViewSet
from .viewsets_extended import (
    ScheduleViewSet, GradeViewSet, MessageViewSet,
    AnnouncementViewSet, ResourceViewSet, InvoiceViewSet, PaymentViewSet,
    HomeworkViewSet, HomeworkSubmissionViewSet
)

router = DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'centers', CenterViewSet, basename='center')
router.register(r'class-groups', ClassGroupViewSet, basename='classgroup')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'homeworks', HomeworkViewSet, basename='homework')
router.register(r'homework-submissions', HomeworkSubmissionViewSet, basename='homeworksubmission')

urlpatterns = [
    path('', include(router.urls)),
]

