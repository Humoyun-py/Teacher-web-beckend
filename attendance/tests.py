from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta, date
from accounts.models import User
from teachers.models import Teacher
from attendance.models import QRCode, Attendance

class AttendanceApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='123', role='admin')
        self.teacher_user = User.objects.create_user(username='t1', password='123', role='teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, employee_id='001')
        
    def test_admin_generate_qr_code(self):
        """Admin POST orqali QR yaratishi va GET listidan olishi"""
        self.client.force_authenticate(user=self.admin)
        
        # Generete today qr
        res = self.client.post('/api/v1/attendance/qrcodes/generate_static/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue('code' in res.data)
        qr_code = res.data['code']
        
        # QR ni API orqali chaqirib rasm qilib tekshirish (GET)
        img_res = self.client.get(f'/api/v1/attendance/qrcodes/{res.data["id"]}/image/')
        self.assertEqual(img_res.status_code, status.HTTP_200_OK)
        self.assertEqual(img_res['Content-Type'], 'image/png')
        
        return qr_code

    def test_teacher_check_in(self):
        """Teacher yaratilgan QR kod bilan check-in qila olishi (POST)"""
        # Avval admin bitta QR yaratadi (qo'lda databazaga solamiz yoki funksiya)
        qr = QRCode.objects.create(
            created_by=self.admin
        )
        
        # Teacher auth log in check in API
        self.client.force_authenticate(user=self.teacher_user)
        res = self.client.post('/api/v1/attendance/check-in/', {'qr_code': str(qr.code)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Qayta urinib ko'rishi xatolik berishi kerak
        res2 = self.client.post('/api/v1/attendance/check-in/', {'qr_code': str(qr.code)})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_attendance_list(self):
        """Davomat o'tganlar listini admin (GET) qilib ko'rishi"""
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/v1/attendance/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
