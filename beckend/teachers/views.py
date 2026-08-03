"""
Views for teachers app.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Teacher, Subject, SchoolClass
from .serializers import (
    TeacherSerializer, TeacherCreateSerializer,
    TeacherUpdateSerializer, TeacherListSerializer,
    SubjectSerializer, SchoolClassSerializer,
)
from accounts.permissions import IsAdmin, IsAdminOrReadOnly


class SubjectViewSet(viewsets.ModelViewSet):
    """
    Fan (Subject) CRUD operatsiyalari.

    list: Barcha fanlarni ko'rish
    create: Yangi fan qo'shish (admin)
    retrieve: Fan tafsilotlarini ko'rish
    update: Fan ma'lumotlarini tahrirlash (admin)
    destroy: Fanni o'chirish (admin)
    """

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name']
    filterset_fields = ['is_active']

    @swagger_auto_schema(tags=['Fanlar'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Fanlar'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Fanlar'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Fanlar'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Fanlar'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Fanlar'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class SchoolClassViewSet(viewsets.ModelViewSet):
    """
    Sinf (Class) CRUD operatsiyalari.

    list: Barcha sinflarni ko'rish
    create: Yangi sinf qo'shish (admin)
    retrieve: Sinf tafsilotlarini ko'rish
    update: Sinf ma'lumotlarini tahrirlash (admin)
    destroy: Sinfni o'chirish (admin)
    """

    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name']
    filterset_fields = ['grade', 'is_active']

    @swagger_auto_schema(tags=['Sinflar'])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Sinflar'])
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Sinflar'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Sinflar'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Sinflar'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Sinflar'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    Teacher boshqaruvi - CRUD operatsiyalari.

    👑 Admin:
    - Teacher qo'shish, o'chirish, tahrirlash
    - Fan va sinf biriktirish
    - Status ko'rish va o'zgartirish

    👨🏫 Teacher:
    - O'z profilini ko'rish
    """

    queryset = Teacher.objects.select_related('user').prefetch_related('subjects', 'classes')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'employee_id']
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'user__first_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return TeacherCreateSerializer
        if self.action in ('update', 'partial_update'):
            return TeacherUpdateSerializer
        if self.action == 'list':
            return TeacherListSerializer
        return TeacherSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'update', 'partial_update', 'assign_subjects', 'assign_classes', 'salary_report'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    @swagger_auto_schema(
        operation_description="Barcha teacherlar ro'yxati",
        tags=['Teacher boshqaruvi'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Yangi teacher qo'shish (foydalanuvchi yaratish bilan)",
        tags=['Teacher boshqaruvi'],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        return Response(
            TeacherSerializer(teacher).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        operation_description="Teacher tafsilotlarini ko'rish",
        tags=['Teacher boshqaruvi'],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Teacher ma'lumotlarini tahrirlash",
        tags=['Teacher boshqaruvi'],
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Teacher ma'lumotlarini qisman tahrirlash",
        tags=['Teacher boshqaruvi'],
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Teacherni o'chirish",
        tags=['Teacher boshqaruvi'],
    )
    def destroy(self, request, *args, **kwargs):
        teacher = self.get_object()
        user = teacher.user
        teacher.delete()   # Teacher profilini o'chirish
        user.delete()      # User accountni ham o'chirish
        return Response(
            {'message': 'Teacher muvaffaqiyatli o\'chirildi.'},
            status=status.HTTP_200_OK,
        )

    @swagger_auto_schema(
        method='post',
        operation_description="Teacherga fan biriktirish",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'subject_ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_INTEGER),
                    description='Fan IDlari ro\'yxati',
                ),
            },
        ),
        tags=['Teacher boshqaruvi'],
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_subjects(self, request, pk=None):
        """Teacherga fan biriktirish."""
        teacher = self.get_object()
        subject_ids = request.data.get('subject_ids', [])
        teacher.subjects.set(subject_ids)
        return Response(TeacherSerializer(teacher).data)

    @swagger_auto_schema(
        method='post',
        operation_description="Teacherga sinf biriktirish",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'class_ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_INTEGER),
                    description='Sinf IDlari ro\'yxati',
                ),
            },
        ),
        tags=['Teacher boshqaruvi'],
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_classes(self, request, pk=None):
        """Teacherga sinf biriktirish."""
        teacher = self.get_object()
        class_ids = request.data.get('class_ids', [])
        teacher.classes.set(class_ids)
        return Response(TeacherSerializer(teacher).data)

    @swagger_auto_schema(
        method='get',
        operation_description="Teacher statusini ko'rish",
        tags=['Teacher boshqaruvi'],
    )
    @action(detail=True, methods=['get'])
    def status_info(self, request, pk=None):
        """Teacher statusini ko'rish."""
        teacher = self.get_object()
        return Response({
            'teacher_id': teacher.id,
            'full_name': teacher.user.get_full_name(),
            'status': teacher.status,
            'is_active': teacher.user.is_active,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="Teacher oylik maosh hisoboti",
        manual_parameters=[
            openapi.Parameter('month', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, description='Oy (1-12)'),
            openapi.Parameter('year', openapi.IN_QUERY, type=openapi.TYPE_INTEGER, description='Yil'),
        ],
        tags=['Teacher boshqaruvi'],
    )
    @action(detail=True, methods=['get'])
    def salary_report(self, request, pk=None):
        """Teacher uchun oylik maosh hisoboti."""
        from attendance.models import Attendance
        from lessons.models import Lesson
        from django.utils import timezone
        from django.db.models import Sum, Q
        from decimal import Decimal

        teacher = self.get_object()
        now = timezone.localtime()

        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        # ── Davomat ──
        attendances = Attendance.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year,
        )

        from django.db.models import Q
        days_present = attendances.filter(
            status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE]
        ).filter(
            Q(check_in_time__isnull=True) | Q(check_out_time__isnull=False)
        ).count()

        days_absent = attendances.filter(
            status=Attendance.Status.ABSENT
        ).count()

        days_late = attendances.filter(
            status=Attendance.Status.LATE
        ).count()

        total_late_minutes = attendances.aggregate(
            total=Sum('late_minutes')
        )['total'] or 0

        total_penalty = attendances.aggregate(
            total=Sum('penalty_amount')
        )['total'] or Decimal('0')

        # ── Darslar hisobi (Replace bilan) ──
        # O'z darslari - replace bo'lmaganlar (bu teacher uchun hisob)
        own_lessons = Lesson.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year,
            is_replaced=False,
            status__in=[Lesson.Status.COMPLETED, Lesson.Status.IN_PROGRESS],
        ).count()

        # O'z darslari - replace bo'lganlar (bular hisobdan chiqadi)
        replaced_out_lessons = Lesson.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year,
            is_replaced=True,
        )
        replaced_out_count = replaced_out_lessons.count()
        replaced_out_details = []
        for les in replaced_out_lessons.select_related('replacement_teacher__user', 'subject'):
            replaced_out_details.append({
                'date': str(les.date),
                'subject': les.subject.name if les.subject else '',
                'replacement_teacher': les.replacement_teacher.user.get_full_name() if les.replacement_teacher else '',
                'reason': les.replacement_reason,
            })

        # Boshqalar o'rniga o'tilgan darslar (bu teacherga qo'shiladi)
        replaced_in_lessons = Lesson.objects.filter(
            replacement_teacher=teacher,
            date__month=month,
            date__year=year,
            is_replaced=True,
            status__in=[Lesson.Status.COMPLETED, Lesson.Status.IN_PROGRESS, Lesson.Status.SCHEDULED],
        )
        replaced_in_count = replaced_in_lessons.count()
        replaced_in_details = []
        for les in replaced_in_lessons.select_related('teacher__user', 'subject'):
            replaced_in_details.append({
                'date': str(les.date),
                'subject': les.subject.name if les.subject else '',
                'original_teacher': les.teacher.user.get_full_name(),
                'reason': les.replacement_reason,
            })

        # ── Hisoblash ──
        # Dars asosida hisoblash
        lesson_rate = teacher.lesson_rate
        
        # O'z darslari uchun (replace bo'lmagan, completed)
        own_lessons_completed = Lesson.objects.filter(
            teacher=teacher,
            date__month=month,
            date__year=year,
            is_replaced=False,
            status=Lesson.Status.COMPLETED,
        ).count()
        lessons_earned = Decimal(own_lessons_completed) * lesson_rate
        
        # Boshqalar o'rniga o'tilgan darslar uchun
        replacement_earned = Decimal(replaced_in_count) * lesson_rate
        
        # O'z darsini o'tkazib yuborgani uchun (replace bo'lgan)
        replaced_out_deduction = Decimal(replaced_out_count) * lesson_rate
        
        # Davomat asosida kunlik
        total_earned = Decimal(days_present) * teacher.daily_rate
        
        # YAKUNIY: Darslar + Replacement + Davomat - Jarima
        final_salary = lessons_earned + replacement_earned - replaced_out_deduction + total_earned - total_penalty

        # Kunlik davomatlar tafsiloti
        daily_details = []
        for att in attendances.order_by('date'):
            daily_details.append({
                'date': str(att.date),
                'status': att.get_status_display(),
                'check_in_time': str(att.check_in_time) if att.check_in_time else None,
                'is_late': att.is_late,
                'late_minutes': att.late_minutes,
                'penalty_amount': str(att.penalty_amount),
                'earned': str(teacher.daily_rate) if att.status in [Attendance.Status.PRESENT, Attendance.Status.LATE] else '0',
            })

        return Response({
            'teacher_id': teacher.id,
            'full_name': teacher.user.get_full_name(),
            'employee_id': teacher.employee_id,
            'month': month,
            'year': year,
            'monthly_salary': str(teacher.monthly_salary),
            'lesson_rate': str(lesson_rate),
            'daily_rate': str(teacher.daily_rate),
            'hourly_rate': str(teacher.hourly_rate),
            'minute_rate': str(teacher.minute_rate),
            'days_present': days_present,
            'days_absent': days_absent,
            'days_late': days_late,
            'total_late_minutes': total_late_minutes,
            'own_lessons': own_lessons,
            'own_lessons_completed': own_lessons_completed,
            'lessons_earned': str(lessons_earned),
            'replaced_out_count': replaced_out_count,
            'replaced_out_details': replaced_out_details,
            'replaced_in_count': replaced_in_count,
            'replaced_in_details': replaced_in_details,
            'total_earned': str(total_earned),
            'replacement_earned': str(replacement_earned),
            'replaced_out_deduction': str(replaced_out_deduction),
            'total_penalty': str(total_penalty),
            'final_salary': str(final_salary),
            'daily_details': daily_details,
        })
