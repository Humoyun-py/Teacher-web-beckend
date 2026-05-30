"""Admin configuration for teachers app."""

from django.contrib import admin
from .models import Teacher, Subject, SchoolClass


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'grade', 'section', 'room', 'floor', 'capacity', 'is_active']
    list_filter = ['grade', 'is_active', 'floor']
    search_fields = ['name', 'room']


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'employee_id', 'status', 'experience_years', 'created_at']
    list_filter = ['status', 'subjects']
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']
    filter_horizontal = ['subjects', 'classes']
