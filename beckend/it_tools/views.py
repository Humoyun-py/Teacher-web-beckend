from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from decimal import Decimal

from accounts.models import User, AuditLog
from accounts.permissions import IsITSupport
from accounts.authentication import generate_access_token, generate_refresh_token
from attendance.models import Attendance
from lessons.models import Lesson
from salary.models import SalaryRecord
from kpi.models import KPIRecord

class ActAsView(APIView):
    """
    👤 Boshqa foydalanuvchi sifatida tizimga kirish (IT Support).
    
    Ma'lum bir user_id berilsa, uning nomidan foydalanish uchun JWT tokenlarni qaytaradi.
    """
    permission_classes = [IsITSupport]

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id berilishi shart.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Foydalanuvchi topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Generatsiya qilish
        access_token = generate_access_token(user)
        refresh_token = generate_refresh_token(user)
        
        AuditLog.log(
            user=request.user,
            action='act_as',
            description=f"IT Support {user.get_full_name()} (ID: {user.id}) nomidan kirdi",
            target_model='User',
            target_id=user.id,
            target_name=user.get_full_name()
        )
        
        return Response({
            'message': f"Muvaffaqiyatli kirdingiz. Hozirgi foydalanuvchi: {user.get_full_name()}",
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'full_name': user.get_full_name()
            }
        })


class FixAttendanceView(APIView):
    """
    📝 Davomatni qo'lda tuzatish (IT Support).
    """
    permission_classes = [IsITSupport]

    def post(self, request):
        attendance_id = request.data.get('attendance_id')
        status_val = request.data.get('status')
        check_in = request.data.get('check_in_time')
        check_out = request.data.get('check_out_time')
        notes = request.data.get('notes', '')
        
        if not attendance_id:
            return Response({'error': 'attendance_id talab qilinadi.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            attendance = Attendance.objects.get(id=attendance_id)
        except Attendance.DoesNotExist:
            return Response({'error': 'Davomat yozuvi topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        old_data = {
            'status': attendance.status,
            'check_in': str(attendance.check_in_time) if attendance.check_in_time else None,
            'check_out': str(attendance.check_out_time) if attendance.check_out_time else None,
            'notes': attendance.notes
        }
        
        if status_val:
            attendance.status = status_val
        if check_in:
            attendance.check_in_time = check_in
        if check_out:
            attendance.check_out_time = check_out
        if notes:
            attendance.notes = notes
            
        attendance.save()
        
        AuditLog.log(
            user=request.user,
            action='attendance_fix',
            description=f"Davomat qo'lda tuzatildi: {attendance.teacher.user.get_full_name()} (Sana: {attendance.date})",
            target_model='Attendance',
            target_id=attendance.id,
            target_name=attendance.teacher.user.get_full_name(),
            old_data=old_data,
            new_data={
                'status': attendance.status,
                'check_in': str(attendance.check_in_time) if attendance.check_in_time else None,
                'check_out': str(attendance.check_out_time) if attendance.check_out_time else None,
                'notes': attendance.notes
            }
        )
        
        return Response({
            'message': 'Davomat muvaffaqiyatli tuzatildi.',
            'attendance_id': attendance.id
        })


class FixLessonView(APIView):
    """
    🏫 Darsni qo'lda tuzatish (IT Support).
    """
    permission_classes = [IsITSupport]

    def post(self, request):
        lesson_id = request.data.get('lesson_id')
        status_val = request.data.get('status')
        teacher_id = request.data.get('teacher_id')
        replacement_teacher_id = request.data.get('replacement_teacher_id')
        replacement_status = request.data.get('replacement_status')
        
        if not lesson_id:
            return Response({'error': 'lesson_id talab qilinadi.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Dars topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        old_data = {
            'status': lesson.status,
            'teacher_id': lesson.teacher_id,
            'replacement_teacher_id': lesson.replacement_teacher_id,
            'replacement_status': lesson.replacement_status
        }
        
        if status_val:
            lesson.status = status_val
        if teacher_id:
            lesson.teacher_id = teacher_id
        if replacement_teacher_id:
            lesson.replacement_teacher_id = replacement_teacher_id
            lesson.is_replaced = True
        if replacement_status:
            lesson.replacement_status = replacement_status
            
        lesson.save()
        
        AuditLog.log(
            user=request.user,
            action='lesson_fix',
            description=f"Dars qo'lda tuzatildi (ID: {lesson.id}, Sana: {lesson.date})",
            target_model='Lesson',
            target_id=lesson.id,
            old_data=old_data,
            new_data={
                'status': lesson.status,
                'teacher_id': lesson.teacher_id,
                'replacement_teacher_id': lesson.replacement_teacher_id,
                'replacement_status': lesson.replacement_status
            }
        )
        
        return Response({
            'message': 'Dars muvaffaqiyatli tuzatildi.',
            'lesson_id': lesson.id
        })


class FixSalaryView(APIView):
    """
    💰 Oylik maoshni qo'lda tuzatish (IT Support).
    """
    permission_classes = [IsITSupport]

    def post(self, request):
        salary_id = request.data.get('salary_id')
        final_salary = request.data.get('final_salary')
        kpi_bonus = request.data.get('kpi_bonus')
        kpi_penalty = request.data.get('kpi_penalty')
        status_val = request.data.get('status')
        
        if not salary_id:
            return Response({'error': 'salary_id talab qilinadi.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            salary = SalaryRecord.objects.get(id=salary_id)
        except SalaryRecord.DoesNotExist:
            return Response({'error': 'Oylik hisoboti topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
            
        old_data = {
            'final_salary': str(salary.final_salary),
            'kpi_bonus': str(salary.kpi_bonus),
            'kpi_penalty': str(salary.kpi_penalty),
            'status': salary.status
        }
        
        if final_salary is not None:
            salary.final_salary = Decimal(str(final_salary))
        if kpi_bonus is not None:
            salary.kpi_bonus = Decimal(str(kpi_bonus))
        if kpi_penalty is not None:
            salary.kpi_penalty = Decimal(str(kpi_penalty))
        if status_val:
            salary.status = status_val
            
        salary.save()
        
        AuditLog.log(
            user=request.user,
            action='salary_fix',
            description=f"Maosh qo'lda tuzatildi: {salary.teacher.user.get_full_name()} ({salary.year}/{salary.month})",
            target_model='SalaryRecord',
            target_id=salary.id,
            target_name=salary.teacher.user.get_full_name(),
            old_data=old_data,
            new_data={
                'final_salary': str(salary.final_salary),
                'kpi_bonus': str(salary.kpi_bonus),
                'kpi_penalty': str(salary.kpi_penalty),
                'status': salary.status
            }
        )
        
        return Response({
            'message': 'Oylik maosh muvaffaqiyatli tuzatildi.',
            'salary_id': salary.id
        })
