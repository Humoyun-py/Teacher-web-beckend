"""
Models for photos app.
Photo proof system for lesson verification.
"""

from django.db import models
from django.conf import settings
from teachers.models import Teacher
from lessons.models import Lesson
from accounts.models import SoftDeleteModel


class PhotoProof(SoftDeleteModel):
    """Dars isboti sifatida yuboriladigan rasm."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Kutilmoqda'
        ACCEPTED = 'accepted', 'Qabul qilingan'
        REJECTED = 'rejected', 'Rad qilingan'

    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='photo_proofs',
        verbose_name='Teacher',
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE,
        related_name='photo_proofs',
        verbose_name='Dars',
    )
    photo = models.ImageField(
        upload_to='photos/%Y/%m/%d/',
        verbose_name='Rasm fayli',
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
        related_name='reviewed_photos',
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
        verbose_name = 'Rasm isbot'
        verbose_name_plural = 'Rasm isbotlar'
        ordering = ['-uploaded_at']

    def __str__(self):
        return (
            f"Rasm: {self.teacher.user.get_full_name()} - "
            f"{self.lesson.date} - {self.get_status_display()}"
        )
