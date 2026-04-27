import tempfile
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, time
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import User
from teachers.models import Teacher, Subject, SchoolClass
from lessons.models import Lesson, LessonSchedule
from videos.models import VideoProof

class VideosApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='123', role='admin')
        self.teacher_user = User.objects.create_user(username='t1', password='123', role='teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, employee_id='001')
        self.subject = Subject.objects.create(name='Fizika')
        self.school_class = SchoolClass.objects.create(name='9-B', grade=9, section='B')
        
        self.schedule = LessonSchedule.objects.create(
            teacher=self.teacher, subject=self.subject, school_class=self.school_class,
            day_of_week=1, start_time=time(8,0), end_time=time(8,45)
        )
        self.lesson = Lesson.objects.create(
            schedule=self.schedule, teacher=self.teacher, subject=self.subject,
            school_class=self.school_class, date=date.today(), scheduled_start=time(8,0), scheduled_end=time(8,45)
        )

    def test_teacher_can_upload_video(self):
        """Teacher fayl upload (POST) orqali yubora oladimi? """
        self.client.force_authenticate(user=self.teacher_user)
        
        # Oxta video faylini simulatsiya qilish
        fake_video = SimpleUploadedFile(
            name='test_video.mp4', 
            content=b'fakevideocontent123',
            content_type='video/mp4'
        )
        
        data = {
            'lesson': self.lesson.id,
            'video': fake_video,
            'duration_seconds': 60
        }
        res = self.client.post('/api/v1/videos/', data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')
        return res.data['id']

    def test_admin_can_review_video(self):
        """Admin kutib turgan videoni ko'rishi (GET) va uni rad etish (POST action)"""
        # Avval video kerak
        video = VideoProof.objects.create(
            teacher=self.teacher,
            lesson=self.lesson,
            video='videos/test.mp4',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.admin)
        # Barchasini get qilib olish
        get_res = self.client.get('/api/v1/videos/')
        self.assertTrue(len(get_res.data) > 0)
        
        # Videoni rad qilish (Reject - Custom POST api)
        reject_res = self.client.post(f'/api/v1/videos/{video.id}/review/', {
            'status': 'rejected',
            'review_notes': 'Sifati past'
        })
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        
        video.refresh_from_db()
        self.assertEqual(video.status, 'rejected')
        self.assertEqual(video.review_notes, 'Sifati past')
