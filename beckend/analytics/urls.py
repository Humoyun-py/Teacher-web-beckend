"""URL patterns for analytics app."""

from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('admin-dashboard/', views.AdminDashboardAnalytics.as_view(), name='admin-dashboard'),
    path('teacher-dashboard/', views.TeacherDashboardAnalytics.as_view(), name='teacher-dashboard'),
    path('weekly/', views.WeeklyStatsView.as_view(), name='weekly-stats'),
    path('monthly/', views.MonthlyStatsView.as_view(), name='monthly-stats'),
    path('teacher-ranking/', views.TeacherRankingView.as_view(), name='teacher-ranking'),
    path('attendance-report/', views.AttendanceReportView.as_view(), name='attendance-report'),
    path('lesson-report/', views.LessonReportView.as_view(), name='lesson-report'),
]
