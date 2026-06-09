from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.apps import apps

from accounts.permissions import IsITSupport
from accounts.models import AuditLog

# Import serializers for serializing restored/deleted objects
from teachers.serializers import TeacherSerializer, SubjectSerializer, SchoolClassSerializer
from lessons.serializers import LessonSerializer, LessonScheduleSerializer
from attendance.serializers import AttendanceSerializer, QRCodeSerializer
from photos.serializers import PhotoProofSerializer

class DeletedRecordsListView(APIView):
    """
    🗑️ O'chirilgan yozuvlar ro'yxatini olish (IT Support).
    """
    permission_classes = [IsITSupport]

    def get(self, request, model_name):
        model_map = {
            'teacher': ('teachers', 'Teacher', TeacherSerializer),
            'subject': ('teachers', 'Subject', SubjectSerializer),
            'schoolclass': ('teachers', 'SchoolClass', SchoolClassSerializer),
            'lessonschedule': ('lessons', 'LessonSchedule', LessonScheduleSerializer),
            'lesson': ('lessons', 'Lesson', LessonSerializer),
            'qrcode': ('attendance', 'QRCode', QRCodeSerializer),
            'attendance': ('attendance', 'Attendance', AttendanceSerializer),
            'photoproof': ('photos', 'PhotoProof', PhotoProofSerializer),
        }
        
        lower_name = model_name.lower()
        if lower_name not in model_map:
            return Response(
                {'error': f"Noto'g'ri model nomi. Qo'llab-quvvatlanadigan modellar: {list(model_map.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        app_label, model_class_name, serializer_class = model_map[lower_name]
        try:
            model = apps.get_model(app_label, model_class_name)
        except LookupError:
            return Response({'error': 'Model topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Standard queryset filters by is_deleted=False, so we use all_objects or deleted_set
        deleted_queryset = model.all_objects.filter(is_deleted=True)
        serializer = serializer_class(deleted_queryset, many=True)
        
        return Response({
            'model': model_class_name,
            'count': deleted_queryset.count(),
            'deleted_records': serializer.data
        })


class RestoreRecordView(APIView):
    """
    🔄 O'chirilgan yozuvni qayta tiklash (IT Support).
    """
    permission_classes = [IsITSupport]

    def post(self, request, model_name, pk):
        model_map = {
            'teacher': ('teachers', 'Teacher'),
            'subject': ('teachers', 'Subject'),
            'schoolclass': ('teachers', 'SchoolClass'),
            'lessonschedule': ('lessons', 'LessonSchedule'),
            'lesson': ('lessons', 'Lesson'),
            'qrcode': ('attendance', 'QRCode'),
            'attendance': ('attendance', 'Attendance'),
            'photoproof': ('photos', 'PhotoProof'),
        }
        
        lower_name = model_name.lower()
        if lower_name not in model_map:
            return Response(
                {'error': f"Noto'g'ri model nomi. Qo'llab-quvvatlanadigan modellar: {list(model_map.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        app_label, model_class_name = model_map[lower_name]
        try:
            model = apps.get_model(app_label, model_class_name)
        except LookupError:
            return Response({'error': 'Model topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            # We search specifically in deleted records or all_objects
            instance = model.all_objects.get(pk=pk)
            if not instance.is_deleted:
                return Response({'error': 'Bu yozuv o\'chirilmagan, uni tiklab bo\'lmaydi.'}, status=status.HTTP_400_BAD_REQUEST)
                
            instance.restore()
            
            # Write to audit log
            name_val = getattr(instance, 'name', '') or str(instance)
            AuditLog.log(
                user=request.user,
                action='restore',
                description=f"{model_class_name} tiklandi: {name_val} (ID: {pk})",
                target_model=model_class_name,
                target_id=pk,
                target_name=name_val
            )
            
            return Response({
                'message': f"{model_class_name} muvaffaqiyatli tiklandi.",
                'id': pk
            })
            
        except model.DoesNotExist:
            return Response({'error': 'Yozuv topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
