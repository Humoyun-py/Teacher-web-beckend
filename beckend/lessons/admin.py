"""Admin configuration for lessons app."""

from django.contrib import admin
from .models import LessonSchedule, Lesson


@admin.register(LessonSchedule)
class LessonScheduleAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'subject', 'school_class', 'day_of_week', 'start_time', 'end_time', 'room', 'is_active']
    list_filter = ['day_of_week', 'is_active', 'subject']
    search_fields = ['teacher__user__first_name', 'subject__name', 'school_class__name']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'subject', 'school_class', 'date', 'scheduled_start', 'status', 'started_late']
    list_filter = ['status', 'started_late', 'date', 'subject']
    search_fields = ['teacher__user__first_name', 'subject__name']
    date_hierarchy = 'date'
