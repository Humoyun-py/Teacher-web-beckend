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
from .permissions import IsAdmin, IsITSupport, IsAdminOrITSupport


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
                'users': '/api/v1/auth/users/ (IT Support)',
                'admins': '/api/v1/auth/admins/ (IT Support)',
                'audit-logs': '/api/v1/auth/audit-logs/ (IT Support)',
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

        try:
            AuditLog.log(
                user=user, action='login',
                description=f"{user.get_full_name()} tizimga kirdi",
                ip_address=request.META.get('REMOTE_ADDR'),
            )
        except Exception as e:
            # Audit log xatoligini e'tiborsiz qoldirish — login jarayonini to'xtatmaslik uchun
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"AuditLog login yozishda xatolik: {e}")

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

        AuditLog.log(
            user=request.user,
            action='password_change',
            description=f"{request.user.get_full_name()} parolini o'zgartirdi",
            target_model='User',
            target_id=request.user.id,
        )

        return Response({
            'message': 'Parol muvaffaqiyatli o\'zgartirildi.',
        })


# ──────────────────────────────────────────────────────────
# IT Support / Admin endpoints
# ──────────────────────────────────────────────────────────

class UserListView(generics.ListAPIView):
    """Barcha foydalanuvchilar ro'yxati (IT Support / Admin)."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminOrITSupport]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    filterset_fields = ['role', 'is_active', 'is_staff']
    ordering_fields = ['created_at', 'username']

    @swagger_auto_schema(
        operation_description="Barcha foydalanuvchilar ro'yxati",
        tags=['Foydalanuvchilar (IT Support)'],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return User.objects.all()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Foydalanuvchi tafsilotlari (IT Support)."""

    serializer_class = AdminUserSerializer
    permission_classes = [IsITSupport]
    queryset = User.objects.all()

    @swagger_auto_schema(tags=['Foydalanuvchilar (IT Support)'])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Foydalanuvchilar (IT Support)'])
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        old_data = AdminUserSerializer(user).data
        response = super().patch(request, *args, **kwargs)
        AuditLog.log(
            user=request.user,
            action='update',
            description=f"Foydalanuvchi yangilandi: {user.username}",
            target_model='User',
            target_id=user.id,
            target_name=user.get_full_name(),
            old_data=old_data,
            new_data=response.data,
        )
        return response

    @swagger_auto_schema(tags=['Foydalanuvchilar (IT Support)'])
    def put(self, request, *args, **kwargs):
        return self.patch(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Foydalanuvchilar (IT Support)'])
    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        AuditLog.log(
            user=request.user,
            action='delete',
            description=f"Foydalanuvchi o'chirildi: {user.username}",
            target_model='User',
            target_id=user.id,
            target_name=user.get_full_name(),
        )
        return super().delete(request, *args, **kwargs)


class AdminManagementView(APIView):
    """Admin foydalanuvchilarni boshqarish (IT Support)."""

    permission_classes = [IsITSupport]

    @swagger_auto_schema(
        operation_description="Admin foydalanuvchilar ro'yxati",
        tags=['Admin boshqaruvi (IT Support)'],
    )
    def get(self, request):
        admins = User.objects.filter(role__in=['admin', 'it_support'])
        serializer = AdminUserSerializer(admins, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Yangi admin yaratish",
        request_body=AdminCreateSerializer,
        tags=['Admin boshqaruvi (IT Support)'],
    )
    def post(self, request):
        serializer = AdminCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        AuditLog.log(
            user=request.user,
            action='create',
            description=f"Yangi admin yaratildi: {user.username}",
            target_model='User',
            target_id=user.id,
            target_name=user.get_full_name(),
        )

        return Response(
            AdminUserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class AuditLogListView(generics.ListAPIView):
    """Audit loglar ro'yxati (IT Support)."""

    serializer_class = AuditLogSerializer
    permission_classes = [IsITSupport]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'target_model', 'user']
    search_fields = ['description', 'target_name']
    ordering_fields = ['created_at']

    @swagger_auto_schema(
        operation_description="Barcha audit loglarni ko'rish",
        tags=['Audit Loglar (IT Support)'],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').all()

        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset


class AuditLogDetailView(generics.RetrieveAPIView):
    """Audit log tafsilotlari (IT Support)."""

    serializer_class = AuditLogSerializer
    permission_classes = [IsITSupport]
    queryset = AuditLog.objects.select_related('user').all()

    @swagger_auto_schema(
        operation_description="Audit log tafsilotlarini ko'rish",
        tags=['Audit Loglar (IT Support)'],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ResetUserPasswordView(APIView):
    """Foydalanuvchi parolini tiklash (IT Support)."""

    permission_classes = [IsITSupport]

    @swagger_auto_schema(
        operation_description="Foydalanuvchi parolini tiklash",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['user_id', 'new_password'],
            properties={
                'user_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
        tags=['Foydalanuvchilar (IT Support)'],
    )
    def post(self, request):
        user_id = request.data.get('user_id')
        new_password = request.data.get('new_password')

        if not user_id or not new_password:
            return Response(
                {'error': 'user_id va new_password kerak.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Foydalanuvchi topilmadi.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.set_password(new_password)
        user.save()

        AuditLog.log(
            user=request.user,
            action='password_change',
            description=f"IT Support {user.username} parolini tikladi",
            target_model='User',
            target_id=user.id,
            target_name=user.get_full_name(),
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'message': f"{user.username} paroli muvaffaqiyatli tiklandi.",
        })
