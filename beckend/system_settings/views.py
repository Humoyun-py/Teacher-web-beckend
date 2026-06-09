from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import SystemSetting
from .serializers import SystemSettingSerializer
from accounts.permissions import IsAdminOrITSupport, IsITSupport
from accounts.models import AuditLog

class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    ⚙️ Tizim sozlamalari boshqaruvi.
    
    IT Support: To'liq boshqarish va o'zgartirish.
    Admin: Sozlamalarni ko'rish.
    """
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_active']
    lookup_field = 'key'

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrITSupport()]
        return [IsITSupport()]

    def perform_create(self, serializer):
        setting = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action='system_config',
            description=f"Yangi tizim sozlamasi qo'shildi: {setting.key} = {setting.value}",
            target_model='SystemSetting',
            target_id=setting.id,
            target_name=setting.key
        )

    def perform_update(self, serializer):
        old_setting = self.get_object()
        old_data = SystemSettingSerializer(old_setting).data
        setting = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action='system_config',
            description=f"Tizim sozlamasi o'zgartirildi: {setting.key} -> {setting.value}",
            target_model='SystemSetting',
            target_id=setting.id,
            target_name=setting.key,
            old_data=old_data,
            new_data=SystemSettingSerializer(setting).data
        )

    def perform_destroy(self, instance):
        AuditLog.log(
            user=self.request.user,
            action='system_config',
            description=f"Tizim sozlamasi o'chirildi: {instance.key}",
            target_model='SystemSetting',
            target_id=instance.id,
            target_name=instance.key
        )
        instance.delete()
