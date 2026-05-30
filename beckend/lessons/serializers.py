"""
Serializers for lessons app.
"""

from rest_framework import serializers
from django.utils import timezone

from .models import LessonSchedule, Lesson
from teachers.serializers import TeacherListSerializer, SubjectSerializer, SchoolClassSerializer


class LessonScheduleSerializer(serializers.ModelSerializer):
    """Serializer for lesson schedule."""

    teacher_name = serializers.CharField(
        source='teacher.user.get_full_name', read_only=True,
    )
    subject_name = serializers.CharField(
        source='subject.name', read_only=True,
    )
    class_name = serializers.CharField(
        source='school_class.name', read_only=True,
    )
    class_room = serializers.CharField(
        source='school_class.room', read_only=True,
    )
    class_floor = serializers.IntegerField(
        source='school_class.floor', read_only=True,
    )
    day_name = serializers.CharField(
        source='get_day_of_week_display', read_only=True,
    )
    has_conflict = serializers.SerializerMethodField()

    class Meta:
        model = LessonSchedule
        fields = [
            'id', 'teacher', 'teacher_name', 'subject', 'subject_name',
            'school_class', 'class_name', 'class_room', 'class_floor',
            'day_of_week', 'day_name',
            'start_time', 'end_time', 'room', 'is_active',
            'has_conflict', 'created_at', 'updated_at',
        ]

    def get_has_conflict(self, obj):
        result = obj.has_conflict()
        return result['has_conflict']


class LessonScheduleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating lesson schedules."""

    class Meta:
        model = LessonSchedule
        fields = [
            'teacher', 'subject', 'school_class',
            'day_of_week', 'start_time', 'end_time', 'room',
        ]

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError(
                'Boshlanish vaqti tugash vaqtidan oldin bo\'lishi kerak.'
            )

        # Check for conflicts
        instance = LessonSchedule(**data)
        conflict_result = instance.has_conflict()
        if conflict_result['has_conflict']:
            conflicts = []
            if conflict_result['teacher_conflicts'] and conflict_result['teacher_conflicts'].exists():
                conflicts.append('Teacher bu vaqtda boshqa darsda.')
            if conflict_result['class_conflicts'] and conflict_result['class_conflicts'].exists():
                conflicts.append('Sinf bu vaqtda boshqa darsda.')
            if conflict_result['room_conflicts'] and conflict_result['room_conflicts'].exists():
                conflicts.append('Xona bu vaqtda band.')
            raise serializers.ValidationError({
                'conflict': conflicts,
            })

        return data


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson model."""

    teacher_name = serializers.CharField(
        source='teacher.user.get_full_name', read_only=True,
    )
    subject_name = serializers.CharField(
        source='subject.name', read_only=True,
    )
    class_name = serializers.CharField(
        source='school_class.name', read_only=True,
    )
    class_room = serializers.CharField(
        source='school_class.room', read_only=True,
    )
    class_floor = serializers.IntegerField(
        source='school_class.floor', read_only=True,
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True,
    )
    replacement_teacher_name = serializers.SerializerMethodField()
    replacement_status_display = serializers.CharField(
        source='get_replacement_status_display', read_only=True,
    )
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'schedule', 'teacher', 'teacher_name',
            'subject', 'subject_name', 'school_class', 'class_name',
            'class_room', 'class_floor',
            'date', 'scheduled_start', 'scheduled_end',
            'actual_start', 'actual_end', 'status', 'status_display',
            'is_replaced', 'replacement_teacher', 'replacement_teacher_name',
            'replacement_status', 'replacement_status_display', 'replacement_reason',
            'notes', 'room', 'started_late', 'duration_minutes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['actual_start', 'actual_end', 'started_late']

    def get_replacement_teacher_name(self, obj):
        if obj.replacement_teacher:
            return obj.replacement_teacher.user.get_full_name()
        return None

    def get_duration_minutes(self, obj):
        if obj.actual_start and obj.actual_end:
            delta = obj.actual_end - obj.actual_start
            return int(delta.total_seconds() / 60)
        return None


class LessonCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating lessons."""

    class Meta:
        model = Lesson
        fields = [
            'teacher', 'subject', 'school_class',
            'date', 'scheduled_start', 'scheduled_end',
            'room', 'notes',
        ]

    def validate(self, data):
        if data['scheduled_start'] >= data['scheduled_end']:
            raise serializers.ValidationError(
                'Boshlanish vaqti tugash vaqtidan oldin bo\'lishi kerak.'
            )
        return data


class StartLessonSerializer(serializers.Serializer):
    """Serializer for starting a lesson."""

    lesson_id = serializers.IntegerField()

    def validate_lesson_id(self, value):
        try:
            lesson = Lesson.objects.get(id=value)
        except Lesson.DoesNotExist:
            raise serializers.ValidationError('Dars topilmadi.')

        if lesson.status != Lesson.Status.SCHEDULED:
            raise serializers.ValidationError(
                f'Dars statusni boshlash mumkin emas: {lesson.get_status_display()}'
            )
        return value


class EndLessonSerializer(serializers.Serializer):
    """Serializer for ending a lesson."""

    lesson_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate_lesson_id(self, value):
        try:
            lesson = Lesson.objects.get(id=value)
        except Lesson.DoesNotExist:
            raise serializers.ValidationError('Dars topilmadi.')

        if lesson.status != Lesson.Status.IN_PROGRESS:
            raise serializers.ValidationError(
                'Faqat jarayondagi darsni tugatish mumkin.'
            )
        return value


class ReplaceLessonSerializer(serializers.Serializer):
    """Serializer for replacing a teacher in a lesson."""

    lesson_id = serializers.IntegerField()
    replacement_teacher_id = serializers.IntegerField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_lesson_id(self, value):
        try:
            Lesson.objects.get(id=value)
        except Lesson.DoesNotExist:
            raise serializers.ValidationError('Dars topilmadi.')
        return value

    def validate_replacement_teacher_id(self, value):
        if not value:
            return value
        from teachers.models import Teacher
        try:
            Teacher.objects.get(id=value)
        except Teacher.DoesNotExist:
            raise serializers.ValidationError('Teacher topilmadi.')
        return value
