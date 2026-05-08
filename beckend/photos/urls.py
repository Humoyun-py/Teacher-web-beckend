"""URL patterns for photos app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'photos'

router = DefaultRouter()
router.register('', views.PhotoProofViewSet, basename='photo')

urlpatterns = [
    path('', include(router.urls)),
]
