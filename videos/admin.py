"""Admin configuration for videos app."""

from django.contrib import admin
from .models import VideoProof

@admin.register(VideoProof)
class VideoProofAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'lesson', 'status', 'duration_seconds', 'file_size_mb', 'uploaded_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name']
