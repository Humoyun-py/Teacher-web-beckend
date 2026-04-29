import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from teachers.models import Teacher

User = get_user_model()
u = User(username="temp")
try:
    print(u.teacher_profile)
except Exception as e:
    print("Class:", e.__class__.__name__)
    print("Inherits from Teacher.DoesNotExist:", isinstance(e, Teacher.DoesNotExist))
