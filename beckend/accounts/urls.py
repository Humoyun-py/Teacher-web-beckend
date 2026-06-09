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

    # IT Support / Admin endpoints
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('admins/', views.AdminManagementView.as_view(), name='admin-management'),
    path('reset-password/', views.ResetUserPasswordView.as_view(), name='reset-password'),

    # Audit logs
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-log-list'),
    path('audit-logs/<int:pk>/', views.AuditLogDetailView.as_view(), name='audit-log-detail'),
]
