"""
URL Configuration for Teacher Management System.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Teacher Management System API",
        default_version='v1',
        description="""
## Teacher Management System - API Documentation

### 👑 Admin funksiyalari:
- **Dashboard** - Statistika va monitoring
- **Teacher boshqaruvi** - CRUD operatsiyalari
- **Dars jadvali** - Jadval yaratish va boshqarish
- **QR Check-in** - Davomat nazorati
- **Video tekshirish** - Video proof nazorati
- **Dars nazorati** - Dars holati monitoring
- **Analitika** - Statistik hisobotlar
- **Bildirishnomalar** - Alert va ogohlantirish

### 👨🏫 Teacher funksiyalari:
- **Dashboard** - Shaxsiy panel
- **QR Check-in** - Maktabga kelish tasdiqlash
- **Dars jarayoni** - Start/End Lesson
- **Video yuborish** - Dars video proof
- **Jadval** - Haftalik jadval
- **Shaxsiy statistika** - KPI
- **Bildirishnomalar** - Eslatmalar
        """,
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="admin@teachermgmt.uz"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),

    # Swagger UI
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # API endpoints
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/teachers/', include('teachers.urls')),
    path('api/v1/lessons/', include('lessons.urls')),
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/videos/', include('videos.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
