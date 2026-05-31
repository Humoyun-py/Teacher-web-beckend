import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Clock, Camera, RefreshCw, 
  BookOpen, AlertTriangle, Shield, HardDrive, CheckCircle2, 
  Activity, ArrowRight, Loader 
} from 'lucide-react';
import { api } from '../../api';

export default function ITSupportDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    try {
      const res = await api.getITSupportDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
      alert('Xatolik: Dashboard ma\'lumotlarini yuklab bo\'lmadi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '70vh' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">IT Support Dashboard yuklanmoqda...</p>
      </div>
    );
  }

  const t = data?.teachers || {};
  const l = data?.lessons || {};
  const s = data?.system || {};
  const logs = data?.recent_logs || [];

  const statCards = [
    { label: "Jami O'qituvchilar", value: t.total || 0, sub: `${t.active || 0} faol / ${t.inactive || 0} nofaol`, icon: <Users size={22} color="var(--primary)" /> },
    { label: "Bugun Kelganlar", value: t.present_today || 0, sub: `${t.late_today || 0} ta kechikkan`, icon: <UserCheck size={22} color="var(--success)" /> },
    { label: "Bugun Kelmaganlar", value: t.absent_today || 0, sub: `${t.not_checked_in || 0} kutilmoqda`, icon: <UserX size={22} color="var(--danger)" /> },
    { label: "Bugungi Darslar", value: l.total_today || 0, sub: `${l.completed || 0} ta o'tildi / ${l.in_progress || 0} jarayonda`, icon: <BookOpen size={22} color="var(--accent)" /> },
    { label: "O'tilmagan Darslar", value: l.missed || 0, sub: "Bugungi dars jadvalidan", icon: <AlertTriangle size={22} color="var(--danger)" /> },
    { label: "Dars Video Proofs", value: l.with_photo || 0, sub: `${l.without_photo || 0} rasmsiz darslar`, icon: <Camera size={22} color="var(--warning)" /> },
  ];

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
            <div style={{ padding: '0.4rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px', color: 'var(--primary)' }}>
              <Shield size={20} />
            </div>
            <h1 className="heading-2" style={{ margin: 0 }}>IT Support boshqaruv paneli</h1>
          </div>
          <p className="text-muted">Tizimning to'liq holati va real-time statistikasi</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Yangilanmoqda...' : 'Yangilash'}
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-3" style={{ gap: '1.25rem' }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="glass glass-hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div className="flex-col" style={{ gap: '0.15rem', flex: 1 }}>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>{card.label}</span>
              <span className="heading-2" style={{ fontSize: '1.8rem', lineHeight: 1 }}>{card.value}</span>
              <span className="text-muted" style={{ fontSize: '0.72rem', opacity: 0.85 }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Sub-content */}
      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        
        {/* System info */}
        <div className="glass flex-col" style={{ padding: '1.5rem', gap: '1.25rem' }}>
          <h3 className="heading-3" style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={18} color="var(--primary)" /> Tizim resurslari
          </h3>
          
          <div className="flex-col gap-3" style={{ flex: 1, justifyContent: 'center' }}>
            <div className="flex-between" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.88rem' }}>Jami foydalanuvchilar:</span>
              <span style={{ fontWeight: 700 }}>{s.total_users || 0} ta</span>
            </div>
            <div className="flex-between" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.88rem' }}>Adminlar:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.total_admins || 0} ta</span>
            </div>
            <div className="flex-between" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.88rem' }}>IT Support xodimlari:</span>
              <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{s.total_it_support || 0} ta</span>
            </div>
          </div>
        </div>

        {/* Audit Log Activities */}
        <div className="glass col-span-2 flex-col" style={{ padding: '1.5rem', gap: '1.25rem' }}>
          <div className="flex-between">
            <h3 className="heading-3" style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--warning)" /> So'nggi o'zgarishlar logi
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time audit log</span>
          </div>

          <div className="flex-col gap-3" style={{ overflowY: 'auto', maxHeight: '250px' }}>
            {logs.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Audit loglar mavjud emas.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex-between" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--surface-border)', gap: '1rem' }}>
                  <div className="flex-col" style={{ gap: '0.1rem', flex: 1 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 500, margin: 0 }}>{log.description}</p>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Kim: <b>{log.user_name || 'System'}</b></span>
                      <span>•</span>
                      <span>Sana: {new Date(log.created_at).toLocaleString('uz-UZ')}</span>
                    </div>
                  </div>
                  <span className={`badge`} style={{ 
                    fontSize: '0.7rem', 
                    background: log.action === 'delete' ? 'rgba(239,68,68,0.15)' : log.action === 'create' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: log.action === 'delete' ? 'var(--danger)' : log.action === 'create' ? 'var(--success)' : 'var(--warning)',
                    textTransform: 'uppercase'
                  }}>
                    {log.action_display || log.action}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
