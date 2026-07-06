import os
import sys
import django

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

username = "Humoyun-Jo'rayev"
password = "Jo'rayev"

try:
    # Eski foydalanuvchini o'chirish (agar mavjud bo'lsa)
    User.objects.filter(username=username).delete()
    
    # Yangi IT Support foydalanuvchi yaratish
    user = User.objects.create_user(
        username=username,
        role=User.Role.IT_SUPPORT,
        is_staff=True,
        is_superuser=True,
        first_name="Humoyun",
        last_name="Jo'rayev"
    )
    user.set_password(password)
    user.save()
    print(f"✅ SUCCESS: IT SUPPORT USER CREATED")
    print(f"   Login:  {username}")
    print(f"   Parol:  {password}")
    print(f"   Role:   {user.role}")
    print(f"   ID:     {user.id}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
