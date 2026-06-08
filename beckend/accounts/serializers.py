"""
Serializers for accounts app.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate

from .models import User, AuditLog


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar', 'is_active',
            'is_superuser', 'is_staff',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # superuser admin bo'lib ko'rsatiladi
        if instance.is_superuser:
            data['role'] = 'admin'
        return data


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users."""

    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar', 'password', 'password_confirm',
        ]

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Parollar mos kelmadi.'
            })
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login."""

    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(
            username=data['username'],
            password=data['password'],
        )
        if not user:
            raise serializers.ValidationError(
                'Username yoki parol noto\'g\'ri.'
            )
        if not user.is_active:
            raise serializers.ValidationError(
                'Foydalanuvchi faol emas.'
            )
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""

    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=6)
    new_password_confirm = serializers.CharField(min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Eski parol noto\'g\'ri.')
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Yangi parollar mos kelmadi.'
            })
        return data


class RefreshTokenSerializer(serializers.Serializer):
    """Serializer for refreshing tokens."""

    refresh_token = serializers.CharField()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management by IT Support."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar', 'is_active', 'is_staff',
            'is_superuser', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating admin users by IT Support."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'password',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(
            **validated_data,
            role='admin',
            is_staff=True,
        )
        user.set_password(password)
        user.save()
        return user


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs."""

    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'action_display',
            'target_model', 'target_id', 'target_name',
            'description', 'old_data', 'new_data',
            'ip_address', 'created_at',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'System'
