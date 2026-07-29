import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from teachers.views import TeacherViewSet
from rest_framework.test import APIRequestFactory
from accounts.models import User

factory = APIRequestFactory()
request = factory.post('/api/v1/teachers/', {
    'username': 'test_no_salary_user_2',
    'password': 'password123',
    'first_name': 'Test',
    'last_name': 'NoSalary',
    'phone': '+998901234560',
}, format='json')

admin_user = User.objects.filter(is_superuser=True).first()
request.user = admin_user
view = TeacherViewSet.as_view({'post': 'create'})
try:
    response = view(request)
    print('STATUS:', response.status_code)
except Exception as e:
    import traceback
    traceback.print_exc()
    print('EXCEPTION:', e)
