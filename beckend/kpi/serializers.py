from rest_framework import serializers
from .models import KPIRecord
from teachers.serializers import TeacherListSerializer

class KPIRecordSerializer(serializers.ModelSerializer):
    teacher_detail = TeacherListSerializer(source='teacher', read_only=True)
    
    class Meta:
        model = KPIRecord
        fields = [
            'id', 'teacher', 'teacher_detail', 'month', 'year',
            'attendance_score', 'lesson_score', 'proof_score',
            'late_arrival_score', 'replacement_score', 'total_score',
            'grade', 'calculated_at'
        ]
        read_only_fields = ['id', 'calculated_at', 'grade']

class KPICalculateSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2050)
    teacher_id = serializers.IntegerField(required=False, allow_null=True)
