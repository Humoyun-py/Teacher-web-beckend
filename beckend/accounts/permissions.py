"""
Custom permissions for role-based access control.
Supports Admin, Teacher, and IT Support roles.
"""

from rest_framework import permissions


class IsITSupport(permissions.BasePermission):
    """Only allows access to IT Support (super admin) users."""
    message = 'Faqat IT Support foydalanuvchilar uchun.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'it_support'
        )


class IsAdminOrITSupport(permissions.BasePermission):
    """Only allows access to admin or IT Support users."""
    message = 'Faqat admin yoki IT Support foydalanuvchilar uchun.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ('admin', 'it_support')
                or request.user.is_superuser
            )
        )


class IsAdmin(permissions.BasePermission):
    """Only allows access to admin users (includes IT Support and superuser)."""
    message = 'Faqat admin foydalanuvchilar uchun.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ('admin', 'it_support')
                or request.user.is_superuser
            )
        )


class IsTeacher(permissions.BasePermission):
    """Only allows access to teacher, admin, or IT Support users."""
    message = 'Faqat teacher yoki admin foydalanuvchilar uchun.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, 'role', None)
        return role in ('teacher', 'admin', 'it_support')


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin/IT Support can do anything, others can only read."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in ('admin', 'it_support')
                or request.user.is_superuser
            )
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object owner, admin, or IT Support can access."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'it_support') or request.user.is_superuser:
            return True
        # Check if the object has a user/teacher field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'teacher'):
            return obj.teacher.user == request.user
        return False
