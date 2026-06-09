from django.db import models
from teachers.models import Teacher
from accounts.models import SoftDeleteModel

class KPIRecord(SoftDeleteModel):
    """Teacher monthly KPI records."""
    
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='kpi_records',
        verbose_name='Teacher'
    )
    month = models.IntegerField(verbose_name='Oy')
    year = models.IntegerField(verbose_name='Yil')
    
    attendance_score = models.FloatField(default=0.0, verbose_name='Davomat bali (0-100)')
    lesson_score = models.FloatField(default=0.0, verbose_name='Dars o\'tish bali (0-100)')
    proof_score = models.FloatField(default=0.0, verbose_name='Rasm isbot bali (0-100)')
    late_arrival_score = models.FloatField(default=0.0, verbose_name='Kechikmaslik bali (0-100)')
    replacement_score = models.FloatField(default=0.0, verbose_name='O\'rinbosarlik bali')
    
    total_score = models.FloatField(default=0.0, verbose_name='Umumiy KPI (0-100)')
    grade = models.CharField(max_length=2, default='F', verbose_name='Bahosi')
    
    calculated_at = models.DateTimeField(auto_now_add=True, verbose_name='Hisoblangan vaqt')
    
    class Meta:
        verbose_name = 'KPI Hisoboti'
        verbose_name_plural = 'KPI Hisobotlari'
        ordering = ['-year', '-month', '-total_score']
        unique_together = ['teacher', 'month', 'year']
        
    def __str__(self):
        return f"{self.teacher.user.get_full_name()} - {self.year}/{self.month} - KPI: {self.total_score}%"

    def calculate_grade(self):
        score = self.total_score
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
            
    def save(self, *args, **kwargs):
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)
