from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import datetime, time, date

from accounts.models import User
from teachers.models import Teacher, Subject, SchoolClass
from lessons.models import LessonSchedule, Lesson

class LessonApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='123', role='admin')
        self.teacher_user = User.objects.create_user(username='t1', password='123', role='teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, employee_id='001')
        self.subject = Subject.objects.create(name='Fizika')
        self.school_class = SchoolClass.objects.create(name='9-B', grade=9, section='B')
        
        # Jadval yaratish (Schedule)
        self.schedule = LessonSchedule.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            school_class=self.school_class,
            day_of_week=timezone.now().isoweekday(),
            start_time=time(8, 0),
            end_time=time(8, 45)
        )
        
        # Bugungi dars
        self.lesson = Lesson.objects.create(
            schedule=self.schedule,
            teacher=self.teacher,
            subject=self.subject,
            school_class=self.school_class,
            date=date.today(),
            scheduled_start=time(8, 0),
            scheduled_end=time(8, 45),
            status='scheduled'
        )

    def test_get_lessons_list(self):
        """Darslarni olinishi GET test"""
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/v1/lessons/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['results']), 1)

    def test_teacher_can_start_and_end_lesson(self):
        """Teacher darsni POST qilib boshlashi va tugatishi testi"""
        self.client.force_authenticate(user=self.teacher_user)
        
        # Start lesson
        res_start = self.client.post('/api/v1/lessons/start/', {'lesson_id': self.lesson.id})
        self.assertEqual(res_start.status_code, status.HTTP_200_OK)
        
        # Check status changed
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.status, 'in_progress')
        
        # End lesson
        res_end = self.client.post('/api/v1/lessons/end/', {'lesson_id': self.lesson.id, 'notes': 'Yaxshi otildi'})
        self.assertEqual(res_end.status_code, status.HTTP_200_OK)
        
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.status, 'completed')

    def test_create_lesson_with_start_and_end_alias(self):
        """Yangi darsni start_time/end_time alias bilan yaratish testi"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'school_class': self.school_class.id,
            'date': date.today(),
            'start_time': '09:00:00',
            'end_time': '09:45:00',
            'room': '102',
            'notes': 'Test dars',
        }
        res = self.client.post('/api/v1/lessons/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['scheduled_start'], '09:00:00')
        self.assertEqual(res.data['scheduled_end'], '09:45:00')

    def test_conflict_detection_logic(self):
        """Jadval to'qnashuvlarini tekshirish (POST)"""
        self.client.force_authenticate(user=self.admin)
        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'school_class': self.school_class.id,
            'day_of_week': timezone.now().isoweekday(),
            'start_time': '08:15:00', # 8:00 dan 8:45 gacha band ustoz
            'end_time': '09:00:00'
        }
        res = self.client.post('/api/v1/lessons/schedules/check_conflict/', data)
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(res.data['has_conflict'])
