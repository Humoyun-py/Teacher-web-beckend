"""URL patterns for accounts app."""

from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('', views.AuthRootView.as_view(), name='auth-root'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    # IT Support endpoints
    path('it-support/dashboard/', views.ITSupportDashboardView.as_view(), name='it-support-dashboard'),
    path('it-support/admins/', views.AdminManagementView.as_view(), name='admin-management'),
    path('it-support/admins/<int:pk>/', views.AdminDetailView.as_view(), name='admin-detail'),
    path('it-support/users/<int:pk>/reset-password/', views.AdminResetPasswordView.as_view(), name='admin-reset-password'),
    path('it-support/users/<int:pk>/block-toggle/', views.UserBlockToggleView.as_view(), name='user-block-toggle'),
    path('it-support/audit-logs/', views.AuditLogView.as_view(), name='audit-logs'),
    path('it-support/lesson-fix/', views.LessonFixView.as_view(), name='lesson-fix'),
    path('it-support/attendance-fix/', views.AttendanceFixView.as_view(), name='attendance-fix'),
]
