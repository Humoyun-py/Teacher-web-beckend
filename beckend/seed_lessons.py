import os
import django
from datetime import date, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from teachers.models import Teacher, Subject, SchoolClass
from lessons.models import Lesson, LessonSchedule
from attendance.models import Attendance

User = get_user_model()

def seed():
    print("Deleting old mock data to reset...")
    Lesson.objects.all().delete()
    LessonSchedule.objects.all().delete()
    Teacher.objects.all().delete()
    Subject.objects.all().delete()
    SchoolClass.objects.all().delete()
    
    # Keep superusers, delete other mock users if any
    User.objects.exclude(username__in=["admin", "humoyun-jo'rayev"]).delete()

    print("Creating subjects...")
    subj_dastur = Subject.objects.create(name="Dasturlash", description="Dasturlash asoslari")
    subj_fizika = Subject.objects.create(name="Fizika", description="Fizika kursi")
    subj_info = Subject.objects.create(name="Informatika", description="Informatika va IT")
    subj_ingliz = Subject.objects.create(name="Ingliz tili", description="English language")
    subj_tarix = Subject.objects.create(name="Tarix", description="Jahon va O'zbekiston tarixi")
    subj_kimyo = Subject.objects.create(name="Kimyo", description="Kimyo darsi")

    print("Creating classes...")
    class1 = SchoolClass.objects.create(name="20-sinf", grade=2, section="A", room="101", floor=1)
    class2 = SchoolClass.objects.create(name="30-sinf", grade=3, section="A", room="202", floor=2)
    class3 = SchoolClass.objects.create(name="40-sinf", grade=4, section="A", room="303", floor=3)
    class4 = SchoolClass.objects.create(name="10-sinf", grade=1, section="A", room="104", floor=1)
    class5 = SchoolClass.objects.create(name="50-sinf", grade=5, section="A", room="205", floor=2)
    class6 = SchoolClass.objects.create(name="60-sinf", grade=6, section="A", room="306", floor=3)

    print("Creating teachers...")
    teachers_data = [
        {"username": "admin_nanur", "first_name": "Admin", "last_name": "Nanur", "emp_id": "T001", "salary": 5000000},
        {"username": "shacher_damur", "first_name": "Shacher", "last_name": "Damur", "emp_id": "T002", "salary": 4500000},
        {"username": "dilshodbek_olimov", "first_name": "Dilshodbek", "last_name": "Olimov", "emp_id": "T003", "salary": 4000000},
        {"username": "kamola_rixsiyeva", "first_name": "Kamola", "last_name": "Rixsiyeva", "emp_id": "T004", "salary": 3800000},
        {"username": "javohir_zokirov", "first_name": "Javohir", "last_name": "Zokirov", "emp_id": "T005", "salary": 4200000},
        {"username": "malika_axmedova", "first_name": "Malika", "last_name": "Axmedova", "emp_id": "T006", "salary": 4100000},
    ]

    teachers = []
    for td in teachers_data:
        u, _ = User.objects.get_or_create(
            username=td["username"],
            defaults={
                "first_name": td["first_name"],
                "last_name": td["last_name"],
                "email": f"{td['username']}@school.uz"
            }
        )
        u.set_password("password123")
        u.save()
        
        t = Teacher.objects.create(
            user=u,
            employee_id=td["emp_id"],
            monthly_salary=td["salary"],
            status="active"
        )
        teachers.append(t)

    # Assign subjects and classes
    teachers[0].subjects.add(subj_dastur)
    teachers[0].classes.add(class1)
    
    teachers[1].subjects.add(subj_fizika)
    teachers[1].classes.add(class2)
    
    teachers[2].subjects.add(subj_info)
    teachers[2].classes.add(class3)
    
    teachers[3].subjects.add(subj_ingliz)
    teachers[3].classes.add(class4)
    
    teachers[4].subjects.add(subj_tarix)
    teachers[4].classes.add(class5)
    
    teachers[5].subjects.add(subj_kimyo)
    teachers[5].classes.add(class6)

    print("Creating lessons for 2026-08-05...")
    target_date = date(2026, 8, 5)
    
    # 1. Admin Nanur - Dasturlash - 08:00 - 17:00 - 101 - Active (in_progress)
    Lesson.objects.create(
        teacher=teachers[0],
        subject=subj_dastur,
        school_class=class1,
        date=target_date,
        scheduled_start=time(8, 0),
        scheduled_end=time(17, 0),
        room="101",
        status="in_progress"
    )

    # 2. Shacher-Damur - Fizika - 08:00 - 18:00 - 202 - Planned (scheduled)
    Lesson.objects.create(
        teacher=teachers[1],
        subject=subj_fizika,
        school_class=class2,
        date=target_date,
        scheduled_start=time(8, 0),
        scheduled_end=time(18, 0),
        room="202",
        status="scheduled"
    )

    # 3. Dilshodbek Olimov - Informatika - 09:00 - 10:30 - 303 - Ended (completed)
    Lesson.objects.create(
        teacher=teachers[2],
        subject=subj_info,
        school_class=class3,
        date=target_date,
        scheduled_start=time(9, 0),
        scheduled_end=time(10, 30),
        room="303",
        status="completed"
    )

    # 4. Kamola Rixsiyeva - Ingliz tili - 11:00 - 12:30 - 104 - Planned (scheduled)
    Lesson.objects.create(
        teacher=teachers[3],
        subject=subj_ingliz,
        school_class=class4,
        date=target_date,
        scheduled_start=time(11, 0),
        scheduled_end=time(12, 30),
        room="104",
        status="scheduled"
    )

    # 5. Javohir Zokirov - Tarix - 13:00 - 14:30 - 205 - Missed (missed)
    Lesson.objects.create(
        teacher=teachers[4],
        subject=subj_tarix,
        school_class=class5,
        date=target_date,
        scheduled_start=time(13, 0),
        scheduled_end=time(14, 30),
        room="205",
        status="missed"
    )

    # 6. Malika Axmedova - Kimyo - 15:00 - 16:30 - 306 - Ended (completed)
    Lesson.objects.create(
        teacher=teachers[5],
        subject=subj_kimyo,
        school_class=class6,
        date=target_date,
        scheduled_start=time(15, 0),
        scheduled_end=time(16, 30),
        room="306",
        status="completed"
    )

    print("Creating sample attendance logs...")
    # Admin Nanur present
    Attendance.objects.create(teacher=teachers[0], date=target_date, status="present")
    # Shacher-Damur present
    Attendance.objects.create(teacher=teachers[1], date=target_date, status="present")
    # Dilshodbek Olimov present
    Attendance.objects.create(teacher=teachers[2], date=target_date, status="present")
    # Kamola Rixsiyeva present
    Attendance.objects.create(teacher=teachers[3], date=target_date, status="present")
    # Javohir Zokirov absent
    Attendance.objects.create(teacher=teachers[4], date=target_date, status="absent")
    # Malika Axmedova present
    Attendance.objects.create(teacher=teachers[5], date=target_date, status="present")

    print("Successfully seeded all data!")

if __name__ == "__main__":
    seed()
