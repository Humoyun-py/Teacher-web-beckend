"""URL patterns for analytics app."""

from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('admin-dashboard/', views.AdminDashboardAnalytics.as_view(), name='admin-dashboard'),
    path('teacher-dashboard/', views.TeacherDashboardAnalytics.as_view(), name='teacher-dashboard'),
]
