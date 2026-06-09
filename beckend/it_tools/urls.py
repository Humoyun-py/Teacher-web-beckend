from django.urls import path
from . import views

app_name = 'it_tools'

urlpatterns = [
    path('act-as/', views.ActAsView.as_view(), name='act-as'),
    path('fix-attendance/', views.FixAttendanceView.as_view(), name='fix-attendance'),
    path('fix-lesson/', views.FixLessonView.as_view(), name='fix-lesson'),
    path('fix-salary/', views.FixSalaryView.as_view(), name='fix-salary'),
]
