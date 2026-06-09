from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q
import calendar

from .models import KPIRecord
from .serializers import KPIRecordSerializer, KPICalculateSerializer
from teachers.models import Teacher
from attendance.models import Attendance
from lessons.models import Lesson
from photos.models import PhotoProof
from accounts.permissions import IsAdmin, IsAdminOrITSupport

class KPIViewSet(viewsets.ModelViewSet):
    """
    📈 KPI boshqaruvi.
    
    Admin/IT Support: KPI hisoblash va ko'rish.
    Teacher: O'z KPI ko'rsatkichlarini ko'rish.
    """
    queryset = KPIRecord.objects.select_related('teacher__user').all()
    serializer_class = KPIRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['teacher', 'month', 'year', 'grade']

    def get_permissions(self):
        if self.action in ('calculate', 'calculate_all', 'destroy'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            queryset = queryset.filter(teacher=user.teacher_profile)
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def calculate(self, request):
        """Ma'lum bir o'qituvchi va oy uchun KPI hisoblash."""
        serializer = KPICalculateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        month = serializer.validated_data['month']
        year = serializer.validated_data['year']
        teacher_id = serializer.validated_data.get('teacher_id')
        
        if teacher_id:
            try:
                teacher = Teacher.objects.get(id=teacher_id)
                record = self._calculate_teacher_kpi(teacher, month, year)
                return Response({
                    'message': f"{teacher.user.get_full_name()} uchun KPI muvaffaqiyatli hisoblandi.",
                    'kpi': KPIRecordSerializer(record).data
                })
            except Teacher.DoesNotExist:
                return Response({'error': 'O\'qituvchi topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Hamma o'qituvchilar uchun hisoblash
            teachers = Teacher.objects.filter(status='active')
            records = []
            for t in teachers:
                record = self._calculate_teacher_kpi(t, month, year)
                records.append(record)
            
            from accounts.models import AuditLog
            AuditLog.log(
                user=request.user,
                action='kpi_calc',
                description=f"{year}-yil {month}-oy uchun barcha o'qituvchilar KPIsi hisoblandi.",
                target_model='KPIRecord'
            )
            
            return Response({
                'message': f"{len(records)} ta o'qituvchi uchun KPI hisoblandi.",
                'kpis': KPIRecordSerializer(records, many=True).data
            })

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        """O'qituvchilar reytingi (KPI bo'yicha)."""
        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
        records = KPIRecord.objects.filter(month=month, year=year).order_by('-total_score')
        serializer = KPIRecordSerializer(records, many=True)
        return Response({
            'month': month,
            'year': year,
            'ranking': serializer.data
        })

    def _calculate_teacher_kpi(self, teacher, month, year):
        # 1. Davomat bali (Attendance Score)
        attendances = Attendance.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year
        )
        total_days = attendances.count()
        present_days = attendances.filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE]).count()
        
        attendance_score = (present_days / total_days) * 100 if total_days > 0 else 100.0
        
        # 2. Dars o'tish bali (Lesson Score)
        lessons = Lesson.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year,
            is_replaced=False # O'zi o'tishi kerak bo'lgan darslar
        )
        total_lessons = lessons.count()
        completed_lessons = lessons.filter(status=Lesson.Status.COMPLETED).count()
        
        lesson_score = (completed_lessons / total_lessons) * 100 if total_lessons > 0 else 100.0
        
        # 3. Rasm isboti bali (Proof Score)
        proofs = PhotoProof.objects.filter(
            teacher=teacher,
            lesson__date__month=month,
            lesson__date__year=year,
            status=PhotoProof.Status.ACCEPTED
        ).count()
        
        proof_score = (proofs / completed_lessons) * 100 if completed_lessons > 0 else 100.0
        if proof_score > 100.0:
            proof_score = 100.0
            
        # 4. Kechikmaslik bali (Late Arrival Score)
        total_arrivals = attendances.filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE]).count()
        on_time_arrivals = attendances.filter(status=Attendance.Status.PRESENT).count()
        
        late_arrival_score = (on_time_arrivals / total_arrivals) * 100 if total_arrivals > 0 else 100.0
        
        # 5. O'rinbosarlik bonusi (Replacement Score)
        replacements_count = Lesson.objects.filter(
            replacement_teacher=teacher,
            replacement_status=Lesson.ReplacementStatus.APPROVED,
            date__month=month,
            date__year=year,
            status=Lesson.Status.COMPLETED
        ).count()
        
        replacement_score = min(replacements_count * 10.0, 100.0) # Har bir o'rniga dars o'tishga +10 ball, max 100
        
        # 6. Umumiy KPI hisoblash (Weighted Average)
        # Davomat: 30%, Darslar: 30%, Proof: 20%, Kechikmaslik: 20%
        weighted_score = (
            (attendance_score * 0.3) +
            (lesson_score * 0.3) +
            (proof_score * 0.2) +
            (late_arrival_score * 0.2)
        )
        
        # O'rinbosarlik bonusi qo'shiladi (+5% per replacement, max 15% bonus)
        bonus_pct = min(replacements_count * 5.0, 15.0)
        total_score = min(weighted_score + bonus_pct, 100.0)
        
        # O'chirilgan yozuv bor yoki yo'qligini tekshirish (restore/create)
        record, created = KPIRecord.all_objects.update_or_create(
            teacher=teacher,
            month=month,
            year=year,
            defaults={
                'attendance_score': round(attendance_score, 2),
                'lesson_score': round(lesson_score, 2),
                'proof_score': round(proof_score, 2),
                'late_arrival_score': round(late_arrival_score, 2),
                'replacement_score': round(replacement_score, 2),
                'total_score': round(total_score, 2),
                'is_deleted': False,
                'deleted_at': None
            }
        )
        return record
