"""
Views for notifications.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationMarkReadSerializer,
    SendNotificationSerializer,
)
from accounts.permissions import IsAdminOrITSupport
from accounts.models import User

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

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'message': f'{updated} ta bildirishnoma o\'qildi.'})


class SendNotificationView(APIView):
    """
    Bildirishnoma yuborish (Admin/IT Support).
    Specific users yoki barcha teacher/adminlarga yuborish mumkin.
    """
    permission_classes = [IsAdminOrITSupport]

    def post(self, request):
        serializer = SendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        title = data['title']
        message = data['message']
        notification_type = data['notification_type']

        recipients = User.objects.none()

        if data.get('send_to_all_teachers'):
            recipients = recipients | User.objects.filter(role='teacher', is_active=True)

        if data.get('send_to_all_admins'):
            recipients = recipients | User.objects.filter(
                role__in=['admin', 'it_support'], is_active=True
            )

        if data.get('recipient_ids'):
            recipients = recipients | User.objects.filter(id__in=data['recipient_ids'], is_active=True)

        if not recipients.exists():
            return Response(
                {'error': 'Kamida bitta qabul qiluvchi ko\'rsatilishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipients = recipients.distinct()
        notifications = [
            Notification(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
            )
            for user in recipients
        ]
        Notification.objects.bulk_create(notifications)

        return Response({
            'message': f'{len(notifications)} ta foydalanuvchiga bildirishnoma yuborildi.',
            'recipients_count': len(notifications),
        }, status=status.HTTP_201_CREATED)
