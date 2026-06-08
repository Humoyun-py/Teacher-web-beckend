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
from .permissions import IsAdmin


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



