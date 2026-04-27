"""Admin configuration for attendance app."""

from django.contrib import admin
from .models import QRCode, Attendance


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'date', 'is_active', 'expires_at', 'created_at']
    list_filter = ['is_active', 'date']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'date', 'check_in_time', 'status', 'is_late', 'late_minutes']
    list_filter = ['status', 'is_late', 'date']
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name']
    date_hierarchy = 'date'
