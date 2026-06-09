from django.db import models
from django.conf import settings
from teachers.models import Teacher
from accounts.models import SoftDeleteModel

class SalaryRecord(SoftDeleteModel):
    """Teacher monthly salary calculations and records."""
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Qoralama'
        APPROVED = 'approved', 'Tasdiqlangan'
        PAID = 'paid', 'To\'langan'
        
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='salary_records',
        verbose_name='Teacher'
    )
    month = models.IntegerField(verbose_name='Oy')
    year = models.IntegerField(verbose_name='Yil')
    
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='Asosiy oylik')
    base_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='Ishlab topilgan maosh')
    
    replacement_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='O\'rinbosarlikdan kelgan haq')
    replaced_out_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='O\'rniga o\'tilgan dars chegirmasi')
    
    penalty_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='Kechikish jarimasi')
    
    kpi_bonus = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='KPI Ustama bonus')
    kpi_penalty = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='KPI Chegirma jarima')
    
    final_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.0, verbose_name='Yakuniy to\'lanadigan oylik')
    
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Status'
    )
    
    calculated_at = models.DateTimeField(auto_now_add=True, verbose_name='Hisoblangan vaqt')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_salaries',
        verbose_name='Tasdiqlovchi'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='Tasdiqlangan vaqt')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='To\'langan vaqt')
    
    class Meta:
        verbose_name = 'Oylik Hisoboti'
        verbose_name_plural = 'Oylik Hisobotlari'
        ordering = ['-year', '-month', '-final_salary']
        unique_together = ['teacher', 'month', 'year']
        
    def __str__(self):
        return f"{self.teacher.user.get_full_name()} - {self.year}/{self.month} - Net: {self.final_salary}"
