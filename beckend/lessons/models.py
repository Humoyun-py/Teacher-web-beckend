"""
Models for lessons app.
Lesson scheduling, schedule management, and conflict detection.
"""

from django.db import models
from django.conf import settings
from teachers.models import Teacher, Subject, SchoolClass


class LessonSchedule(models.Model):
    """Dars jadvali - haftalik takrorlanuvchi dars."""

    class DayOfWeek(models.IntegerChoices):
        MONDAY = 1, 'Dushanba'
        TUESDAY = 2, 'Seshanba'
        WEDNESDAY = 3, 'Chorshanba'
        THURSDAY = 4, 'Payshanba'
        FRIDAY = 5, 'Juma'
        SATURDAY = 6, 'Shanba'

    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='lesson_schedules',
        verbose_name='Teacher',
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE,
        related_name='lesson_schedules',
        verbose_name='Fan',
    )
    school_class = models.ForeignKey(
        SchoolClass, on_delete=models.CASCADE,
        related_name='lesson_schedules',
        verbose_name='Sinf',
    )
    day_of_week = models.IntegerField(
        choices=DayOfWeek.choices,
        verbose_name='Hafta kuni',
    )
    start_time = models.TimeField(verbose_name='Boshlanish vaqti')
    end_time = models.TimeField(verbose_name='Tugash vaqti')
    room = models.CharField(
        max_length=20, blank=True,
        verbose_name='Xona raqami',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dars jadvali'
        verbose_name_plural = 'Dars jadvallari'
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return (
            f"{self.get_day_of_week_display()} "
            f"{self.start_time}-{self.end_time} | "
            f"{self.teacher.user.get_full_name()} | "
            f"{self.subject.name} | {self.school_class.name}"
        )

    def has_conflict(self):
        """Boshqa darslar bilan to'qnashuvni tekshirish."""
        conflicts = LessonSchedule.objects.filter(
            day_of_week=self.day_of_week,
            is_active=True,
        ).exclude(pk=self.pk)

        # Teacher conflict
        teacher_conflict = conflicts.filter(
            teacher=self.teacher,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
        )

        # Class conflict
        class_conflict = conflicts.filter(
            school_class=self.school_class,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
        )

        # Room conflict
        room_conflict = None
        if self.room:
            room_conflict = conflicts.filter(
                room=self.room,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            )

        return {
            'has_conflict': (
                teacher_conflict.exists()
                or class_conflict.exists()
                or (room_conflict and room_conflict.exists())
            ),
            'teacher_conflicts': teacher_conflict,
            'class_conflicts': class_conflict,
            'room_conflicts': room_conflict,
        }


class Lesson(models.Model):
    """Aniq bir sana uchun dars instansiyasi."""

    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Rejalashtirilgan'
        IN_PROGRESS = 'in_progress', 'Darsda'
        COMPLETED = 'completed', 'Tugagan'
        CANCELLED = 'cancelled', 'Bekor qilingan'
        MISSED = 'missed', 'O\'tilmagan'

    schedule = models.ForeignKey(
        LessonSchedule, on_delete=models.CASCADE,
        related_name='lessons', null=True, blank=True,
        verbose_name='Jadval',
    )
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name='Teacher',
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name='Fan',
    )
    school_class = models.ForeignKey(
        SchoolClass, on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name='Sinf',
    )
    date = models.DateField(verbose_name='Sana')
    scheduled_start = models.TimeField(verbose_name='Rejalashtirilgan boshlanish')
    scheduled_end = models.TimeField(verbose_name='Rejalashtirilgan tugash')
    actual_start = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Haqiqiy boshlanish',
    )
    actual_end = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Haqiqiy tugash',
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.SCHEDULED,
        verbose_name='Status',
    )
    replacement_teacher = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='replacement_lessons',
        verbose_name="O'rinbosar teacher",
    )
    is_replaced = models.BooleanField(
        default=False,
        verbose_name="O'rinbosar bilan",
    )
    replacement_reason = models.TextField(
        blank=True,
        verbose_name="O'rinbosar sababi",
    )
    notes = models.TextField(blank=True, verbose_name='Izohlar')
    room = models.CharField(max_length=20, blank=True, verbose_name='Xona')
    started_late = models.BooleanField(default=False, verbose_name='Kech boshlangan')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dars'
        verbose_name_plural = 'Darslar'
        ordering = ['-date', 'scheduled_start']
        unique_together = ['teacher', 'date', 'scheduled_start']

    def __str__(self):
        return (
            f"{self.date} {self.scheduled_start} | "
            f"{self.teacher.user.get_full_name()} | "
            f"{self.subject.name}"
        )

    @classmethod
    def generate_for_date(cls, target_date, teacher=None):
        """Ma'lum sana (va ixtiyoriy teacher) uchun jadvaldan darslarni yaratish."""
        from .models import LessonSchedule
        day_of_week = target_date.isoweekday()
        
        schedules = LessonSchedule.objects.filter(
            day_of_week=day_of_week,
            is_active=True
        )
        if teacher:
            schedules = schedules.filter(teacher=teacher)
            
        created_count = 0
        for sch in schedules:
            _, created = cls.objects.get_or_create(
                teacher=sch.teacher,
                date=target_date,
                scheduled_start=sch.start_time,
                defaults={
                    'schedule': sch,
                    'subject': sch.subject,
                    'school_class': sch.school_class,
                    'scheduled_end': sch.end_time,
                    'room': sch.room,
                }
            )
            if created:
                created_count += 1
        return created_count

