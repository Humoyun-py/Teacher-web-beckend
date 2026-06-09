from rest_framework import serializers
from .models import SalaryRecord
from teachers.serializers import TeacherListSerializer
from accounts.serializers import UserSerializer

class SalaryRecordSerializer(serializers.ModelSerializer):
    teacher_detail = TeacherListSerializer(source='teacher', read_only=True)
    approved_by_detail = UserSerializer(source='approved_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = SalaryRecord
        fields = [
            'id', 'teacher', 'teacher_detail', 'month', 'year',
            'base_salary', 'base_earned', 'replacement_earned',
            'replaced_out_deduction', 'penalty_amount', 'kpi_bonus',
            'kpi_penalty', 'final_salary', 'status', 'status_display',
            'calculated_at', 'approved_by', 'approved_by_detail',
            'approved_at', 'paid_at'
        ]
        read_only_fields = ['id', 'calculated_at', 'approved_by', 'approved_at', 'paid_at']

class SalaryCalculateSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2050)
    teacher_id = serializers.IntegerField(required=False, allow_null=True)
