"""
Views for analytics app.
Provides various dashboards and statistics.
"""

import calendar
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone

from accounts.permissions import IsAdmin, IsAdminOrITSupport
from attendance.models import Attendance
from lessons.models import Lesson, LessonSchedule
from photos.models import PhotoProof
from teachers.models import Teacher
from kpi.models import KPIRecord
from salary.models import SalaryRecord


class AdminDashboardAnalytics(APIView):
    """Admin Dashboard - bugungi umumiy holat."""
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.localtime().date()

        total_teachers = Teacher.objects.filter(status='active').count()
        today_attendances = Attendance.objects.filter(date=today)

        present = today_attendances.filter(status='present').count()
        late = today_attendances.filter(status='late').count()
        absent = today_attendances.filter(status='absent').count()
        excused = today_attendances.filter(status='excused').count()

        today_lessons = Lesson.objects.filter(date=today)
        total_lessons = today_lessons.count()
        completed_lessons = today_lessons.filter(status='completed').count()
        missed_lessons = today_lessons.filter(status='missed').count()
        in_progress = today_lessons.filter(status='in_progress').count()
        scheduled = today_lessons.filter(status='scheduled').count()

        total_photos = PhotoProof.objects.filter(lesson__date=today).count()
        pending_photos = PhotoProof.objects.filter(lesson__date=today, status='pending').count()
        accepted_photos = PhotoProof.objects.filter(lesson__date=today, status='accepted').count()

        lesson_completion_rate = round(
            (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1
        )
        attendance_rate = round(
            ((present + late) / total_teachers * 100) if total_teachers > 0 else 0, 1
        )

        return Response({
            'date': str(today),
            'teachers': {
                'total': total_teachers,
                'present': present,
                'late': late,
                'absent': absent,
                'excused': excused,
                'attendance_rate': attendance_rate,
            },
            'lessons': {
                'total': total_lessons,
                'completed': completed_lessons,
                'missed': missed_lessons,
                'in_progress': in_progress,
                'scheduled': scheduled,
                'completion_rate': lesson_completion_rate,
            },
            'photos': {
                'total': total_photos,
                'pending': pending_photos,
                'accepted': accepted_photos,
            },
        })


class TeacherDashboardAnalytics(APIView):
    """Teacher Dashboard - shaxsiy bugungi holat."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localtime().date()
        try:
            teacher = request.user.teacher_profile
        except Exception:
            return Response({'error': 'Teacher profile not found'}, status=400)

        today_lessons = Lesson.objects.filter(
            Q(teacher=teacher) | Q(replacement_teacher=teacher, replacement_status='approved'),
            date=today,
        ).order_by('scheduled_start')

        now = timezone.localtime().time()
        next_lesson = today_lessons.filter(scheduled_start__gt=now, status='scheduled').first()

        completed = today_lessons.filter(status='completed').count()

        # Bugungi davomat
        today_att = Attendance.objects.filter(teacher=teacher, date=today).first()

        # Joriy oy KPI
        now_dt = timezone.localtime()
        kpi = KPIRecord.objects.filter(
            teacher=teacher, month=now_dt.month, year=now_dt.year
        ).first()

        return Response({
            'date': str(today),
            'attendance': {
                'status': today_att.status if today_att else 'not_checked_in',
                'check_in_time': today_att.check_in_time if today_att else None,
                'is_late': today_att.is_late if today_att else False,
            },
            'today_lessons': {
                'total': today_lessons.count(),
                'completed': completed,
                'next_lesson': {
                    'subject': next_lesson.subject.name,
                    'class': next_lesson.school_class.name,
                    'scheduled_start': str(next_lesson.scheduled_start),
                    'room': next_lesson.room,
                } if next_lesson else None,
            },
            'current_month_kpi': {
                'total_score': kpi.total_score if kpi else None,
                'grade': kpi.grade if kpi else None,
            },
        })


class WeeklyStatsView(APIView):
    """Haftalik statistika (Admin/IT Support)."""
    permission_classes = [IsAdminOrITSupport]

    def get(self, request):
        today = timezone.localtime().date()
        # Current Monday
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=5)  # Mon-Sat

        week_data = []
        for i in range(6):  # Monday to Saturday
            day = start_of_week + timedelta(days=i)
            day_attendances = Attendance.objects.filter(date=day)
            day_lessons = Lesson.objects.filter(date=day)

            week_data.append({
                'date': str(day),
                'day_name': day.strftime('%A'),
                'attendance': {
                    'present': day_attendances.filter(status='present').count(),
                    'late': day_attendances.filter(status='late').count(),
                    'absent': day_attendances.filter(status='absent').count(),
                },
                'lessons': {
                    'total': day_lessons.count(),
                    'completed': day_lessons.filter(status='completed').count(),
                    'missed': day_lessons.filter(status='missed').count(),
                },
                'photos_pending': PhotoProof.objects.filter(
                    lesson__date=day, status='pending'
                ).count(),
            })

        total_teachers = Teacher.objects.filter(status='active').count()
        week_attendances = Attendance.objects.filter(date__gte=start_of_week, date__lte=end_of_week)
        week_lessons = Lesson.objects.filter(date__gte=start_of_week, date__lte=end_of_week)

        present_count = week_attendances.filter(status__in=['present', 'late']).count()
        total_expected = total_teachers * 6
        week_attendance_rate = round(
            (present_count / total_expected * 100) if total_expected > 0 else 0, 1
        )

        completed_lessons = week_lessons.filter(status='completed').count()
        total_lessons = week_lessons.count()
        week_lesson_rate = round(
            (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1
        )

        return Response({
            'week_start': str(start_of_week),
            'week_end': str(end_of_week),
            'summary': {
                'attendance_rate': week_attendance_rate,
                'lesson_completion_rate': week_lesson_rate,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'missed_lessons': week_lessons.filter(status='missed').count(),
            },
            'daily': week_data,
        })


class MonthlyStatsView(APIView):
    """Oylik statistika (Admin/IT Support)."""
    permission_classes = [IsAdminOrITSupport]

    def get(self, request):
        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        _, days_in_month = calendar.monthrange(year, month)
        total_teachers = Teacher.objects.filter(status='active').count()

        month_attendances = Attendance.objects.filter(date__month=month, date__year=year)
        month_lessons = Lesson.objects.filter(date__month=month, date__year=year)
        month_photos = PhotoProof.objects.filter(lesson__date__month=month, lesson__date__year=year)

        present_days = month_attendances.filter(status__in=['present', 'late']).count()
        total_expected = total_teachers * days_in_month
        month_att_rate = round(
            (present_days / total_expected * 100) if total_expected > 0 else 0, 1
        )

        completed = month_lessons.filter(status='completed').count()
        total_lessons = month_lessons.count()
        lesson_rate = round(
            (completed / total_lessons * 100) if total_lessons > 0 else 0, 1
        )

        accepted_photos = month_photos.filter(status='accepted').count()
        total_photos = month_photos.count()
        proof_rate = round(
            (accepted_photos / total_photos * 100) if total_photos > 0 else 0, 1
        )

        late_arrivals = month_attendances.filter(status='late').count()
        total_arrivals = month_attendances.filter(status__in=['present', 'late']).count()
        late_rate = round(
            (late_arrivals / total_arrivals * 100) if total_arrivals > 0 else 0, 1
        )

        # Daily breakdown (only populated days)
        daily = []
        for day_num in range(1, days_in_month + 1):
            import datetime
            try:
                day = datetime.date(year, month, day_num)
            except ValueError:
                continue
            if day.weekday() == 6:  # Skip Sunday
                continue
            day_att = Attendance.objects.filter(date=day)
            day_les = Lesson.objects.filter(date=day)
            daily.append({
                'date': str(day),
                'present': day_att.filter(status='present').count(),
                'late': day_att.filter(status='late').count(),
                'absent': day_att.filter(status='absent').count(),
                'lessons_completed': day_les.filter(status='completed').count(),
                'lessons_missed': day_les.filter(status='missed').count(),
            })

        # KPI summary for this month
        kpi_records = KPIRecord.objects.filter(month=month, year=year)
        avg_kpi = kpi_records.aggregate(avg=Avg('total_score'))['avg']

        # Salary summary
        salary_records = SalaryRecord.objects.filter(month=month, year=year)
        total_salary = salary_records.aggregate(total=Sum('final_salary'))['total']

        return Response({
            'month': month,
            'year': year,
            'days_in_month': days_in_month,
            'summary': {
                'attendance_rate': month_att_rate,
                'lesson_completion_rate': lesson_rate,
                'proof_acceptance_rate': proof_rate,
                'late_arrival_rate': late_rate,
                'total_lessons': total_lessons,
                'completed_lessons': completed,
                'missed_lessons': month_lessons.filter(status='missed').count(),
                'replacements': month_lessons.filter(is_replaced=True).count(),
                'avg_kpi_score': round(avg_kpi, 2) if avg_kpi else None,
                'total_salary_payout': str(total_salary) if total_salary else '0.00',
            },
            'daily': daily,
        })


class TeacherRankingView(APIView):
    """O'qituvchilar reytingi (Admin/IT Support)."""
    permission_classes = [IsAdminOrITSupport]

    def get(self, request):
        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        kpi_records = KPIRecord.objects.filter(
            month=month, year=year
        ).select_related('teacher__user').order_by('-total_score')

        ranking = []
        for idx, kpi in enumerate(kpi_records, start=1):
            teacher = kpi.teacher
            ranking.append({
                'rank': idx,
                'teacher_id': teacher.id,
                'employee_id': teacher.employee_id,
                'full_name': teacher.user.get_full_name(),
                'kpi': {
                    'total_score': kpi.total_score,
                    'grade': kpi.grade,
                    'attendance_score': kpi.attendance_score,
                    'lesson_score': kpi.lesson_score,
                    'proof_score': kpi.proof_score,
                    'late_arrival_score': kpi.late_arrival_score,
                    'replacement_score': kpi.replacement_score,
                },
            })

        # Teachers with no KPI yet
        ranked_ids = kpi_records.values_list('teacher_id', flat=True)
        unranked = Teacher.objects.filter(status='active').exclude(id__in=ranked_ids)
        for teacher in unranked:
            ranking.append({
                'rank': None,
                'teacher_id': teacher.id,
                'employee_id': teacher.employee_id,
                'full_name': teacher.user.get_full_name(),
                'kpi': None,
            })

        return Response({
            'month': month,
            'year': year,
            'total_teachers': len(ranking),
            'ranking': ranking,
        })


class AttendanceReportView(APIView):
    """Davomat hisoboti (Admin/IT Support)."""
    permission_classes = [IsAdminOrITSupport]

    def get(self, request):
        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        teachers = Teacher.objects.filter(status='active').select_related('user')
        report = []

        for teacher in teachers:
            atts = Attendance.objects.filter(
                teacher=teacher, date__month=month, date__year=year
            )
            present = atts.filter(status='present').count()
            late = atts.filter(status='late').count()
            absent = atts.filter(status='absent').count()
            excused = atts.filter(status='excused').count()
            total_days = atts.count()
            worked_days = present + late
            total_late_minutes = atts.aggregate(t=Sum('late_minutes'))['t'] or 0
            total_penalty = atts.aggregate(t=Sum('penalty_amount'))['t'] or 0

            report.append({
                'teacher_id': teacher.id,
                'employee_id': teacher.employee_id,
                'full_name': teacher.user.get_full_name(),
                'present': present,
                'late': late,
                'absent': absent,
                'excused': excused,
                'total_days': total_days,
                'worked_days': worked_days,
                'attendance_rate': round(
                    (worked_days / total_days * 100) if total_days > 0 else 0, 1
                ),
                'total_late_minutes': total_late_minutes,
                'total_penalty': str(total_penalty),
            })

        report.sort(key=lambda x: x['attendance_rate'], reverse=True)

        return Response({
            'month': month,
            'year': year,
            'total_teachers': len(report),
            'report': report,
        })


class LessonReportView(APIView):
    """Dars o'tish hisoboti (Admin/IT Support)."""
    permission_classes = [IsAdminOrITSupport]

    def get(self, request):
        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        teachers = Teacher.objects.filter(status='active').select_related('user')
        report = []

        for teacher in teachers:
            lessons = Lesson.objects.filter(
                teacher=teacher,
                date__month=month,
                date__year=year,
            )
            total = lessons.count()
            completed = lessons.filter(status='completed').count()
            missed = lessons.filter(status='missed').count()
            late_started = lessons.filter(started_late=True).count()
            replacements_given = lessons.filter(
                is_replaced=True,
                replacement_status='approved',
            ).count()
            replacements_done = Lesson.objects.filter(
                replacement_teacher=teacher,
                replacement_status='approved',
                date__month=month,
                date__year=year,
                status='completed',
            ).count()
            accepted_proofs = PhotoProof.objects.filter(
                teacher=teacher,
                lesson__date__month=month,
                lesson__date__year=year,
                status='accepted',
            ).count()

            report.append({
                'teacher_id': teacher.id,
                'employee_id': teacher.employee_id,
                'full_name': teacher.user.get_full_name(),
                'total_lessons': total,
                'completed': completed,
                'missed': missed,
                'late_started': late_started,
                'completion_rate': round(
                    (completed / total * 100) if total > 0 else 0, 1
                ),
                'replacements_given': replacements_given,
                'replacements_done': replacements_done,
                'accepted_proofs': accepted_proofs,
                'proof_rate': round(
                    (accepted_proofs / completed * 100) if completed > 0 else 0, 1
                ),
            })

        report.sort(key=lambda x: x['completion_rate'], reverse=True)

        return Response({
            'month': month,
            'year': year,
            'total_teachers': len(report),
            'report': report,
        })
