"""
Custom User model for Teacher Management System.
Supports Admin, Teacher, and IT Support roles.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
import json


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(is_deleted=True)

    def hard_delete(self):
        return super().delete()

    def active(self):
        return self.filter(is_deleted=False)

    def deleted(self):
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_set(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=True)


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, verbose_name="O'chirilgan")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="O'chirilgan vaqt")

    objects = SoftDeleteManager()
    all_objects = models.Manager() # Standard Django manager that doesn't filter by is_deleted

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        import django.utils.timezone as timezone
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)



class User(AbstractUser):
    """Custom user model with role-based access."""

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        TEACHER = 'teacher', 'Teacher'
        IT_SUPPORT = 'it_support', 'IT Support'

    role = models.CharField(
        max_length=15,
        choices=Role.choices,
        default=Role.TEACHER,
        verbose_name='Role',
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Telefon raqami',
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='Rasm',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_it_support(self):
        return self.role == self.Role.IT_SUPPORT

    @property
    def is_admin_or_support(self):
        """Check if user is admin, IT support, or superuser."""
        return (
            self.role in (self.Role.ADMIN, self.Role.IT_SUPPORT)
            or self.is_superuser
        )


class AuditLog(models.Model):
    """
    Audit log - barcha muhim o'zgarishlarni yozib borish.
    Kim, qachon, nima o'zgartirganini saqlash.
    """

    class ActionType(models.TextChoices):
        CREATE = 'create', 'Yaratish'
        UPDATE = 'update', 'Tahrirlash'
        DELETE = 'delete', "O'chirish"
        LOGIN = 'login', 'Tizimga kirish'
        LOGOUT = 'logout', 'Tizimdan chiqish'
        STATUS_CHANGE = 'status_change', 'Status o\'zgartirish'
        RESTORE = 'restore', 'Tiklash'
        LESSON_FIX = 'lesson_fix', 'Darsni tuzatish'
        ATTENDANCE_FIX = 'attendance_fix', 'Davomatni tuzatish'
        PASSWORD_CHANGE = 'password_change', 'Parol o\'zgartirish'
        BLOCK = 'block', 'Bloklash'
        UNBLOCK = 'unblock', 'Blokdan chiqarish'
        SALARY_CALC = 'salary_calc', 'Oylik hisoblash'
        SALARY_FIX = 'salary_fix', 'Oylik tuzatish'
        KPI_CALC = 'kpi_calc', 'KPI hisoblash'
        KPI_FIX = 'kpi_fix', 'KPI tuzatish'
        PHOTO_REVIEW = 'photo_review', 'Rasm tekshirish'
        SYSTEM_CONFIG = 'system_config', 'Tizim sozlama'
        ADMIN_ACTION = 'admin_action', 'Admin amali'
        ACT_AS = 'act_as', 'Boshqa foydalanuvchi sifatida'
        CCTV_ACTION = 'cctv_action', 'CCTV amali'

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Foydalanuvchi',
    )
    action = models.CharField(
        max_length=30,
        choices=ActionType.choices,
        verbose_name='Amal turi',
    )
    target_model = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Maqsad modeli',
        help_text="O'zgartirilgan model nomi (masalan: Teacher, Lesson)",
    )
    target_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Maqsad ID',
    )
    target_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Maqsad nomi',
        help_text="O'zgartirilgan ob'ekt nomi (masalan: teacher ismi)",
    )
    description = models.TextField(
        blank=True,
        verbose_name='Tavsif',
        help_text="O'zgarish haqida qisqacha izoh",
    )
    old_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Eski ma\'lumot',
    )
    new_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Yangi ma\'lumot',
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP manzil',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Vaqt',
    )

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Loglar'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['target_model']),
        ]

    def __str__(self):
        user_name = self.user.get_full_name() if self.user else 'System'
        return f"[{self.created_at}] {user_name} - {self.get_action_display()}: {self.description[:50]}"

    @classmethod
    def log(cls, user, action, description='', target_model='', target_id=None,
            target_name='', old_data=None, new_data=None, ip_address=None):
        """Convenience method to create audit log entries."""
        return cls.objects.create(
            user=user,
            action=action,
            description=description,
            target_model=target_model,
            target_id=target_id,
            target_name=target_name,
            old_data=old_data,
            new_data=new_data,
            ip_address=ip_address,
        )
