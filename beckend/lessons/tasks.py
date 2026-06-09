"""
Celery tasks for lessons app.
Handles lesson generation, missed lesson detection, and reminders.
"""

from celery import shared_task
from django.utils import timezone


@shared_task(name='lessons.generate_daily_lessons')
def generate_daily_lessons():
    """Generate lesson instances from schedule for today."""
    from .models import Lesson

    today = timezone.localdate()
    count = Lesson.generate_for_date(today)
    return {'date': str(today), 'lessons_created': count}


@shared_task(name='lessons.mark_missed_lessons')
def mark_missed_lessons():
    """Mark all in-progress or scheduled lessons that passed their end time as missed."""
    from .models import Lesson
    from datetime import datetime

    now = timezone.localtime()
    today = now.date()

    overdue = Lesson.objects.filter(
        date=today,
        status__in=[Lesson.Status.SCHEDULED, Lesson.Status.IN_PROGRESS],
        scheduled_end__lt=now.time(),
    )

    marked = 0
    for lesson in overdue:
        if lesson.status == Lesson.Status.SCHEDULED:
            lesson.status = Lesson.Status.MISSED
        else:
            lesson.status = Lesson.Status.COMPLETED
        lesson.save()
        marked += 1

    return {'date': str(today), 'processed': marked}


@shared_task(name='lessons.send_lesson_reminders')
def send_lesson_reminders():
    """Send 15-minute before-lesson reminder notifications to teachers."""
    from .models import Lesson
    from notifications.models import Notification
    from datetime import timedelta
    from django.db.models import Q

    now = timezone.localtime()
    today = now.date()
    reminder_window_start = (now + timedelta(minutes=10)).time()
    reminder_window_end = (now + timedelta(minutes=20)).time()

    upcoming = Lesson.objects.filter(
        date=today,
        status=Lesson.Status.SCHEDULED,
        scheduled_start__gte=reminder_window_start,
        scheduled_start__lte=reminder_window_end,
    ).select_related('teacher__user', 'subject', 'school_class', 'replacement_teacher__user')

    sent = 0
    for lesson in upcoming:
        recipients = [lesson.teacher.user]
        if lesson.is_replaced and lesson.replacement_teacher:
            recipients.append(lesson.replacement_teacher.user)

        for user in recipients:
            Notification.objects.create(
                recipient=user,
                title='Dars eslatmasi',
                message=(
                    f"{lesson.subject.name} darsi {lesson.school_class.name} sinfida "
                    f"{lesson.scheduled_start} da boshlanadi."
                ),
                notification_type=Notification.Type.INFO,
            )
            sent += 1

    return {'sent': sent}
