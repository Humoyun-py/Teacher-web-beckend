from django.db import models

class SystemSetting(models.Model):
    """System configuration parameters stored in database."""
    
    class Category(models.TextChoices):
        ATTENDANCE = 'attendance', 'Davomat sozlamalari'
        KPI = 'kpi', 'KPI sozlamalari'
        SALARY = 'salary', 'Maosh sozlamalari'
        GENERAL = 'general', 'Umumiy sozlamalar'
        
    key = models.CharField(max_length=100, unique=True, verbose_name='Sozlama kaliti')
    value = models.TextField(verbose_name='Qiymat')
    description = models.TextField(blank=True, verbose_name='Tavsif')
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
        verbose_name='Kategoriya'
    )
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tizim Sozlamasi'
        verbose_name_plural = 'Tizim Sozlamalari'
        ordering = ['category', 'key']
        
    def __str__(self):
        return f"{self.key}: {self.value} ({self.get_category_display()})"
        
    @classmethod
    def get_val(cls, key, default=None):
        """Helper method to fetch setting value from DB."""
        try:
            setting = cls.objects.get(key=key, is_active=True)
            return setting.value
        except cls.DoesNotExist:
            return default
