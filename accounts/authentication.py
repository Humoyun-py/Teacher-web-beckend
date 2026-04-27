"""
JWT Authentication backend for the Teacher Management System.
"""

import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import User


class JWTAuthentication(authentication.BaseAuthentication):
    """Custom JWT authentication class."""

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header or not auth_header.startswith(f'{self.keyword} '):
            return None

        token = auth_header.split(' ')[1]

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=['HS256'],
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token muddati tugagan.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Token noto\'g\'ri.')

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('Foydalanuvchi topilmadi.')

        if not user.is_active:
            raise exceptions.AuthenticationFailed('Foydalanuvchi faol emas.')

        return (user, token)


def generate_access_token(user):
    """Generate JWT access token."""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_LIFETIME_MINUTES
        ),
        'iat': datetime.now(timezone.utc),
        'type': 'access',
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')


def generate_refresh_token(user):
    """Generate JWT refresh token."""
    payload = {
        'user_id': user.id,
        'exp': datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS
        ),
        'iat': datetime.now(timezone.utc),
        'type': 'refresh',
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')
