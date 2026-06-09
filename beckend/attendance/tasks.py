"""
Celery tasks for attendance app.
Runs scheduled jobs for marking absent teachers and sending alerts.
"""

from celery import shared_task
from django.utils import timezone
from django.conf import settings


@shared_task(name='attendance.mark_absent_teachers')
def mark_absent_teachers():
    """Mark all teachers who haven't checked in by end-of-day as absent."""
    from .models import Attendance
    from teachers.models import Teacher

    today = timezone.localdate()
    now = timezone.localtime()

    # Only run after 9 AM
    if now.hour < 9:
        return {'skipped': True, 'reason': 'Too early'}

    active_teachers = Teacher.objects.filter(status='active')
    checked_in_ids = Attendance.objects.filter(date=today).values_list('teacher_id', flat=True)

    marked = 0
    for teacher in active_teachers:
        if teacher.id not in checked_in_ids:
            Attendance.objects.create(
                teacher=teacher,
                date=today,
                status=Attendance.Status.ABSENT,
            )
            marked += 1

    return {'date': str(today), 'marked_absent': marked}


@shared_task(name='attendance.send_late_alert')
def send_late_alert():
    """Send notification to admins about teachers who are late."""
    from .models import Attendance
    from notifications.models import Notification
    from accounts.models import User

    today = timezone.localdate()
    late_attendances = Attendance.objects.filter(
        date=today, status=Attendance.Status.LATE
    ).select_related('teacher__user')

    if not late_attendances.exists():
        return {'sent': 0}

    names = ', '.join(a.teacher.user.get_full_name() for a in late_attendances[:5])
    total = late_attendances.count()
    message = f"Bugun {total} ta o'qituvchi kechikdi: {names}" + (
        f' va {total - 5} ta boshqa' if total > 5 else ''
    )

    admins = User.objects.filter(role__in=['admin', 'it_support'], is_active=True)
    notifications = [
        Notification(
            recipient=admin,
            title='Kechikish ogohlantirishi',
            message=message,
            notification_type=Notification.Type.WARNING,
        )
        for admin in admins
    ]
    Notification.objects.bulk_create(notifications)

    return {'sent': len(notifications), 'late_count': total}
