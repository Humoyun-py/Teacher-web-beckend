"""
Serializers for teachers app.
"""

from rest_framework import serializers
from .models import Teacher, Subject, SchoolClass
from accounts.serializers import UserSerializer, UserCreateSerializer


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model."""

    teachers_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'is_active', 'teachers_count', 'created_at']

    def get_teachers_count(self, obj):
        return obj.teachers.count()


class SchoolClassSerializer(serializers.ModelSerializer):
    """Serializer for SchoolClass model."""

    teachers_count = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = [
            'id', 'name', 'grade', 'section', 'capacity',
            'is_active', 'teachers_count', 'created_at',
        ]

    def get_teachers_count(self, obj):
        return obj.teachers.count()


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for reading Teacher data."""

    user = UserSerializer(read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)
    classes = SchoolClassSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'employee_id', 'subjects', 'classes',
            'status', 'date_of_birth', 'address', 'specialization',
            'experience_years', 'hire_date', 'full_name',
            'monthly_salary', 'daily_rate', 'hourly_rate', 'minute_rate',
            'created_at', 'updated_at',
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name()


class TeacherCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a Teacher with user account."""

    # User fields
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False)

    # Teacher fields
    subject_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True, required=False,
    )
    class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True, required=False,
    )

    class Meta:
        model = Teacher
        fields = [
            'username', 'password', 'email', 'first_name', 'last_name',
            'phone', 'employee_id', 'date_of_birth', 'address',
            'specialization', 'experience_years', 'hire_date',
            'monthly_salary', 'subject_ids', 'class_ids',
        ]

    def create(self, validated_data):
        from accounts.models import User

        # Extract user data
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email', ''),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'phone': validated_data.pop('phone', ''),
            'role': 'teacher',
        }
        password = validated_data.pop('password')
        subject_ids = validated_data.pop('subject_ids', [])
        class_ids = validated_data.pop('class_ids', [])

        # Create user
        user = User(**user_data)
        user.set_password(password)
        user.save()

        # Create teacher
        teacher = Teacher.objects.create(user=user, **validated_data)

        # Assign subjects and classes
        if subject_ids:
            teacher.subjects.set(subject_ids)
        if class_ids:
            teacher.classes.set(class_ids)

        return teacher


class TeacherUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating Teacher data."""

    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    subject_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True, required=False,
    )
    class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True, required=False,
    )

    class Meta:
        model = Teacher
        fields = [
            'first_name', 'last_name', 'phone', 'email',
            'employee_id', 'status', 'date_of_birth', 'address',
            'specialization', 'experience_years', 'hire_date',
            'monthly_salary', 'subject_ids', 'class_ids',
        ]

    def update(self, instance, validated_data):
        # Update user fields
        user = instance.user
        user_fields = ['first_name', 'last_name', 'phone', 'email']
        for field in user_fields:
            if field in validated_data:
                setattr(user, field, validated_data.pop(field))
        user.save()

        # Update subject/class assignments
        subject_ids = validated_data.pop('subject_ids', None)
        class_ids = validated_data.pop('class_ids', None)

        if subject_ids is not None:
            instance.subjects.set(subject_ids)
        if class_ids is not None:
            instance.classes.set(class_ids)

        # Update teacher fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


class TeacherListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for teacher lists."""

    full_name = serializers.SerializerMethodField()
    first_name = serializers.CharField(source='user.first_name', default='')
    last_name = serializers.CharField(source='user.last_name', default='')
    username = serializers.CharField(source='user.username')
    phone = serializers.CharField(source='user.phone', allow_blank=True, default='')
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = Teacher
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name',
            'username', 'phone', 'status', 'is_active',
            'monthly_salary', 'daily_rate', 'hourly_rate', 'minute_rate',
            'created_at',
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
