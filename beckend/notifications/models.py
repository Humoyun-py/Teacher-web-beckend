"""
Models for notifications app.
Alerts and notifications for teachers and admins.
"""

from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Notification model for system alerts."""

    class Type(models.TextChoices):
        INFO = 'info', 'Ma\'lumot'
        WARNING = 'warning', 'Ogohlantirish'
        ALERT = 'alert', 'Alert (Xavf)'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Qabul qiluvchi',
    )
    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    message = models.TextField(verbose_name='Xabar')
    notification_type = models.CharField(
        max_length=10,
        choices=Type.choices,
        default=Type.INFO,
        verbose_name='Turi',
    )
    is_read = models.BooleanField(default=False, verbose_name='O\'qilgan')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bildirishnoma'
        verbose_name_plural = 'Bildirishnomalar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
