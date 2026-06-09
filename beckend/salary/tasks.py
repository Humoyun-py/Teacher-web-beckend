"""Celery tasks for salary app."""

from celery import shared_task


@shared_task(name='salary.calculate_monthly_salary')
def calculate_monthly_salary(month=None, year=None):
    """Calculate salary for all active teachers for given month/year."""
    from django.utils import timezone
    from teachers.models import Teacher
    from salary.views import SalaryViewSet

    now = timezone.localtime()
    month = month or now.month
    year = year or now.year

    teachers = Teacher.objects.filter(status='active')
    view = SalaryViewSet()

    calculated = 0
    for teacher in teachers:
        view._calculate_teacher_salary(teacher, month, year)
        calculated += 1

    return {'month': month, 'year': year, 'teachers_calculated': calculated}
