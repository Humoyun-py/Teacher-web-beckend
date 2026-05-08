import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.utils import timezone
from datetime import date, time, datetime, timedelta
from django.contrib.auth import get_user_model
from teachers.models import Teacher
from attendance.models import QRCode, Attendance
from rest_framework.test import APIRequestFactory, force_authenticate
from attendance.views import QRCheckInView

User = get_user_model()
User.objects.filter(username="test_teacher").delete()
user = User.objects.create_user(username="test_teacher", password="password", role="teacher")
teacher = Teacher.objects.create(user=user, employee_id="TEST001")
qr = QRCode.objects.create()

factory = APIRequestFactory()
view = QRCheckInView.as_view()

# Test 1: Normal check-in
request = factory.post('/api/v1/attendance/check-in/', {'qr_code': str(qr.code)}, format='json')
force_authenticate(request, user=user)
response = view(request)
print(f"Test 1 Status: {response.status_code}")
print(f"Test 1 Data: {response.data}")

# Test 2: Duplicate check-in
request = factory.post('/api/v1/attendance/check-in/', {'qr_code': str(qr.code)}, format='json')
force_authenticate(request, user=user)
response = view(request)
print(f"Test 2 Status: {response.status_code}")
print(f"Test 2 Data: {response.data}")

# Test 3: Invalid QR code
request = factory.post('/api/v1/attendance/check-in/', {'qr_code': '00000000-0000-0000-0000-000000000000'}, format='json')
force_authenticate(request, user=user)
response = view(request)
print(f"Test 3 Status: {response.status_code}")
print(f"Test 3 Data: {response.data}")

