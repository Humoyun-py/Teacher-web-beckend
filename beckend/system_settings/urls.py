from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.SystemSettingViewSet, basename='systemsetting')

app_name = 'system_settings'

urlpatterns = [
    path('', include(router.urls)),
]
