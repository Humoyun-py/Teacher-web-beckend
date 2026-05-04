"""
Custom permissions for role-based access control.
"""

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only allows access to admin users."""
    message = 'Faqat admin foydalanuvchilar uchun.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsTeacher(permissions.BasePermission):
    """Only allows access to teacher users."""
    message = 'Faqat teacher foydalanuvchilar uchun.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'teacher'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything, others can only read."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object owner or admin can access."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        # Check if the object has a user/teacher field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'teacher'):
            return obj.teacher.user == request.user
        return False
