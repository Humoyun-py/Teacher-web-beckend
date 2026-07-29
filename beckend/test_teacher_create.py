#!/usr/bin/env python
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from teachers.models import Teacher
from accounts.models import User

print('Users count:', User.objects.count())
print('Teachers count:', Teacher.objects.count())
print()

# Check existing employee_ids
print('Existing employee_ids:')
for t in Teacher.objects.all():
    print(f'  id={t.id} employee_id={t.employee_id} user={t.user.username}')
print()

# Check for duplicate employee_id issues
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT employee_id, COUNT(*) as cnt FROM teachers_teacher WHERE is_deleted=0 GROUP BY employee_id HAVING cnt > 1")
    dupes = cursor.fetchall()
    if dupes:
        print('DUPLICATE employee_ids found:', dupes)
    else:
        print('No duplicate employee_ids')

# Test teacher creation
try:
    from teachers.serializers import TeacherCreateSerializer
    data = {
        'username': 'test_debug_user_777',
        'password': '123456',
        'first_name': 'Test',
        'last_name': 'Debug',
        'phone': '+998901234567',
        'monthly_salary': '1000000',
    }
    s = TeacherCreateSerializer(data=data)
    valid = s.is_valid()
    if valid:
        print('Serializer VALID')
        teacher = s.save()
        print('Teacher created successfully:', teacher, 'employee_id:', teacher.employee_id)
        # Clean up
        teacher.user.delete()
        teacher.hard_delete()
        print('Cleanup done')
    else:
        print('Serializer INVALID:', s.errors)
except Exception as e:
    import traceback
    traceback.print_exc()
    print('ERROR:', type(e).__name__, str(e))

# Also check if SoftDeleteModel is causing issues
print()
print('All teachers (including soft-deleted):')
for t in Teacher.all_objects.all():
    print(f'  id={t.id} employee_id={t.employee_id} is_deleted={t.is_deleted}')
