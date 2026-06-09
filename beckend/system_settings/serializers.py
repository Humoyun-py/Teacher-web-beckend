from rest_framework import serializers
from .models import SystemSetting

class SystemSettingSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = SystemSetting
        fields = [
            'id', 'key', 'value', 'description', 'category',
            'category_display', 'is_active', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
