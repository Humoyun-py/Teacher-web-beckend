"""
Serializers for notifications app.
"""

from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at']
        read_only_fields = ['title', 'message', 'notification_type', 'created_at']

class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer to mark notification as read."""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for admin to send notifications."""
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(
        choices=Notification.Type.choices,
        default=Notification.Type.INFO,
    )
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="Specific user IDs. Empty = send to all active teachers.",
    )
    send_to_all_teachers = serializers.BooleanField(
        default=False,
        help_text="If True, sends to all active teachers.",
    )
    send_to_all_admins = serializers.BooleanField(
        default=False,
        help_text="If True, sends to all admins.",
    )
