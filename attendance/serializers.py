"""
Serializers for attendance app.
"""

from rest_framework import serializers
from django.utils import timezone

from .models import QRCode, Attendance


class QRCodeSerializer(serializers.ModelSerializer):
    """Serializer for QR Code."""

    class Meta:
        model = QRCode
        fields = [
            'id', 'code', 'is_active',
            'created_by', 'created_at',
        ]
        read_only_fields = ['code', 'created_by', 'created_at']

class QRCodeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating QR codes."""

    class Meta:
        model = QRCode
        fields = []


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance."""

    teacher_name = serializers.CharField(
        source='teacher.user.get_full_name', read_only=True,
    )
    teacher_employee_id = serializers.CharField(
        source='teacher.employee_id', read_only=True,
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True,
    )

    class Meta:
        model = Attendance
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_employee_id',
            'date', 'check_in_time', 'check_out_time',
            'status', 'status_display', 'qr_code',
            'is_late', 'late_minutes', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['check_in_time', 'is_late', 'late_minutes']


class QRCheckInSerializer(serializers.Serializer):
    """Serializer for QR check-in."""

    qr_code = serializers.UUIDField()

    def validate_qr_code(self, value):
        try:
            qr = QRCode.objects.get(code=value)
        except QRCode.DoesNotExist:
            raise serializers.ValidationError('QR kod topilmadi.')

        if not qr.is_active:
            raise serializers.ValidationError('QR kod faol emas.')

        return value


class AttendanceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin updating attendance."""

    class Meta:
        model = Attendance
        fields = ['status', 'notes']
