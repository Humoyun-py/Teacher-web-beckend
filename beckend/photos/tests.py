import tempfile
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, time
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import User
from teachers.models import Teacher, Subject, SchoolClass
from lessons.models import Lesson, LessonSchedule
from photos.models import PhotoProof

class PhotosApiTests(APITestCase):
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

    def test_teacher_can_upload_photo(self):
        """Teacher fayl upload (POST) orqali rasm yubora oladimi? """
        self.client.force_authenticate(user=self.teacher_user)
        
        fake_image = SimpleUploadedFile(
            name='test_image.jpg', 
            content=b'fakeimagecontent123',
            content_type='image/jpeg'
        )
        
        data = {
            'lesson': self.lesson.id,
            'photo': fake_image
        }
        res = self.client.post('/api/v1/photos/', data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')
        return res.data['id']

    def test_admin_can_review_photo(self):
        """Admin kutib turgan rasmni ko'rishi (GET) va uni rad etish (POST action)"""
        photo = PhotoProof.objects.create(
            teacher=self.teacher,
            lesson=self.lesson,
            photo='photos/test.jpg',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.admin)
        get_res = self.client.get('/api/v1/photos/')
        self.assertTrue(len(get_res.data) > 0)
        
        reject_res = self.client.post(f'/api/v1/photos/{photo.id}/review/', {
            'status': 'rejected',
            'review_notes': 'Sifati past'
        })
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        
        photo.refresh_from_db()
        self.assertEqual(photo.status, 'rejected')
        self.assertEqual(photo.review_notes, 'Sifati past')
