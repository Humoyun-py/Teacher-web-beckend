"""
Models for teachers app.
Teacher profiles, subjects, and class assignments.
"""

from django.db import models
from django.conf import settings


class Subject(models.Model):
    """Fan (Subject) model."""

    name = models.CharField(max_length=100, unique=True, verbose_name='Fan nomi')
    description = models.TextField(blank=True, verbose_name='Tavsif')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Fan'
        verbose_name_plural = 'Fanlar'
        ordering = ['name']

    def __str__(self):
        return self.name


class SchoolClass(models.Model):
    """Sinf (Class) model."""

    name = models.CharField(max_length=20, verbose_name='Sinf nomi')  # e.g., "5-A", "9-B"
    grade = models.IntegerField(verbose_name='Sinf raqami')  # e.g., 5, 9
    section = models.CharField(max_length=5, blank=True, verbose_name='Bo\'lim')  # e.g., "A", "B"
    capacity = models.IntegerField(default=30, verbose_name='Sig\'imi')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sinf'
        verbose_name_plural = 'Sinflar'
        ordering = ['grade', 'section']
        unique_together = ['grade', 'section']

    def __str__(self):
        return self.name


class Teacher(models.Model):
    """Teacher profile model linked to User."""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Faol'
        INACTIVE = 'inactive', 'Nofaol'
        ON_LEAVE = 'on_leave', 'Ta\'tilda'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='teacher_profile',
        verbose_name='Foydalanuvchi',
    )
    employee_id = models.CharField(
        max_length=20, unique=True, verbose_name='Xodim ID',
    )
    subjects = models.ManyToManyField(
        Subject, blank=True,
        related_name='teachers',
        verbose_name='Fanlar',
    )
    classes = models.ManyToManyField(
        SchoolClass, blank=True,
        related_name='teachers',
        verbose_name='Sinflar',
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name='Status',
    )
    date_of_birth = models.DateField(
        null=True, blank=True,
        verbose_name='Tug\'ilgan sana',
    )
    address = models.TextField(blank=True, verbose_name='Manzil')
    specialization = models.CharField(
        max_length=200, blank=True,
        verbose_name='Mutaxassislik',
    )
    experience_years = models.IntegerField(
        default=0, verbose_name='Tajriba (yil)',
    )
    hire_date = models.DateField(
        null=True, blank=True,
        verbose_name='Ishga kirgan sana',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teacherlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.employee_id}"
