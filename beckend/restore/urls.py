from django.urls import path
from . import views

app_name = 'restore'

urlpatterns = [
    path('deleted/<str:model_name>/', views.DeletedRecordsListView.as_view(), name='deleted-records-list'),
    path('restore/<str:model_name>/<int:pk>/', views.RestoreRecordView.as_view(), name='restore-record'),
]
