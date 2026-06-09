"""Celery tasks for KPI app."""

from celery import shared_task


@shared_task(name='kpi.calculate_monthly_kpi')
def calculate_monthly_kpi(month=None, year=None):
    """Calculate KPI for all active teachers for given month/year."""
    from django.utils import timezone
    from teachers.models import Teacher
    from kpi.views import KPIViewSet

    now = timezone.localtime()
    month = month or now.month
    year = year or now.year

    teachers = Teacher.objects.filter(status='active')
    view = KPIViewSet()

    calculated = 0
    for teacher in teachers:
        view._calculate_teacher_kpi(teacher, month, year)
        calculated += 1

    return {'month': month, 'year': year, 'teachers_calculated': calculated}
