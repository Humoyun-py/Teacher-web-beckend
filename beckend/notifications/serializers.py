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
