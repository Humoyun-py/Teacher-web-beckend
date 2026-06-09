"""URL patterns for notifications app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

router = DefaultRouter()
router.register('', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('send/', views.SendNotificationView.as_view(), name='send-notification'),
    path('', include(router.urls)),
]
