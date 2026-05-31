import React, { useState } from 'react';
import { Save, Bell, Shield, MapPin, Database, Sparkles } from 'lucide-react';

export default function ITSystemSettings() {
  const [config, setConfig] = useState({
    schoolName: localStorage.getItem('cfg_school_name') || 'Prezident Maktabi - Toshkent',
    geoRadius: localStorage.getItem('cfg_geo_radius') || '150',
    smsAlerts: localStorage.getItem('cfg_sms_alerts') !== 'false',
    graceMinutes: localStorage.getItem('cfg_grace_minutes') || '5',
    adminPin: localStorage.getItem('cfg_admin_pin') || '9988'
  });

  const handleSave = () => {
    localStorage.setItem('cfg_school_name', config.schoolName);
    localStorage.setItem('cfg_geo_radius', config.geoRadius);
    localStorage.setItem('cfg_sms_alerts', config.smsAlerts);
    localStorage.setItem('cfg_grace_minutes', config.graceMinutes);
    localStorage.setItem('cfg_admin_pin', config.adminPin);
    alert('✅ Tizim sozlamalari muvaffaqiyatli saqlandi!');
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 className="heading-2">Tizim Sozlamalari (IT Support)</h1>
        <p className="text-muted">Maktab global parametrlari, integratsiyalar va xavfsizlik sozlamalari</p>
      </div>

      <div className="glass flex-col" style={{ padding: '2rem', gap: '2rem' }}>
        
        {/* Organisation */}
        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <MapPin size={20} color="var(--primary)" /> Maktab ma'lumotlari
           </h3>
           <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Maktab yoki Tashkilot Nomi</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={config.schoolName}
                  onChange={e => setConfig({ ...config, schoolName: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Geo-lokatsiya radius (metr)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={config.geoRadius}
                  onChange={e => setConfig({ ...config, geoRadius: e.target.value })}
                />
              </div>
           </div>
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)' }}></div>

        {/* Notifications & Business Logic */}
        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <Bell size={20} color="var(--warning)" /> Davomat va Bildirishnomalar
           </h3>
           <div className="flex-between">
             <div className="flex-col" style={{ gap: '0.15rem' }}>
               <span style={{ fontWeight: 500 }}>Dars kechikganida Alert (SMS yuborish)</span>
               <span className="text-muted" style={{ fontSize: '0.78rem' }}>Kechikish qayd etilganda ota-onalarga yoki ma'muriyatga SMS xabar</span>
             </div>
             <input 
               type="checkbox" 
               checked={config.smsAlerts}
               onChange={e => setConfig({ ...config, smsAlerts: e.target.checked })}
               style={{ width: '22px', height: '22px', cursor: 'pointer' }} 
             />
           </div>
           <div className="flex-between">
             <div className="flex-col" style={{ gap: '0.15rem' }}>
               <span style={{ fontWeight: 500 }}>Kech qolganlik chegarasi (Daqiqa)</span>
               <span className="text-muted" style={{ fontSize: '0.78rem' }}>Belgilangan vaqtdan necha daqiqa kechikish ruxsat etiladi (tolerans)</span>
             </div>
             <input 
               type="number" 
               className="input-field" 
               value={config.graceMinutes}
               onChange={e => setConfig({ ...config, graceMinutes: e.target.value })}
               style={{ width: '100px' }} 
             />
           </div>
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)' }}></div>

        {/* Security */}
        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <Shield size={20} color="var(--danger)" /> Tizim xavfsizligi
           </h3>
           <div className="input-group">
             <label className="input-label">Admin Paneliga kirish PIN kodi</label>
             <input 
               type="password" 
               className="input-field" 
               value={config.adminPin}
               onChange={e => setConfig({ ...config, adminPin: e.target.value })}
               style={{ maxWidth: '300px' }} 
             />
           </div>
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)' }}></div>

        {/* Maintenance / Diagnostics */}
        <div className="flex-col gap-4">
           <h3 className="heading-3 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
             <Database size={20} color="var(--accent)" /> Diagnostics & Xizmat ko'rsatish
           </h3>
           <div className="flex-between" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
             <div className="flex-col" style={{ gap: '0.15rem' }}>
               <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Tizim keshi va vaqtinchalik ma'lumotlar</span>
               <span className="text-muted" style={{ fontSize: '0.75rem' }}>Barcha local kesh fayllarni tozalash (LocalStorage)</span>
             </div>
             <button 
               className="btn btn-outline" 
               style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
               onClick={() => {
                 localStorage.clear();
                 alert('Local kesh muvaffaqiyatli tozalandi! Sahifa qayta yuklanadi.');
                 window.location.reload();
               }}
             >
               Keshni tozalash
             </button>
           </div>
        </div>

        <div className="flex-center" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> O'zgarishlarni Saqlash</button>
        </div>

      </div>
    </div>
  );
}
