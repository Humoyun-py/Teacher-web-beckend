"""
Views for analytics app.
Provides various dashboards and statistics.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from django.db.models import Count, Q, F, Func, IntegerField
from django.utils import timezone
from datetime import timedelta
from attendance.models import Attendance
from lessons.models import Lesson
from photos.models import PhotoProof
from teachers.models import Teacher

class AdminDashboardAnalytics(APIView):
    """👑 ADMIN Dashboard"""
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.localtime().date()
        
        # O'qituvchilar statistikasi
        total_teachers = Teacher.objects.filter(status='active').count()
        today_attendances = Attendance.objects.filter(date=today)
        
        present = today_attendances.filter(status='present').count()
        late = today_attendances.filter(status='late').count()
        absent = today_attendances.filter(status='absent').count()
        expected = total_teachers - (present + late + absent)
        
        # Darslar statistikasi
        today_lessons = Lesson.objects.filter(date=today)
        total_lessons = today_lessons.count()
        completed_lessons = today_lessons.filter(status='completed').count()
        missed_lessons = today_lessons.filter(status='missed').count()
        in_progress = today_lessons.filter(status='in_progress').count()
        
        # Rasmlar statistikasi
        total_photos = PhotoProof.objects.filter(lesson__date=today).count()
        pending_photos = PhotoProof.objects.filter(lesson__date=today, status='pending').count()

        return Response({
            'teachers': {
                'total': total_teachers,
                'present': present,
                'late': late,
                'absent': absent,
                'expected': expected
            },
            'lessons': {
                'total': total_lessons,
                'completed': completed_lessons,
                'missed': missed_lessons,
                'in_progress': in_progress
            },
            'photos': {
                'total': total_photos,
                'pending': pending_photos,
            }
        })

class TeacherDashboardAnalytics(APIView):
    """👨🏫 TEACHER Dashboard"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localtime().date()
        try:
            teacher = request.user.teacher_profile
        except:
            return Response({'error': 'Teacher profile not found'}, status=400)
            
        # Bugungi darslar
        today_lessons = Lesson.objects.filter(teacher=teacher, date=today).order_by('scheduled_start')
        # Keyingi dars
        now = timezone.localtime().time()
        next_lesson = today_lessons.filter(scheduled_start__gt=now, status='scheduled').first()
        
        # Dars statuslari
        completed = today_lessons.filter(status='completed').count()
        
        return Response({
            'today_total_lessons': today_lessons.count(),
            'completed_lessons': completed,
            'next_lesson': {
                'subject': next_lesson.subject.name,
                'class': next_lesson.school_class.name,
                'scheduled_start': next_lesson.scheduled_start
            } if next_lesson else None,
        })
