"""
Serializers for photos app.
"""

from rest_framework import serializers
from django.conf import settings
from .models import PhotoProof

class PhotoProofSerializer(serializers.ModelSerializer):
    """Serializer for PhotoProof."""

    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    lesson_date = serializers.DateField(source='lesson.date', read_only=True)
    lesson_subject = serializers.CharField(source='lesson.subject.name', read_only=True)
    lesson_class = serializers.CharField(source='lesson.school_class.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PhotoProof
        fields = [
            'id', 'teacher', 'teacher_name', 'lesson',
            'lesson_date', 'lesson_subject', 'lesson_class',
            'photo', 'file_size_mb',
            'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'review_notes', 'uploaded_at',
        ]
        read_only_fields = ['reviewed_by', 'reviewed_at', 'file_size_mb']

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name()
        return None

class PhotoUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading photo proof."""

    class Meta:
        model = PhotoProof
        fields = ['lesson', 'photo']

    def validate_photo(self, value):
        max_size = getattr(settings, 'MAX_PHOTO_SIZE_MB', 10) * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f'Rasm hajmi {getattr(settings, "MAX_PHOTO_SIZE_MB", 10)}MB dan oshmasligi kerak.'
            )
        return value

class PhotoReviewSerializer(serializers.Serializer):
    """Serializer for reviewing photos."""

    status = serializers.ChoiceField(
        choices=[
            ('accepted', 'Qabul qilish'),
            ('rejected', 'Rad qilish'),
        ],
    )
    review_notes = serializers.CharField(required=False, allow_blank=True)
