"""
Models for videos app.
Video proof system for lesson verification.
"""

from django.db import models
from django.conf import settings
from teachers.models import Teacher
from lessons.models import Lesson


class VideoProof(models.Model):
    """1-2 daqiqalik dars video isboti."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Kutilmoqda'
        ACCEPTED = 'accepted', 'Qabul qilingan'
        REJECTED = 'rejected', 'Rad qilingan'

    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='video_proofs',
        verbose_name='Teacher',
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE,
        related_name='video_proofs',
        verbose_name='Dars',
    )
    video = models.FileField(
        upload_to='videos/%Y/%m/%d/',
        verbose_name='Video fayl',
    )
    thumbnail = models.ImageField(
        upload_to='video_thumbnails/%Y/%m/%d/',
        null=True, blank=True,
        verbose_name='Eskiz rasm',
    )
    duration_seconds = models.IntegerField(
        default=0,
        verbose_name='Davomiyligi (soniya)',
    )
    file_size_mb = models.FloatField(
        default=0,
        verbose_name='Fayl hajmi (MB)',
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Status',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_videos',
        verbose_name='Tekshiruvchi',
    )
    reviewed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Tekshirilgan vaqt',
    )
    review_notes = models.TextField(
        blank=True,
        verbose_name='Tekshiruv izohi',
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Yuklangan vaqt',
    )

    class Meta:
        verbose_name = 'Video isbot'
        verbose_name_plural = 'Video isbotlar'
        ordering = ['-uploaded_at']

    def __str__(self):
        return (
            f"Video: {self.teacher.user.get_full_name()} - "
            f"{self.lesson.date} - {self.get_status_display()}"
        )
