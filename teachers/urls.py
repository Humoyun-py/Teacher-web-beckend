"""URL patterns for teachers app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'teachers'

router = DefaultRouter()
router.register('subjects', views.SubjectViewSet, basename='subject')
router.register('classes', views.SchoolClassViewSet, basename='class')
router.register('', views.TeacherViewSet, basename='teacher')

urlpatterns = [
    path('', include(router.urls)),
]
