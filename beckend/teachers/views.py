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
        if self.action in ('create', 'destroy'):
            return [IsAdmin()]
        if self.action in ('update', 'partial_update'):
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
