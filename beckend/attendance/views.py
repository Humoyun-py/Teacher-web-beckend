"""
Views for attendance app.
QR Check-in system and attendance management.
"""

import io
import qrcode
from datetime import date, time, datetime, timedelta

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import QRCode, Attendance
from .serializers import (
    QRCodeSerializer, QRCodeCreateSerializer,
    AttendanceSerializer, QRCheckInSerializer,
    AttendanceUpdateSerializer,
)
from accounts.permissions import IsAdmin, IsTeacher, IsAdminOrReadOnly
from teachers.models import Teacher

# Default expected arrival time (can be made configurable)
EXPECTED_ARRIVAL_TIME = time(8, 0)  # 8:00 AM


class QRCodeViewSet(viewsets.ModelViewSet):
    """
    📍 QR Code boshqaruvi (Admin).

    QR kod yaratish, ko'rish, va boshqarish.
    """

    queryset = QRCode.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']

    def get_serializer_class(self):
        if self.action == 'create':
            return QRCodeCreateSerializer
        return QRCodeSerializer

    @swagger_auto_schema(
        operation_description="Barcha QR kodlarni ko'rish",
        tags=['QR Check-in (Admin)'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Yangi QR kod yaratish",
        tags=['QR Check-in (Admin)'],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qr = serializer.save(created_by=request.user)
        return Response(
            QRCodeSerializer(qr).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(tags=['QR Check-in (Admin)'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['QR Check-in (Admin)'])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @swagger_auto_schema(
        method='get',
        operation_description="QR kodning rasm (PNG) versiyasini olish",
        tags=['QR Check-in (Admin)'],
    )
    @action(detail=True, methods=['get'])
    def image(self, request, pk=None):
        """QR kod rasmini generatsiya qilish."""
        qr_obj = self.get_object()

        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(str(qr_obj.code))
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        return HttpResponse(buffer, content_type='image/png')

    @swagger_auto_schema(
        method='post',
        operation_description="Yangi doimiy QR kod yaratish (Eskilarini o'chirib yuboradi)",
        tags=['QR Check-in (Admin)'],
    )
    @action(detail=False, methods=['post'])
    def generate_static(self, request):
        """Bitta asosiy QR kod yaratish (hammasini o'chiradi va 1 ta yangi ochadi)."""
        # Hamma eskilarni nofaol qilish
        QRCode.objects.update(is_active=False)
        
        qr = QRCode.objects.create(
            created_by=request.user,
        )

        return Response(
            QRCodeSerializer(qr).data,
            status=status.HTTP_201_CREATED,
        )


class QRCheckInView(APIView):
    """
    📍 QR Check-in (Teacher).

    Teacher QR kodni skanlab maktabga kelganini tasdiqlaydi.
    """

    permission_classes = [IsTeacher]

    @swagger_auto_schema(
        operation_description="📍 QR kod orqali check-in qilish (Teacher)",
        request_body=QRCheckInSerializer,
        responses={
            200: openapi.Response(
                description='Check-in muvaffaqiyatli',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'attendance': openapi.Schema(type=openapi.TYPE_OBJECT),
                    }
                )
            ),
        },
        tags=['QR Check-in (Teacher)'],
    )
    def post(self, request):
        serializer = QRCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response(
                {'error': 'Teacher profili topilmadi.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qr = QRCode.objects.get(code=serializer.validated_data['qr_code'])
        now = timezone.localtime()
        today = now.date()

        # Check if already checked in today
        existing = Attendance.objects.filter(
            teacher=teacher, date=today,
        ).first()
        if existing and existing.check_in_time:
            return Response(
                {'error': 'Bugun allaqachon check-in qilingan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate if late
        # EXPECTED_ARRIVAL_TIME is local time (8:00 AM)
        expected_time = now.replace(
            hour=EXPECTED_ARRIVAL_TIME.hour,
            minute=EXPECTED_ARRIVAL_TIME.minute,
            second=0,
            microsecond=0
        )
        
        is_late = now > expected_time + timedelta(
            minutes=settings.LATE_THRESHOLD_MINUTES
        )
        late_minutes = 0
        penalty_amount = 0
        if is_late:
            late_minutes = int((now - expected_time).total_seconds() / 60)
            # Kechikkan daqiqalar uchun jarima hisoblash
            from decimal import Decimal
            penalty_amount = Decimal(late_minutes) * teacher.minute_rate

        attendance_status = Attendance.Status.LATE if is_late else Attendance.Status.PRESENT

        attendance, created = Attendance.objects.update_or_create(
            teacher=teacher,
            date=today,
            defaults={
                'check_in_time': now,
                'status': attendance_status,
                'qr_code': qr,
                'is_late': is_late,
                'late_minutes': late_minutes,
                'penalty_amount': penalty_amount,
            },
        )

        return Response({
            'message': 'Check-in muvaffaqiyatli!',
            'is_late': is_late,
            'late_minutes': late_minutes,
            'penalty_amount': str(penalty_amount),
            'attendance': AttendanceSerializer(attendance).data,
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    📍 Davomat boshqaruvi.

    Admin: Barcha davomatlarni ko'rish va boshqarish
    Teacher: O'z davomatini ko'rish
    """

    queryset = Attendance.objects.select_related('teacher__user', 'qr_code')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['teacher', 'date', 'status', 'is_late']
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name']
    ordering_fields = ['date', 'check_in_time']

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return AttendanceUpdateSerializer
        return AttendanceSerializer

    def get_permissions(self):
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsAdminOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if getattr(user, 'role', None) == 'teacher' and hasattr(user, 'teacher_profile'):
            queryset = queryset.filter(teacher=user.teacher_profile)

        return queryset

    @swagger_auto_schema(
        operation_description="Barcha davomatlarni ko'rish",
        tags=['Davomat'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Davomat'])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Davomat'])
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Davomat'])
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        method='get',
        operation_description="Bugungi davomat holati",
        tags=['Davomat'],
    )
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Bugungi kelgan/kelmagan teacherlar."""
        today = timezone.localdate()
        all_teachers = Teacher.objects.filter(status='active')
        attended = Attendance.objects.filter(
            date=today,
            status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE],
        )
        attended_ids = attended.values_list('teacher_id', flat=True)

        present = []
        absent = []
        late = []

        for teacher in all_teachers:
            teacher_data = {
                'id': teacher.id,
                'full_name': teacher.user.get_full_name(),
                'employee_id': teacher.employee_id,
            }
            if teacher.id in attended_ids:
                att = attended.get(teacher_id=teacher.id)
                teacher_data['check_in_time'] = att.check_in_time
                if att.is_late:
                    teacher_data['late_minutes'] = att.late_minutes
                    late.append(teacher_data)
                else:
                    present.append(teacher_data)
            else:
                absent.append(teacher_data)

        return Response({
            'date': str(today),
            'total_teachers': all_teachers.count(),
            'present_count': len(present),
            'absent_count': len(absent),
            'late_count': len(late),
            'present': present,
            'absent': absent,
            'late': late,
        })

    @swagger_auto_schema(
        method='post',
        operation_description="Kelmaganlarni belgilash (admin)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'date': openapi.Schema(
                    type=openapi.TYPE_STRING, format='date',
                ),
            },
        ),
        tags=['Davomat'],
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def mark_absent(self, request):
        """Kelmaganlarni avtomatik belgilash."""
        target_date = request.data.get('date', str(timezone.localdate()))

        try:
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Sana formati noto\'g\'ri.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        all_teachers = Teacher.objects.filter(status='active')
        attended_ids = Attendance.objects.filter(
            date=target_date,
        ).values_list('teacher_id', flat=True)

        marked = []
        for teacher in all_teachers:
            if teacher.id not in attended_ids:
                att = Attendance.objects.create(
                    teacher=teacher,
                    date=target_date,
                    status=Attendance.Status.ABSENT,
                )
                marked.append({
                    'teacher': teacher.user.get_full_name(),
                    'employee_id': teacher.employee_id,
                })

        return Response({
            'date': str(target_date),
            'marked_absent_count': len(marked),
            'marked': marked,
        })
