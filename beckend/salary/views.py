from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from .models import SalaryRecord
from .serializers import SalaryRecordSerializer, SalaryCalculateSerializer
from teachers.models import Teacher
from attendance.models import Attendance
from lessons.models import Lesson
from kpi.models import KPIRecord
from accounts.permissions import IsAdmin, IsAdminOrITSupport

class SalaryViewSet(viewsets.ModelViewSet):
    """
    💰 Oylik maosh boshqaruvi.
    
    Admin/IT Support: Oylik hisoblash, tasdiqlash va to'lash.
    Teacher: O'z oylik maosh varaqasini ko'rish.
    """
    queryset = SalaryRecord.objects.select_related('teacher__user', 'approved_by').all()
    serializer_class = SalaryRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['teacher', 'month', 'year', 'status']

    def get_permissions(self):
        if self.action in ('calculate', 'approve', 'pay', 'destroy'):
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
        """Ma'lum bir o'qituvchi va oy uchun oylik maoshni hisoblash."""
        serializer = SalaryCalculateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        month = serializer.validated_data['month']
        year = serializer.validated_data['year']
        teacher_id = serializer.validated_data.get('teacher_id')
        
        if teacher_id:
            try:
                teacher = Teacher.objects.get(id=teacher_id)
                record = self._calculate_teacher_salary(teacher, month, year)
                return Response({
                    'message': f"{teacher.user.get_full_name()} uchun maosh muvaffaqiyatli hisoblandi.",
                    'salary': SalaryRecordSerializer(record).data
                })
            except Teacher.DoesNotExist:
                return Response({'error': 'O\'qituvchi topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Hamma o'qituvchilar uchun hisoblash
            teachers = Teacher.objects.filter(status='active')
            records = []
            for t in teachers:
                record = self._calculate_teacher_salary(t, month, year)
                records.append(record)
            
            from accounts.models import AuditLog
            AuditLog.log(
                user=request.user,
                action='salary_calc',
                description=f"{year}-yil {month}-oy uchun barcha o'qituvchilar maoshi hisoblandi.",
                target_model='SalaryRecord'
            )
            
            return Response({
                'message': f"{len(records)} ta o'qituvchi uchun maosh hisoblandi.",
                'salaries': SalaryRecordSerializer(records, many=True).data
            })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        """Oylik maosh yozuvini tasdiqlash (Admin/IT Support)."""
        salary = self.get_object()
        if salary.status != SalaryRecord.Status.DRAFT:
            return Response({'error': 'Faqat qoralama holatidagi maoshni tasdiqlash mumkin.'}, status=status.HTTP_400_BAD_REQUEST)
            
        salary.status = SalaryRecord.Status.APPROVED
        salary.approved_by = request.user
        salary.approved_at = timezone.now()
        salary.save()
        
        from accounts.models import AuditLog
        AuditLog.log(
            user=request.user,
            action='admin_action',
            description=f"{salary.teacher.user.get_full_name()} uchun {salary.year}/{salary.month} maoshi tasdiqlandi.",
            target_model='SalaryRecord',
            target_id=salary.id,
            target_name=salary.teacher.user.get_full_name()
        )
        
        return Response({
            'message': 'Maosh muvaffaqiyatli tasdiqlandi.',
            'salary': SalaryRecordSerializer(salary).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def pay(self, request, pk=None):
        """Oylik maoshni to'langan deb belgilash (Admin/IT Support)."""
        salary = self.get_object()
        if salary.status != SalaryRecord.Status.APPROVED:
            return Response({'error': 'Faqat tasdiqlangan maoshni to\'lash mumkin.'}, status=status.HTTP_400_BAD_REQUEST)
            
        salary.status = SalaryRecord.Status.PAID
        salary.paid_at = timezone.now()
        salary.save()
        
        from accounts.models import AuditLog
        AuditLog.log(
            user=request.user,
            action='admin_action',
            description=f"{salary.teacher.user.get_full_name()} uchun {salary.year}/{salary.month} maoshi to'landi.",
            target_model='SalaryRecord',
            target_id=salary.id,
            target_name=salary.teacher.user.get_full_name()
        )
        
        return Response({
            'message': 'Maosh muvaffaqiyatli to\'landi deb belgilandi.',
            'salary': SalaryRecordSerializer(salary).data
        })

    @action(detail=False, methods=['get'])
    def report(self, request):
        """Maoshlar yuzasidan oylik umumiy hisobot."""
        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
        records = SalaryRecord.objects.filter(month=month, year=year)
        total_payout = records.aggregate(total=Sum('final_salary'))['total'] or Decimal('0.00')
        total_bonus = records.aggregate(total=Sum('kpi_bonus'))['total'] or Decimal('0.00')
        total_penalty = records.aggregate(total=Sum('penalty_amount'))['total'] or Decimal('0.00')
        
        return Response({
            'month': month,
            'year': year,
            'total_teachers': records.count(),
            'total_payout': str(total_payout),
            'total_bonus': str(total_bonus),
            'total_penalty': str(total_penalty),
            'salaries': SalaryRecordSerializer(records, many=True).data
        })

    def _calculate_teacher_salary(self, teacher, month, year):
        # 1. Teacher ma'lumotlari
        base_salary = Decimal(str(teacher.monthly_salary))
        lesson_rate = Decimal(str(teacher.lesson_rate))
        
        # 2. Davomat (kelgan kunlar)
        attendances = Attendance.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year
        )
        present_days = attendances.filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE]).count()
        base_earned = Decimal(present_days) * (base_salary / Decimal('24')) if base_salary > 0 else Decimal('0.00')
        
        # 3. Kechikish jarimalari
        penalty_amount = attendances.aggregate(total=Sum('penalty_amount'))['total'] or Decimal('0.00')
        
        # 4. O'z darslari (o'tqazilgan darslar soni) - DARS ASOSIDA
        # Asl teacher o'z darslarini o'tqazgani uchun
        own_lessons = Lesson.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year,
            status=Lesson.Status.COMPLETED,
            is_replaced=False,  # Replace bo'lmagan o'z darslari
        )
        own_lessons_count = own_lessons.count()
        lessons_earned = Decimal(own_lessons_count) * lesson_rate
        
        # 5. O'rniga o'tilgan darslar (boshqa teacherga pul o'tadi)
        replaced_out_lessons = Lesson.objects.filter(
            teacher=teacher,
            is_replaced=True,
            replacement_status=Lesson.ReplacementStatus.APPROVED,
            date__month=month,
            date__year=year,
            status=Lesson.Status.COMPLETED
        )
        replaced_out_count = replaced_out_lessons.count()
        # Asl teacher'ga bu darslar uchun PUL TO'LANMAYDI (o'rniga o'tkazgan teacherga o'tadi)
        replaced_out_deduction = Decimal(replaced_out_count) * lesson_rate
        
        # 6. Boshqalar o'rniga o'tilgan darslar (qo'shimcha pul)
        replaced_in_lessons = Lesson.objects.filter(
            replacement_teacher=teacher,
            replacement_status=Lesson.ReplacementStatus.APPROVED,
            date__month=month,
            date__year=year,
            status=Lesson.Status.COMPLETED
        )
        replaced_in_count = replaced_in_lessons.count()
        replacement_earned = Decimal(replaced_in_count) * lesson_rate
        
        # 7. KPI Bonus / Penalty
        kpi_bonus = Decimal('0.00')
        kpi_penalty = Decimal('0.00')
        
        try:
            kpi = KPIRecord.objects.get(teacher=teacher, month=month, year=year)
            if kpi.grade == 'A':
                kpi_bonus = base_salary * Decimal('0.10')
            elif kpi.grade == 'B':
                kpi_bonus = base_salary * Decimal('0.05')
            elif kpi.grade == 'F':
                kpi_penalty = base_salary * Decimal('0.10')
        except KPIRecord.DoesNotExist:
            pass
            
        # 8. Yakuniy oylik maosh
        # Asosiy: lessons_earned (o'z darslari) + replacement_earned (boshqa o'rniga) - replaced_out_deduction (o'z darsini o'tkazgani)
        # + base_earned (davomat asosida) - penalty_amount + kpi_bonus - kpi_penalty
        final_salary = lessons_earned + replacement_earned - replaced_out_deduction + base_earned - penalty_amount + kpi_bonus - kpi_penalty
        if final_salary < 0:
            final_salary = Decimal('0.00')
            
        record, created = SalaryRecord.all_objects.update_or_create(
            teacher=teacher,
            month=month,
            year=year,
            defaults={
                'base_salary': base_salary,
                'base_earned': base_earned.quantize(Decimal('0.01')),
                'lessons_completed': own_lessons_count,
                'lesson_rate': lesson_rate,
                'lessons_earned': lessons_earned.quantize(Decimal('0.01')),
                'replacement_earned': replacement_earned.quantize(Decimal('0.01')),
                'replaced_out_deduction': replaced_out_deduction.quantize(Decimal('0.01')),
                'penalty_amount': penalty_amount.quantize(Decimal('0.01')),
                'kpi_bonus': kpi_bonus.quantize(Decimal('0.01')),
                'kpi_penalty': kpi_penalty.quantize(Decimal('0.01')),
                'final_salary': final_salary.quantize(Decimal('0.01')),
                'is_deleted': False,
                'deleted_at': None
            }
        )
        return record
