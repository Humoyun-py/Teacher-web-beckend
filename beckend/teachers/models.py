"""
Models for teachers app.
Teacher profiles, subjects, and class assignments.
"""

from django.db import models
from django.conf import settings
from accounts.models import SoftDeleteModel



class Subject(SoftDeleteModel):
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


class SchoolClass(SoftDeleteModel):
    """Sinf (Class) model."""

    name = models.CharField(max_length=20, verbose_name='Sinf nomi')  # e.g., "5-A", "9-B"
    grade = models.IntegerField(verbose_name='Sinf raqami')  # e.g., 5, 9
    section = models.CharField(max_length=5, blank=True, verbose_name='Bo\'lim')  # e.g., "A", "B"
    room = models.CharField(
        max_length=20, blank=True,
        verbose_name='Xona raqami',
        help_text='Masalan: 101, 205, Lab-3',
    )
    floor = models.IntegerField(
        default=1,
        verbose_name='Etaj',
        help_text='Nechinchi etajda joylashgan',
    )
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


class Teacher(SoftDeleteModel):
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
    monthly_salary = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name='Oylik maosh',
    )
    daily_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        verbose_name='Kunlik maosh',
    )
    hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        verbose_name='Soatlik maosh',
    )
    minute_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        verbose_name='Daqiqalik maosh',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.monthly_salary:
            from decimal import Decimal
            self.daily_rate = Decimal(self.monthly_salary) / Decimal(24)
            self.hourly_rate = self.daily_rate / Decimal(8)
            self.minute_rate = self.hourly_rate / Decimal(60)
        else:
            self.daily_rate = 0
            self.hourly_rate = 0
            self.minute_rate = 0
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teacherlar'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.employee_id}"
