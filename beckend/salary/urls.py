from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.SalaryViewSet, basename='salary')

app_name = 'salary'

urlpatterns = [
    path('', include(router.urls)),
]
