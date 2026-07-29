import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from teachers.views import TeacherViewSet
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.post('/api/v1/teachers/', {
    'username': 'new_unique_test_user_99',
    'password': 'password123',
    'first_name': 'Test',
    'last_name': 'Create',
    'phone': '+998901234568',
    'monthly_salary': '2000000'
}, format='json')

# We need to simulate the request as an admin user to bypass permissions
from accounts.models import User
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    admin_user = User.objects.create_superuser('admin_test_99', 'admin@test.com', 'pass')
from rest_framework.request import Request
request.user = admin_user

view = TeacherViewSet.as_view({'post': 'create'})
try:
    response = view(request)
    print("STATUS:", response.status_code)
    print("DATA:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
    print("EXCEPTION TYPE:", type(e))
    print("EXCEPTION:", str(e))
