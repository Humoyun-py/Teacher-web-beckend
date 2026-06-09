from rest_framework import serializers
from .models import CCTVCamera

class CCTVCameraSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CCTVCamera
        fields = [
            'id', 'name', 'location', 'ip_address', 'stream_url',
            'status', 'status_display', 'last_health_check',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_health_check']
