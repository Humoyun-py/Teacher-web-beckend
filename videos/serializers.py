"""
Serializers for videos app.
"""

from rest_framework import serializers
from django.conf import settings

from .models import VideoProof


class VideoProofSerializer(serializers.ModelSerializer):
    """Serializer for VideoProof."""

    teacher_name = serializers.CharField(
        source='teacher.user.get_full_name', read_only=True,
    )
    lesson_date = serializers.DateField(
        source='lesson.date', read_only=True,
    )
    lesson_subject = serializers.CharField(
        source='lesson.subject.name', read_only=True,
    )
    lesson_class = serializers.CharField(
        source='lesson.school_class.name', read_only=True,
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True,
    )
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VideoProof
        fields = [
            'id', 'teacher', 'teacher_name', 'lesson',
            'lesson_date', 'lesson_subject', 'lesson_class',
            'video', 'thumbnail', 'duration_seconds', 'file_size_mb',
            'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'review_notes', 'uploaded_at',
        ]
        read_only_fields = [
            'reviewed_by', 'reviewed_at', 'file_size_mb',
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name()
        return None


class VideoUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading video proof."""

    class Meta:
        model = VideoProof
        fields = ['lesson', 'video', 'duration_seconds']

    def validate_video(self, value):
        # Check file size
        max_size = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                f'Video hajmi {settings.MAX_VIDEO_SIZE_MB}MB dan oshmasligi kerak.'
            )
        return value

    def validate_duration_seconds(self, value):
        if value > settings.MAX_VIDEO_DURATION_SECONDS:
            raise serializers.ValidationError(
                f'Video davomiyligi {settings.MAX_VIDEO_DURATION_SECONDS} soniyadan oshmasligi kerak.'
            )
        return value


class VideoReviewSerializer(serializers.Serializer):
    """Serializer for reviewing videos."""

    status = serializers.ChoiceField(
        choices=[
            ('accepted', 'Qabul qilish'),
            ('rejected', 'Rad qilish'),
        ],
    )
    review_notes = serializers.CharField(required=False, allow_blank=True)
