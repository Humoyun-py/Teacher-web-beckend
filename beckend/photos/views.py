"""
Views for photos app.
Photo proof upload, review, and management.
"""

from datetime import date
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import PhotoProof
from .serializers import (
    PhotoProofSerializer, PhotoUploadSerializer,
    PhotoReviewSerializer,
)
from accounts.permissions import IsAdmin, IsTeacher, IsAdminOrReadOnly
from lessons.models import Lesson
from teachers.models import Teacher

class PhotoProofViewSet(viewsets.ModelViewSet):
    """
    🖼️ Photo proof boshqaruvi.

    Admin: Barcha rasmlarni ko'rish, qabul/rad qilish
    Teacher: O'z rasmlarini ko'rish va yuklash
    """

    queryset = PhotoProof.objects.select_related(
        'teacher__user', 'lesson__subject', 'lesson__school_class',
        'reviewed_by',
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['teacher', 'lesson', 'status']
    search_fields = ['teacher__user__first_name', 'lesson__subject__name']
    ordering_fields = ['uploaded_at', 'status']

    def get_serializer_class(self):
        if self.action == 'create':
            return PhotoUploadSerializer
        return PhotoProofSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsTeacher()]
        if self.action in ('destroy', 'review', 'pending', 'missing', 'stats'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile') and user.role != 'admin':
            queryset = queryset.filter(teacher=user.teacher_profile)

        return queryset

    @swagger_auto_schema(
        operation_description="Barcha rasm isbotlarni ko'rish",
        tags=['Rasm tekshirish'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="🖼️ Rasm yuklash (Teacher)",
        tags=['Rasm yuborish (Teacher)'],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profili topilmadi.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        photo_file = serializer.validated_data['photo']
        file_size_mb = round(photo_file.size / (1024 * 1024), 2)

        photo = serializer.save(
            teacher=teacher,
            file_size_mb=file_size_mb,
        )

        return Response(
            PhotoProofSerializer(photo).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        method='post',
        operation_description="🖼️ Rasm qabul/rad qilish (Admin)",
        request_body=PhotoReviewSerializer,
        tags=['Rasm tekshirish'],
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def review(self, request, pk=None):
        photo = self.get_object()
        serializer = PhotoReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        photo.status = serializer.validated_data['status']
        photo.reviewed_by = request.user
        photo.reviewed_at = timezone.now()
        photo.review_notes = serializer.validated_data.get('review_notes', '')
        photo.save()

        action_text = 'qabul qilindi' if photo.status == 'accepted' else 'rad qilindi'

        return Response({
            'message': f'Rasm {action_text}.',
            'photo': PhotoProofSerializer(photo).data,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="Kutilayotgan (pending) rasmlarni ko'rish",
        tags=['Rasm tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def pending(self, request):
        queryset = PhotoProof.objects.filter(status=PhotoProof.Status.PENDING)
        serializer = PhotoProofSerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        method='get',
        operation_description="Rasm yo'q darslarni aniqlash",
        tags=['Rasm tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def missing(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to', str(timezone.localdate()))

        lessons_with_photo = PhotoProof.objects.values_list('lesson_id', flat=True)

        missing_lessons = Lesson.objects.filter(
            status__in=['completed', 'in_progress'],
        ).exclude(id__in=lessons_with_photo)

        if date_from:
            missing_lessons = missing_lessons.filter(date__gte=date_from)
        if date_to:
            missing_lessons = missing_lessons.filter(date__lte=date_to)

        from lessons.serializers import LessonSerializer
        serializer = LessonSerializer(missing_lessons, many=True)

        return Response({
            'count': missing_lessons.count(),
            'lessons_without_photo': serializer.data,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="O'qituvchilar bo'yicha rasm yetishmovchilik hisoboti",
        tags=['Rasm tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin], url_path='missing-by-teacher')
    def missing_by_teacher(self, request):
        """Per-teacher breakdown: how many completed lessons have no accepted proof."""
        from teachers.models import Teacher as T
        from django.db.models import Q

        now = timezone.localtime()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        teachers = T.objects.filter(status='active').select_related('user')
        report = []

        for teacher in teachers:
            completed = Lesson.objects.filter(
                teacher=teacher,
                date__month=month,
                date__year=year,
                status='completed',
            )
            total_completed = completed.count()

            lessons_with_accepted_proof = PhotoProof.objects.filter(
                teacher=teacher,
                lesson__in=completed,
                status='accepted',
            ).values_list('lesson_id', flat=True)

            missing_count = completed.exclude(id__in=lessons_with_accepted_proof).count()

            report.append({
                'teacher_id': teacher.id,
                'employee_id': teacher.employee_id,
                'full_name': teacher.user.get_full_name(),
                'completed_lessons': total_completed,
                'lessons_with_proof': total_completed - missing_count,
                'missing_proofs': missing_count,
                'proof_rate': round(
                    ((total_completed - missing_count) / total_completed * 100)
                    if total_completed > 0 else 0,
                    1,
                ),
            })

        report.sort(key=lambda x: x['missing_proofs'], reverse=True)
        total_missing = sum(r['missing_proofs'] for r in report)

        return Response({
            'month': month,
            'year': year,
            'total_missing_proofs': total_missing,
            'report': report,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="Rasm statistikasi",
        tags=['Rasm tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        total = PhotoProof.objects.count()
        pending = PhotoProof.objects.filter(status='pending').count()
        accepted = PhotoProof.objects.filter(status='accepted').count()
        rejected = PhotoProof.objects.filter(status='rejected').count()
        today = timezone.localdate()
        today_total = PhotoProof.objects.filter(uploaded_at__date=today).count()

        return Response({
            'total': total,
            'pending': pending,
            'accepted': accepted,
            'rejected': rejected,
            'today_uploaded': today_total,
        })
