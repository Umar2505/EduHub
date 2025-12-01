"""
Custom permissions for EduHub.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission check for Admin role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsTeacher(permissions.BasePermission):
    """Permission check for Teacher role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'teacher'


class IsStudent(permissions.BasePermission):
    """Permission check for Student role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'student'


class IsAdminOrTeacher(permissions.BasePermission):
    """Permission check for Admin or Teacher role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'teacher']

