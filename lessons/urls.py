"""URL patterns for lessons app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'lessons'

router = DefaultRouter()
router.register('schedules', views.LessonScheduleViewSet, basename='schedule')
router.register('', views.LessonViewSet, basename='lesson')

urlpatterns = [
    path('', include(router.urls)),
]
