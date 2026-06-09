from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import random

from .models import CCTVCamera
from .serializers import CCTVCameraSerializer
from accounts.permissions import IsAdminOrITSupport, IsITSupport

class CCTVCameraViewSet(viewsets.ModelViewSet):
    """
    📹 CCTV Kameralar boshqaruvi.
    
    IT Support: To'liq boshqarish va Health check.
    Admin: Kameralar holatini ko'rish.
    """
    queryset = CCTVCamera.objects.all()
    serializer_class = CCTVCameraSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrITSupport()]
        return [IsITSupport()]

    @action(detail=True, methods=['post'])
    def health_check(self, request, pk=None):
        """Kamera faolligini tekshirish (Health check simulyatsiyasi)."""
        camera = self.get_object()
        
        # Simulyatsiya: 90% holatda online, 10% offline bo'ladi
        status_choice = random.choices(
            [CCTVCamera.Status.ONLINE, CCTVCamera.Status.OFFLINE],
            weights=[90, 10]
        )[0]
        
        camera.status = status_choice
        camera.last_health_check = timezone.now()
        camera.save()
        
        from accounts.models import AuditLog
        AuditLog.log(
            user=request.user,
            action='cctv_action',
            description=f"CCTV kamera health check o'tkazildi: {camera.name} -> {camera.get_status_display()}",
            target_model='CCTVCamera',
            target_id=camera.id,
            target_name=camera.name
        )
        
        return Response({
            'message': 'Sog\'liq tekshiruvi yakunlandi.',
            'status': camera.status,
            'camera': CCTVCameraSerializer(camera).data
        })

    @action(detail=False, methods=['post'])
    def check_all(self, request):
        """Barcha kameralarni tekshirish."""
        cameras = CCTVCamera.objects.filter(is_active=True)
        updated_count = 0
        for camera in cameras:
            status_choice = random.choices(
                [CCTVCamera.Status.ONLINE, CCTVCamera.Status.OFFLINE],
                weights=[95, 5]
            )[0]
            camera.status = status_choice
            camera.last_health_check = timezone.now()
            camera.save()
            updated_count += 1
            
        from accounts.models import AuditLog
        AuditLog.log(
            user=request.user,
            action='cctv_action',
            description="Barcha faol CCTV kameralar health check o'tkazildi.",
            target_model='CCTVCamera'
        )
        
        return Response({
            'message': f"{updated_count} ta kamera muvaffaqiyatli tekshirildi.",
            'cameras': CCTVCameraSerializer(CCTVCamera.objects.all(), many=True).data
        })
