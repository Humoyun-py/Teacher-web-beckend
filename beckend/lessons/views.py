"""
Views for lessons app.
Lesson scheduling, management, start/end operations.
"""

from datetime import datetime, date, timedelta, time

from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import LessonSchedule, Lesson
from .serializers import (
    LessonScheduleSerializer, LessonScheduleCreateSerializer,
    LessonSerializer, LessonCreateSerializer,
    StartLessonSerializer, EndLessonSerializer,
    ReplaceLessonSerializer,
)
from accounts.permissions import IsAdmin, IsAdminOrReadOnly, IsTeacher


class LessonScheduleViewSet(viewsets.ModelViewSet):
    """
    📅 Dars jadvali CRUD operatsiyalari.

    Haftalik takrorlanuvchi dars jadvalini boshqarish.
    Konflikt (to'qnashuv) tekshirish avtomatik.
    """

    queryset = LessonSchedule.objects.select_related(
        'teacher__user', 'subject', 'school_class',
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['teacher', 'subject', 'school_class', 'day_of_week', 'is_active']
    search_fields = ['teacher__user__first_name', 'subject__name', 'school_class__name']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return LessonScheduleCreateSerializer
        return LessonScheduleSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    @swagger_auto_schema(
        operation_description="Barcha dars jadvallarini ko'rish",
        tags=['Dars jadvali'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Yangi dars jadvali yaratish (konflikt tekshiruvi bilan)",
        tags=['Dars jadvali'],
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars jadvali'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars jadvali'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars jadvali'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars jadvali'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @swagger_auto_schema(
        method='get',
        operation_description="Haftalik jadval - ma'lum teacher yoki sinf uchun",
        manual_parameters=[
            openapi.Parameter(
                'teacher_id', openapi.IN_QUERY,
                description='Teacher ID',
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                'class_id', openapi.IN_QUERY,
                description='Sinf ID',
                type=openapi.TYPE_INTEGER,
            ),
        ],
        tags=['Dars jadvali'],
    )
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        """Haftalik jadvalni ko'rish."""
        queryset = self.get_queryset().filter(is_active=True)

        teacher_id = request.query_params.get('teacher_id')
        class_id = request.query_params.get('class_id')

        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if class_id:
            queryset = queryset.filter(school_class_id=class_id)

        # Group by day
        schedule = {}
        for day_value, day_name in LessonSchedule.DayOfWeek.choices:
            day_lessons = queryset.filter(day_of_week=day_value)
            schedule[day_name] = LessonScheduleSerializer(day_lessons, many=True).data

        return Response(schedule)

    @swagger_auto_schema(
        method='post',
        operation_description="Konflikt (to'qnashuv) tekshirish",
        request_body=LessonScheduleCreateSerializer,
        tags=['Dars jadvali'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def check_conflict(self, request):
        """Dars jadvali uchun konflikt tekshirish."""
        serializer = LessonScheduleCreateSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return Response({
                'has_conflict': False,
                'message': 'Konflikt topilmadi. Dars yaratish mumkin.',
            })
        except Exception as e:
            return Response({
                'has_conflict': True,
                'conflicts': serializer.errors,
            }, status=status.HTTP_409_CONFLICT)


class LessonViewSet(viewsets.ModelViewSet):
    """
    📚 Dars CRUD va boshqaruvi.

    Admin: Barcha darslarni ko'rish va boshqarish
    Teacher: O'z darslarini ko'rish va start/end qilish
    """

    queryset = Lesson.objects.select_related(
        'teacher__user', 'subject', 'school_class', 'schedule',
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['teacher', 'subject', 'school_class', 'date', 'status']
    search_fields = ['teacher__user__first_name', 'subject__name']
    ordering_fields = ['date', 'scheduled_start', 'status']

    def get_serializer_class(self):
        if self.action == 'create':
            return LessonCreateSerializer
        return LessonSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'generate_from_schedule', 'approve_replace', 'cancel_replace'):
            return [IsAdmin()]
        if self.action in ('start', 'end', 'today'):
            return [IsTeacher()]
        if self.action == 'replace':
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        status_param = self.request.query_params.get('status')
        if status_param and ',' in status_param:
            status_list = [s.strip() for s in status_param.split(',') if s.strip()]
            queryset = queryset.filter(status__in=status_list)
            if hasattr(self.request.GET, '_mutable'):
                m = self.request.GET._mutable
                self.request.GET._mutable = True
                self.request.GET.pop('status', None)
                self.request.GET._mutable = m

        if getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile') and user.role not in ('admin', 'it_support'):
            from django.db.models import Q
            teacher = user.teacher_profile
            queryset = queryset.filter(
                Q(teacher=teacher) | Q(replacement_teacher=teacher, replacement_status=Lesson.ReplacementStatus.APPROVED)
            )

        return queryset

    @swagger_auto_schema(
        operation_description="Barcha darslar ro'yxati",
        tags=['Dars nazorati'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Yangi dars yaratish",
        tags=['Dars nazorati'],
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars nazorati'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars nazorati'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars nazorati'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Dars nazorati'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @swagger_auto_schema(
        method='post',
        operation_description="🚪 Darsni boshlash (Start Lesson)",
        request_body=StartLessonSerializer,
        tags=['Dars jarayoni'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsTeacher])
    def start(self, request):
        """Teacher darsni boshlaydi."""
        serializer = StartLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson = Lesson.objects.get(id=serializer.validated_data['lesson_id'])

        # Check if this teacher owns the lesson OR is replacement
        is_owner = lesson.teacher.user == request.user
        is_replacement = (lesson.replacement_teacher and lesson.replacement_teacher.user == request.user)
        if not is_owner and not is_replacement:
            return Response(
                {'error': 'Bu sizning darsingiz emas.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        now = timezone.now()
        lesson.actual_start = now
        lesson.status = Lesson.Status.IN_PROGRESS

        # Check if started late
        scheduled_dt = timezone.make_aware(
            datetime.combine(lesson.date, lesson.scheduled_start)
        )
        late_threshold = timedelta(minutes=settings.LATE_THRESHOLD_MINUTES)
        if now > scheduled_dt + late_threshold:
            lesson.started_late = True

        lesson.save()

        return Response({
            'message': 'Dars boshlandi!',
            'lesson': LessonSerializer(lesson).data,
            'started_late': lesson.started_late,
        })

    @swagger_auto_schema(
        method='post',
        operation_description="🚪 Darsni tugatish (End Lesson)",
        request_body=EndLessonSerializer,
        tags=['Dars jarayoni'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsTeacher])
    def end(self, request):
        """Teacher darsni tugatadi."""
        serializer = EndLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson = Lesson.objects.get(id=serializer.validated_data['lesson_id'])

        if lesson.teacher.user != request.user and not (
            lesson.replacement_teacher and lesson.replacement_teacher.user == request.user
        ):
            return Response(
                {'error': 'Bu sizning darsingiz emas.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        lesson.actual_end = timezone.now()
        lesson.status = Lesson.Status.COMPLETED
        if serializer.validated_data.get('notes'):
            lesson.notes = serializer.validated_data['notes']
        lesson.save()

        return Response({
            'message': 'Dars tugadi!',
            'lesson': LessonSerializer(lesson).data,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="📅 Bugungi darslar",
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Bugungi darslarni ko'rish."""
        today = timezone.localdate()
        queryset = self.get_queryset().filter(date=today)
        serializer = LessonSerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        method='get',
        operation_description="O'tilmagan darslarni aniqlash",
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['get'])
    def missed(self, request):
        """O'tilmagan darslar."""
        queryset = self.get_queryset().filter(status=Lesson.Status.MISSED)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        serializer = LessonSerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        method='get',
        operation_description="Kech boshlangan darslar",
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['get'])
    def late_started(self, request):
        """Kech boshlangan darslarni aniqlash."""
        queryset = self.get_queryset().filter(started_late=True)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        serializer = LessonSerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        method='post',
        operation_description="Jadvaldan avtomatik darslar yaratish (ma'lum sana uchun)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'date': openapi.Schema(
                    type=openapi.TYPE_STRING, format='date',
                    description='Sana (YYYY-MM-DD)',
                ),
            },
        ),
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def generate_from_schedule(self, request):
        """Jadvaldan ma'lum sana uchun darslar yaratish."""
        target_date = request.data.get('date')
        if not target_date:
            return Response(
                {'error': 'Sana kiritilishi kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Sana formati noto\'g\'ri. YYYY-MM-DD ishlatilsin.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        count = Lesson.generate_for_date(target_date)

        return Response({
            'date': str(target_date),
            'created_count': count,
            'message': f"{count} ta dars jadvaldan yaratildi.",
        })

    @swagger_auto_schema(
        method='post',
        operation_description="🔄 Darsga o'rinbosar so'rash yoki biriktirish",
        request_body=ReplaceLessonSerializer,
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def replace(self, request):
        """Darsga o'rinbosar so'rash (Teacher) yoki biriktirish (Admin)."""
        serializer = ReplaceLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from teachers.models import Teacher
        lesson = Lesson.objects.get(id=serializer.validated_data['lesson_id'])
        replacement_id = serializer.validated_data.get('replacement_teacher_id')
        replacement = Teacher.objects.get(id=replacement_id) if replacement_id else None

        user = request.user
        is_admin_user = (getattr(user, 'role', None) in ('admin', 'it_support') or user.is_superuser or user.is_staff)
        
        # Admin action
        if is_admin_user:
            if not replacement:
                return Response({'error': 'O\'rinbosar teacher tanlanishi shart.'}, status=status.HTTP_400_BAD_REQUEST)
            lesson.replacement_teacher = replacement
            lesson.is_replaced = True
            lesson.replacement_status = Lesson.ReplacementStatus.APPROVED
            lesson.replacement_reason = serializer.validated_data.get('reason', '')
            lesson.save()
            return Response({
                'message': "O'rinbosar muvaffaqiyatli biriktirildi!",
                'lesson': LessonSerializer(lesson).data,
            })
        
        # Teacher action
        elif getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile'):
            if lesson.teacher.user != user:
                return Response({'error': 'Siz faqat o\'z darsingiz uchun o\'rinbosar so\'ray olasiz.'}, status=status.HTTP_403_FORBIDDEN)
            
            lesson.replacement_teacher = replacement
            lesson.is_replaced = False
            lesson.replacement_status = Lesson.ReplacementStatus.PENDING
            lesson.replacement_reason = serializer.validated_data.get('reason', '')
            lesson.save()
            return Response({
                'message': "O'rinbosar so'rovi yuborildi. Admin tasdiqlashi kutilmoqda.",
                'lesson': LessonSerializer(lesson).data,
            })
            
        return Response({'error': 'Ruxsat etilmagan.'}, status=status.HTTP_403_FORBIDDEN)

    @swagger_auto_schema(
        method='post',
        operation_description="🔄 O'rinbosar so'rovini tasdiqlash yoki rad etish (Admin)",
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin], url_path='approve-replace')
    def approve_replace(self, request):
        """O'rinbosar so'rovini tasdiqlash yoki rad etish."""
        lesson_id = request.data.get('lesson_id')
        action_type = request.data.get('action') # 'approve' or 'reject'
        
        if not lesson_id or not action_type:
            return Response({'error': 'lesson_id va action kerak.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Dars topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        if action_type == 'approve':
            if not lesson.replacement_teacher:
                return Response({'error': 'Tasdiqlash uchun o\'rinbosar teacher biriktirilgan bo\'lishi kerak.'}, status=status.HTTP_400_BAD_REQUEST)
            lesson.replacement_status = Lesson.ReplacementStatus.APPROVED
            lesson.is_replaced = True
            msg = "So'rov tasdiqlandi!"
        elif action_type == 'reject':
            lesson.replacement_status = Lesson.ReplacementStatus.REJECTED
            lesson.is_replaced = False
            msg = "So'rov rad etildi!"
        else:
            return Response({'error': 'Noto\'g\'ri action.'}, status=status.HTTP_400_BAD_REQUEST)
            
        lesson.save()
        return Response({'message': msg, 'lesson': LessonSerializer(lesson).data})

    @swagger_auto_schema(
        method='post',
        operation_description="🔄 O'rinbosarni bekor qilish (Admin)",
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin], url_path='cancel-replace')
    def cancel_replace(self, request):
        """O'rinbosarni bekor qilish."""
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response({'error': 'lesson_id kerak.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Dars topilmadi.'}, status=status.HTTP_404_NOT_FOUND)

        lesson.replacement_teacher = None
        lesson.is_replaced = False
        lesson.replacement_status = Lesson.ReplacementStatus.NONE
        lesson.replacement_reason = ''
        lesson.save()

        return Response({
            'message': "O'rinbosar bekor qilindi!",
            'lesson': LessonSerializer(lesson).data,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="🔄 O'rinbosar darslar ro'yxati",
        tags=['Dars nazorati'],
    )
    @action(detail=False, methods=['get'])
    def replacements(self, request):
        """O'rinbosar darslar va so'rovlar ro'yxati."""
        from django.db.models import Q
        
        # Return lessons where is_replaced is True OR replacement_status is not 'none'
        queryset = Lesson.objects.filter(
            Q(is_replaced=True) | ~Q(replacement_status=Lesson.ReplacementStatus.NONE)
        ).select_related(
            'teacher__user', 'replacement_teacher__user', 'subject', 'school_class',
        ).order_by('-date')

        user = request.user
        is_admin_user = (getattr(user, 'role', None) in ('admin', 'it_support') or user.is_superuser or user.is_staff)
        if not is_admin_user and getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile'):
            from django.db.models import Q
            teacher = user.teacher_profile
            queryset = queryset.filter(
                Q(teacher=teacher) | Q(replacement_teacher=teacher)
            )

        serializer = LessonSerializer(queryset, many=True)
        return Response(serializer.data)
