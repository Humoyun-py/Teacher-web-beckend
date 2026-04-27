from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from accounts.models import User
from teachers.models import Subject, SchoolClass, Teacher

class TeacherAndCoreFlowTests(APITestCase):
    def setUp(self):
        # Admin yaratish
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='Password123',
            role='admin'
        )
        # Teacher yaratish (to'g'ridan to'g'ri tizim orqali)
        self.teacher_user = User.objects.create_user(
            username='teacher_test',
            password='Password123',
            role='teacher',
            first_name='Ali',
            last_name='Valiyev'
        )
        self.teacher_profile = Teacher.objects.create(
            user=self.teacher_user,
            employee_id='T001',
            status='active'
        )

    def test_admin_can_create_subject_and_class(self):
        """Admin yangi fan va sinf yarata olishi tekshiriladi (POST)"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Fan yaratish (POST)
        subject_data = {'name': 'Matematika', 'description': 'Oliy matematika'}
        response = self.client.post('/api/v1/teachers/subjects/', subject_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        subject_id = response.data['id']

        # Sinf yaratish (POST)
        class_data = {'name': '10-A', 'grade': 10, 'section': 'A'}
        response = self.client.post('/api/v1/teachers/classes/', class_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        class_id = response.data['id']

        # Fanni o'zgartirish (PATCH)
        patch_data = {'description': 'Yangilangan matematika'}
        response = self.client.patch(f'/api/v1/teachers/subjects/{subject_id}/', patch_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Yangilangan matematika')

    def test_admin_can_create_and_manage_teacher(self):
        """Admin yangi teacher account qo'shishi, fanni biriktirishi (POST/PATCH/PUT)"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Teacher Profile yaratish (POST)
        teacher_data = {
            'username': 'yangi_teacher',
            'password': 'Password123',
            'first_name': 'Hasan',
            'last_name': 'Husanov',
            'employee_id': 'T002'
        }
        res = self.client.post('/api/v1/teachers/', teacher_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        
        teacher_id = res.data['id']

        # Ustoz ismini o'zgartirish (PATCH)
        update_data = {'first_name': 'Hasanboy'}
        patch_res = self.client.patch(f'/api/v1/teachers/{teacher_id}/', update_data)
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        
    def test_teacher_can_view_own_dashboard(self):
        """Teacherlar ro'yxatini yoki o'z profilini o'qish imkoni (GET)"""
        self.client.force_authenticate(user=self.teacher_user)
        
        # Barcha teacherlar ruyxati (bu hamma uchun ochiq - read-only)
        res = self.client.get('/api/v1/teachers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
    def test_teacher_cannot_create_teachers(self):
        """Teacher boshqa teacher qo'sha olmasligi tekshiriladi"""
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.post('/api/v1/teachers/', {
            'username': 'fake', 'password': '123', 'first_name': 'A', 'last_name': 'B', 'employee_id': '111'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
