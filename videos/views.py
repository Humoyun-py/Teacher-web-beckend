"""
Views for videos app.
Video proof upload, review, and management.
"""

from datetime import date

from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import VideoProof
from .serializers import (
    VideoProofSerializer, VideoUploadSerializer,
    VideoReviewSerializer,
)
from accounts.permissions import IsAdmin, IsTeacher, IsAdminOrReadOnly
from lessons.models import Lesson


class VideoProofViewSet(viewsets.ModelViewSet):
    """
    🎥 Video proof boshqaruvi.

    Admin: Barcha videolarni ko'rish, qabul/rad qilish
    Teacher: O'z videolarini ko'rish va yuklash
    """

    queryset = VideoProof.objects.select_related(
        'teacher__user', 'lesson__subject', 'lesson__school_class',
        'reviewed_by',
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['teacher', 'lesson', 'status']
    search_fields = ['teacher__user__first_name', 'lesson__subject__name']
    ordering_fields = ['uploaded_at', 'status']

    def get_serializer_class(self):
        if self.action == 'create':
            return VideoUploadSerializer
        return VideoProofSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsTeacher()]
        if self.action in ('destroy',):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile'):
            queryset = queryset.filter(teacher=user.teacher_profile)

        return queryset

    @swagger_auto_schema(
        operation_description="Barcha video isbotlarni ko'rish",
        tags=['Video tekshirish'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="🎥 Video yuklash (Teacher)",
        tags=['Video yuborish (Teacher)'],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            teacher = request.user.teacher_profile
        except Exception:
            return Response(
                {'error': 'Teacher profili topilmadi.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate file size
        video_file = serializer.validated_data['video']
        file_size_mb = round(video_file.size / (1024 * 1024), 2)

        video = serializer.save(
            teacher=teacher,
            file_size_mb=file_size_mb,
        )

        return Response(
            VideoProofSerializer(video).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(tags=['Video tekshirish'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Video tekshirish'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @swagger_auto_schema(
        method='post',
        operation_description="🎥 Video qabul/rad qilish (Admin)",
        request_body=VideoReviewSerializer,
        tags=['Video tekshirish'],
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def review(self, request, pk=None):
        """Video qabul yoki rad qilish."""
        video = self.get_object()
        serializer = VideoReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        video.status = serializer.validated_data['status']
        video.reviewed_by = request.user
        video.reviewed_at = timezone.now()
        video.review_notes = serializer.validated_data.get('review_notes', '')
        video.save()

        action_text = 'qabul qilindi' if video.status == 'accepted' else 'rad qilindi'

        return Response({
            'message': f'Video {action_text}.',
            'video': VideoProofSerializer(video).data,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="Kutilayotgan (pending) videolarni ko'rish",
        tags=['Video tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def pending(self, request):
        """Tekshirilmagan videolar."""
        queryset = VideoProof.objects.filter(
            status=VideoProof.Status.PENDING,
        )
        serializer = VideoProofSerializer(queryset, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        method='get',
        operation_description="Video yo'q darslarni aniqlash",
        tags=['Video tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def missing(self, request):
        """Video yuborilmagan darslarni aniqlash."""
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to', str(date.today()))

        lessons_with_video = VideoProof.objects.values_list('lesson_id', flat=True)

        missing_lessons = Lesson.objects.filter(
            status__in=['completed', 'in_progress'],
        ).exclude(id__in=lessons_with_video)

        if date_from:
            missing_lessons = missing_lessons.filter(date__gte=date_from)
        if date_to:
            missing_lessons = missing_lessons.filter(date__lte=date_to)

        from lessons.serializers import LessonSerializer
        serializer = LessonSerializer(missing_lessons, many=True)

        return Response({
            'count': missing_lessons.count(),
            'lessons_without_video': serializer.data,
        })

    @swagger_auto_schema(
        method='get',
        operation_description="Video statistikasi",
        tags=['Video tekshirish'],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def stats(self, request):
        """Video yuborish statistikasi."""
        total = VideoProof.objects.count()
        pending = VideoProof.objects.filter(status='pending').count()
        accepted = VideoProof.objects.filter(status='accepted').count()
        rejected = VideoProof.objects.filter(status='rejected').count()

        # Today's stats
        today = date.today()
        today_total = VideoProof.objects.filter(
            uploaded_at__date=today,
        ).count()

        return Response({
            'total': total,
            'pending': pending,
            'accepted': accepted,
            'rejected': rejected,
            'today_uploaded': today_total,
        })
