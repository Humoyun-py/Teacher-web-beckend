#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Avtomatik admin va demo teacher yaratish (agar mavjud bo'lmasa)
python manage.py shell -c "
from accounts.models import User
from teachers.models import Teacher

# Admin yaratish
if not User.objects.filter(username='admin').exists():
    user = User(username='admin', role='admin', is_staff=True, is_superuser=True, first_name='Admin', last_name='System')
    user.set_password('admin123')
    user.save()
    print('✅ Admin user yaratildi!')
else:
    print('ℹ️ Admin user allaqachon mavjud.')
"
