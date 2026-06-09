from django.db import models
from accounts.models import SoftDeleteModel

class CCTVCamera(SoftDeleteModel):
    """CCTV Camera model to track camera health and stream URLs."""
    
    class Status(models.TextChoices):
        ONLINE = 'online', 'Ishlamoqda (Online)'
        OFFLINE = 'offline', 'Ishlamayapti (Offline)'
        MAINTENANCE = 'maintenance', 'Texnik xizmat ko\'rsatish'
        
    name = models.CharField(max_length=100, verbose_name='Kamera nomi')
    location = models.CharField(max_length=200, verbose_name='O\'rnatilgan joyi')
    ip_address = models.GenericIPAddressField(verbose_name='IP Manzil', null=True, blank=True)
    stream_url = models.CharField(max_length=500, verbose_name='RTSP/HTTP Stream URL')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ONLINE,
        verbose_name='Status'
    )
    last_health_check = models.DateTimeField(null=True, blank=True, verbose_name='Oxirgi tekshiruv vaqti')
    is_active = models.BooleanField(default=True, verbose_name='Faol')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'CCTV Kamera'
        verbose_name_plural = 'CCTV Kameralar'
        ordering = ['name']
        
    def __str__(self):
        return f"{self.name} ({self.location}) - {self.get_status_display()}"
