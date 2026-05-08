"""
Views for notifications.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer, NotificationMarkReadSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Bildirishnomalarni ko'rish va o'qilgan deb belgilash.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated = Notification.objects.filter(
            recipient=request.user,
            id__in=serializer.validated_data['notification_ids']
        ).update(is_read=True)
        
        return Response({'message': f'{updated} ta bildirishnoma o\'qildi.'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
