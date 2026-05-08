import React from 'react';
import { Save, Bell, Shield, MapPin } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 className="heading-2">Tizim Sozlamalari</h1>
        <p className="text-muted">Maktab QR logikasi hamda ruxsatlarni o'zgartirish</p>
      </div>

      <div className="glass flex-col" style={{ padding: '2rem', gap: '2rem' }}>
        
        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <MapPin size={20} color="var(--primary)" /> Asosiy Ma'lumotlar
           </h3>
           <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Maktab yoki Tashkilot Nomi</label>
                <input type="text" className="input-field" defaultValue="Prezident Maktabi - Toshkent" />
              </div>
              <div className="input-group">
                <label className="input-label">Geo-lokatsiya radius (metr)</label>
                <input type="number" className="input-field" defaultValue="150" />
              </div>
           </div>
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)' }}></div>

        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <Bell size={20} color="var(--warning)" /> Bildirishnomalar
           </h3>
           <div className="flex-between">
             <span style={{ fontWeight: 500 }}>Dars kechikganida Alert (SMS)</span>
             <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
           </div>
           <div className="flex-between">
             <span style={{ fontWeight: 500 }}>Kech qolganlik chegarasi (Daqiqa)</span>
             <input type="number" className="input-field" defaultValue="5" style={{ width: '100px' }} />
           </div>
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)' }}></div>

        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <Shield size={20} color="var(--danger)" /> Xavfsizlik
           </h3>
           <div className="input-group">
             <label className="input-label">Admin Paneliga kirish PIN kodi</label>
             <input type="password" className="input-field" defaultValue="****" style={{ maxWidth: '300px' }} />
           </div>
        </div>

        <div className="flex-center" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-primary"><Save size={18} /> O'zgarishlarni Saqlash</button>
        </div>

      </div>
    </div>
  );
}
