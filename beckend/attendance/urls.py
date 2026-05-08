"""URL patterns for attendance app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'attendance'

router = DefaultRouter()
router.register('qrcodes', views.QRCodeViewSet, basename='qrcode')
router.register('', views.AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('check-in/', views.QRCheckInView.as_view(), name='qr-check-in'),
    path('', include(router.urls)),
]
