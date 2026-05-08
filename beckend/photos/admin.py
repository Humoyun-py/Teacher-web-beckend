"""Admin configuration for photos app."""

from django.contrib import admin
from .models import PhotoProof

@admin.register(PhotoProof)
class PhotoProofAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'lesson', 'status', 'file_size_mb', 'uploaded_at']
    list_filter = ['status', 'uploaded_at']
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name']
