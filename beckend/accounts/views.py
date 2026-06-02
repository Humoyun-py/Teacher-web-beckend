"""
Views for accounts app - Authentication & User management.
Includes IT Support super admin endpoints.
"""

import jwt
from django.conf import settings
from django.utils.dateparse import parse_date, parse_time
from django.utils import timezone
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import User, AuditLog
from .serializers import (
    UserSerializer, UserCreateSerializer,
    LoginSerializer, ChangePasswordSerializer,
    RefreshTokenSerializer, AdminUserSerializer,
    AdminCreateSerializer, AuditLogSerializer,
)
from .authentication import generate_access_token, generate_refresh_token
from .permissions import IsAdmin, IsITSupport


class AuthRootView(APIView):
    """Auth API endpoints ro'yxati."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'message': 'Auth API root',
            'endpoints': {
                'login': '/api/v1/auth/login/',
                'register': '/api/v1/auth/register/ (Admin only)',
                'refresh': '/api/v1/auth/refresh/',
                'profile': '/api/v1/auth/profile/',
                'change-password': '/api/v1/auth/change-password/',
            }
        })


class RegisterView(APIView):
    """Yangi foydalanuvchi ro'yxatdan o'tkazish (faqat admin)."""

    permission_classes = [IsAdmin]

    @swagger_auto_schema(
        operation_description="Yangi foydalanuvchi yaratish (Admin only)",
        request_body=UserCreateSerializer,
        responses={201: UserSerializer},
        tags=['Auth'],
    )
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        AuditLog.log(
            user=request.user,
            action='create',
            description=f"Yangi foydalanuvchi yaratildi: {user.username}",
            target_model='User',
            target_id=user.id,
            target_name=user.get_full_name(),
        )

        return Response(
            {
                'message': 'Foydalanuvchi muvaffaqiyatli yaratildi.',
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Foydalanuvchi tizimga kirishi."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Tizimga kirish - JWT token olish",
        request_body=LoginSerializer,
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access_token': openapi.Schema(type=openapi.TYPE_STRING),
                        'refresh_token': openapi.Schema(type=openapi.TYPE_STRING),
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                    }
                )
            )
        },
        tags=['Auth'],
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        access_token = generate_access_token(user)
        refresh_token = generate_refresh_token(user)

        AuditLog.log(
            user=user, action='login',
            description=f"{user.get_full_name()} tizimga kirdi",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
        })


class RefreshTokenView(APIView):
    """Access tokenni yangilash."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Access tokenni refresh token orqali yangilash",
        request_body=RefreshTokenSerializer,
        responses={200: 'New access token'},
        tags=['Auth'],
    )
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = jwt.decode(
                serializer.validated_data['refresh_token'],
                settings.JWT_SECRET_KEY,
                algorithms=['HS256'],
            )
            if payload.get('type') != 'refresh':
                return Response(
                    {'error': 'Token turi noto\'g\'ri.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = User.objects.get(id=payload['user_id'])
            access_token = generate_access_token(user)

            return Response({'access_token': access_token})

        except jwt.ExpiredSignatureError:
            return Response(
                {'error': 'Refresh token muddati tugagan.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return Response(
                {'error': 'Token noto\'g\'ri.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ProfileView(APIView):
    """Joriy foydalanuvchi profili."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Joriy foydalanuvchi ma'lumotlarini olish",
        responses={200: UserSerializer},
        tags=['Auth'],
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    @swagger_auto_schema(
        operation_description="Profil ma'lumotlarini yangilash",
        request_body=UserSerializer,
        responses={200: UserSerializer},
        tags=['Auth'],
    )
    def patch(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """Parolni o'zgartirish."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Parolni o'zgartirish",
        request_body=ChangePasswordSerializer,
        responses={200: 'Password changed'},
        tags=['Auth'],
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(
            serializer.validated_data['new_password']
        )
        request.user.save()

        return Response({
            'message': 'Parol muvaffaqiyatli o\'zgartirildi.',
        })


# ══════════════════════════════════════════════════════════════════════════════
# IT SUPPORT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

class AdminManagementView(APIView):
    """IT Support: Admin CRUD boshqaruvi."""
    permission_classes = [IsITSupport]

    def get(self, request):
        admins = User.objects.filter(role__in=['admin', 'it_support']).order_by('-created_at')
        return Response(AdminUserSerializer(admins, many=True).data)

    def post(self, request):
        serializer = AdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin_user = serializer.save()

        AuditLog.log(
            user=request.user, action='admin_action',
            description=f"Yangi admin yaratildi: {admin_user.username}",
            target_model='User', target_id=admin_user.id,
            target_name=admin_user.get_full_name(),
        )

        return Response(AdminUserSerializer(admin_user).data, status=status.HTTP_201_CREATED)


class AdminDetailView(APIView):
    """IT Support: Admin detail - update, delete, block."""
    permission_classes = [IsITSupport]

    def get(self, request, pk):
        try:
            admin_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Admin topilmadi.'}, status=404)
        return Response(AdminUserSerializer(admin_user).data)

    def patch(self, request, pk):
        try:
            admin_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Admin topilmadi.'}, status=404)

        old_data = AdminUserSerializer(admin_user).data
        serializer = AdminUserSerializer(admin_user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.log(
            user=request.user, action='update',
            description=f"Admin tahrirlandi: {admin_user.username}",
            target_model='User', target_id=admin_user.id,
            target_name=admin_user.get_full_name(),
            old_data=old_data, new_data=serializer.data,
        )

        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            admin_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Admin topilmadi.'}, status=404)

        if admin_user == request.user:
            return Response({'error': "O'zingizni o'chira olmaysiz."}, status=400)

        AuditLog.log(
            user=request.user, action='delete',
            description=f"Admin o'chirildi: {admin_user.username}",
            target_model='User', target_id=admin_user.id,
            target_name=admin_user.get_full_name(),
        )

        admin_user.delete()
        return Response({'message': "Admin o'chirildi."}, status=204)


class AdminResetPasswordView(APIView):
    """IT Support: Admin yoki Teacher parolini o'zgartirish."""
    permission_classes = [IsITSupport]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi.'}, status=404)

        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Parol kamida 6 belgidan iborat bo\'lishi kerak.'}, status=400)

        target_user.set_password(new_password)
        target_user.save()

        AuditLog.log(
            user=request.user, action='password_change',
            description=f"Parol o'zgartirildi: {target_user.username}",
            target_model='User', target_id=target_user.id,
            target_name=target_user.get_full_name(),
        )

        return Response({'message': f"{target_user.username} paroli o'zgartirildi."})


class AuditLogView(APIView):
    """IT Support: Audit log ko'rish."""
    permission_classes = [IsITSupport]

    def get(self, request):
        queryset = AuditLog.objects.select_related('user').all()

        # Filtrlash
        action = request.query_params.get('action')
        user_id = request.query_params.get('user_id')
        target_model = request.query_params.get('target_model')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        search = request.query_params.get('search')

        if action:
            queryset = queryset.filter(action=action)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if target_model:
            queryset = queryset.filter(target_model__icontains=target_model)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        if search:
            queryset = queryset.filter(description__icontains=search)

        # Pagination - oxirgi 200 ta
        queryset = queryset[:200]

        return Response(AuditLogSerializer(queryset, many=True).data)


class ITSupportDashboardView(APIView):
    """IT Support: Super Dashboard."""
    permission_classes = [IsITSupport]

    def get(self, request):
        from teachers.models import Teacher
        from lessons.models import Lesson
        from attendance.models import Attendance
        from photos.models import PhotoProof

        today = timezone.localtime().date()

        total_teachers = Teacher.objects.count()
        active_teachers = Teacher.objects.filter(status='active').count()
        inactive_teachers = Teacher.objects.filter(status='inactive').count()

        today_att = Attendance.objects.filter(date=today)
        present_count = today_att.filter(status='present').count()
        late_count = today_att.filter(status='late').count()
        absent_count = today_att.filter(status='absent').count()

        today_lessons = Lesson.objects.filter(date=today)
        total_lessons_today = today_lessons.count()
        completed_lessons = today_lessons.filter(status='completed').count()
        missed_lessons = today_lessons.filter(status='missed').count()
        in_progress = today_lessons.filter(status='in_progress').count()

        photos_today = PhotoProof.objects.filter(lesson__date=today)
        with_photo = photos_today.values('lesson_id').distinct().count()
        without_photo = completed_lessons - with_photo if completed_lessons > with_photo else 0

        total_admins = User.objects.filter(role='admin').count()
        total_it_support = User.objects.filter(role='it_support').count()

        recent_logs = AuditLog.objects.select_related('user')[:10]

        return Response({
            'teachers': {
                'total': total_teachers,
                'active': active_teachers,
                'inactive': inactive_teachers,
                'present_today': present_count,
                'late_today': late_count,
                'absent_today': absent_count,
                'not_checked_in': active_teachers - (present_count + late_count + absent_count),
            },
            'lessons': {
                'total_today': total_lessons_today,
                'completed': completed_lessons,
                'missed': missed_lessons,
                'in_progress': in_progress,
                'with_photo': with_photo,
                'without_photo': without_photo,
            },
            'system': {
                'total_admins': total_admins,
                'total_it_support': total_it_support,
                'total_users': User.objects.count(),
            },
            'recent_logs': AuditLogSerializer(recent_logs, many=True).data,
        })


class UserBlockToggleView(APIView):
    """IT Support: Foydalanuvchini bloklash/blokdan chiqarish."""
    permission_classes = [IsITSupport]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi.'}, status=404)

        if target_user == request.user:
            return Response({'error': "O'zingizni bloklashingiz mumkin emas."}, status=400)

        target_user.is_active = not target_user.is_active
        target_user.save()

        action = 'unblock' if target_user.is_active else 'block'
        msg = 'Blokdan chiqarildi' if target_user.is_active else 'Bloklandi'

        AuditLog.log(
            user=request.user, action=action,
            description=f"{target_user.username} {msg.lower()}",
            target_model='User', target_id=target_user.id,
            target_name=target_user.get_full_name(),
        )

        return Response({
            'message': f"{target_user.get_full_name()} {msg}.",
            'is_active': target_user.is_active,
        })


class LessonFixView(APIView):
    """IT Support: Darslarni tiklash va tuzatish."""
    permission_classes = [IsITSupport]

    def post(self, request):
        from lessons.models import Lesson

        lesson_id = request.data.get('lesson_id')
        action_type = request.data.get('action')

        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Dars topilmadi.'}, status=404)

        old_status = lesson.status

        if action_type == 'mark_completed':
            lesson.status = 'completed'
            if not lesson.actual_start:
                lesson.actual_start = timezone.now()
            if not lesson.actual_end:
                lesson.actual_end = timezone.now()
        elif action_type == 'mark_started':
            lesson.status = 'in_progress'
            if not lesson.actual_start:
                lesson.actual_start = timezone.now()
        elif action_type == 'mark_missed':
            lesson.status = 'missed'
        elif action_type == 'mark_scheduled':
            lesson.status = 'scheduled'
            lesson.actual_start = None
            lesson.actual_end = None
        elif action_type == 'reopen':
            lesson.status = 'in_progress'
            lesson.actual_end = None
        elif action_type == 'update_times':
            if request.data.get('actual_start'):
                lesson.actual_start = request.data['actual_start']
            if request.data.get('actual_end'):
                lesson.actual_end = request.data['actual_end']
            if request.data.get('scheduled_start'):
                lesson.scheduled_start = request.data['scheduled_start']
            if request.data.get('scheduled_end'):
                lesson.scheduled_end = request.data['scheduled_end']
        else:
            return Response({'error': "Noto'g'ri action."}, status=400)

        if request.data.get('notes'):
            lesson.notes = request.data['notes']

        lesson.save()

        AuditLog.log(
            user=request.user, action='lesson_fix',
            description=f"Dars tuzatildi: {action_type} (ID: {lesson_id}, {old_status} -> {lesson.status})",
            target_model='Lesson', target_id=lesson.id,
            old_data={'status': old_status},
            new_data={'status': lesson.status},
        )

        from lessons.serializers import LessonSerializer
        return Response({
            'message': 'Dars muvaffaqiyatli tuzatildi.',
            'lesson': LessonSerializer(lesson).data,
        })


class AttendanceFixView(APIView):
    """IT Support: Davomatni tuzatish."""
    permission_classes = [IsITSupport]

    def post(self, request):
        from attendance.models import Attendance
        from teachers.models import Teacher

        action_type = request.data.get('action')
        teacher_id = request.data.get('teacher_id')
        date_str = request.data.get('date')

        if action_type == 'update_status':
            att_id = request.data.get('attendance_id')
            new_status = request.data.get('status')
            try:
                att = Attendance.objects.get(id=att_id)
            except Attendance.DoesNotExist:
                return Response({'error': 'Davomat topilmadi.'}, status=404)

            old_status = att.status
            att.status = new_status
            if request.data.get('notes'):
                att.notes = request.data['notes']
            att.save()

            AuditLog.log(
                user=request.user, action='attendance_fix',
                description=f"Davomat tuzatildi: {old_status} -> {new_status}",
                target_model='Attendance', target_id=att.id,
                old_data={'status': old_status},
                new_data={'status': new_status},
            )

            from attendance.serializers import AttendanceSerializer
            return Response({'message': "Davomat tuzatildi.", 'attendance': AttendanceSerializer(att).data})

        elif action_type == 'create_manual':
            try:
                teacher = Teacher.objects.get(id=teacher_id)
            except Teacher.DoesNotExist:
                return Response({'error': 'Teacher topilmadi.'}, status=404)

            target_date = parse_date(date_str or '')
            if not target_date:
                return Response({'error': 'Sana formati noto\'g\'ri.'}, status=400)

            check_in_time = None
            check_in_value = request.data.get('check_in_time')
            if check_in_value and request.data.get('status') != 'absent':
                parsed_time = parse_time(check_in_value)
                if not parsed_time:
                    return Response({'error': 'Kelish vaqti formati noto\'g\'ri.'}, status=400)
                check_in_time = timezone.make_aware(
                    timezone.datetime.combine(target_date, parsed_time),
                    timezone.get_current_timezone(),
                )
            elif request.data.get('status') != 'absent':
                check_in_time = timezone.now()

            att, created = Attendance.objects.update_or_create(
                teacher=teacher, date=target_date,
                defaults={
                    'status': request.data.get('status', 'present'),
                    'check_in_time': check_in_time,
                    'notes': request.data.get('notes', 'IT Support tomonidan qo\'lda yaratildi'),
                }
            )

            AuditLog.log(
                user=request.user, action='attendance_fix',
                description=f"Davomat qo'lda yaratildi: {teacher.user.get_full_name()} - {date_str}",
                target_model='Attendance', target_id=att.id,
            )

            from attendance.serializers import AttendanceSerializer
            return Response({'message': "Davomat yaratildi.", 'attendance': AttendanceSerializer(att).data})

        return Response({'error': "Noto'g'ri action."}, status=400)
