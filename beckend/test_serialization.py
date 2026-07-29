import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from teachers.models import Teacher
from teachers.serializers import TeacherSerializer

teacher = Teacher.objects.last()
print('Teacher:', teacher)
try:
    data = TeacherSerializer(teacher).data
    print('Serialization successful')
except Exception as e:
    import traceback
    traceback.print_exc()
    print('EXCEPTION IN SERIALIZATION:', e)
