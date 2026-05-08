import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, Camera, TrendingUp, RefreshCw, BookOpen, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { api } from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [dashboard, pendingPhotos, logs] = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getPendingPhotos(),
        api.getAttendanceLogs('?ordering=-check_in_time'),
      ]);

      if (dashboard.status === 'fulfilled') setStats(dashboard.value);
      if (pendingPhotos.status === 'fulfilled') setPhotos((pendingPhotos.value.results || []).slice(0, 6));
      if (logs.status === 'fulfilled') setRecentLogs((logs.value.results || []).slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePhotoAction = async (id, action) => {
    try {
      await api.reviewPhoto(id, action, 'Tekshirildi');
      setPhotos(photos.filter(p => p.id !== id));
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    }
  };

  const statCards = stats ? [
    { label: "Jami O'qituvchilar", value: stats.teachers?.total ?? '-', icon: <Users size={24} color="var(--primary)" />, badge: null },
    { label: 'Bugun Kelganlar', value: stats.teachers?.present ?? '-', icon: <UserCheck size={24} color="var(--success)" />, badge: stats.teachers?.total ? Math.round((stats.teachers.present / stats.teachers.total) * 100) + '%' : null, badgeType: 'success' },
    { label: 'Kelmaganlar', value: stats.teachers?.absent ?? '-', icon: <UserX size={24} color="var(--danger)" />, badge: null },
    { label: 'Kechikkanlar', value: stats.teachers?.late ?? '-', icon: <Clock size={24} color="var(--warning)" />, badge: null },
    { label: 'Bugungi Darslar', value: stats.lessons?.total ?? '-', icon: <BookOpen size={24} color="var(--accent)" />, badge: stats.lessons?.completed != null ? stats.lessons.completed + ' yakunlangan' : null, badgeType: 'primary' },
    { label: "O'tilmagan Darslar", value: stats.lessons?.missed ?? '-', icon: <AlertTriangle size={24} color="var(--danger)" />, badge: null },
  ] : Array(6).fill(null);

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '100%' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">Dashboard yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>

      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Dashboard</h1>
          <p className="text-muted">Bugungi kun xulosasi va analitikalar</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Yangilanmoqda...' : 'Yangilash'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3" style={{ gap: '1.25rem' }}>
        {statCards.map((item, idx) =>
          item ? (
            <div key={idx} className="glass glass-hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div className="flex-col" style={{ gap: '0.2rem' }}>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="heading-2" style={{ fontSize: '1.75rem' }}>{item.value}</span>
                  {item.badge && (
                    <span className={`badge badge-${item.badgeType || 'primary'}`} style={{ fontSize: '0.65rem' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div key={idx} className="glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
              <div className="flex-col" style={{ gap: '0.5rem', flex: 1 }}>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '70%' }} />
                <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '40%' }} />
              </div>
            </div>
          )
        )}
      </div>

      {/* Lists */}
      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>

        {/* Recent Check-ins */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 className="heading-3" style={{ fontSize: '1.1rem' }}>So'nggi QR Check-in lar</h3>
            <span className="badge badge-primary">{recentLogs.length} ta</span>
          </div>
          <div className="flex-col gap-3">
            {recentLogs.length === 0 ? (
              <p className="text-muted" style={{ padding: '1.5rem', textAlign: 'center' }}>Hali skaner qilinmadi.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex-between animate-fade-in" style={{ paddingBottom: '0.85rem', borderBottom: '1px solid var(--surface-border)' }}>
                  <div className="flex-center gap-3">
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.teacher_name || 'T')}&background=6366f1&color=fff`} alt="" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div className="flex-col" style={{ gap: '0.1rem' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{log.teacher_name || '—'}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{log.date}</span>
                    </div>
                  </div>
                  <div className="flex-col" style={{ alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                      {log.status_display || log.status}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Photos */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 className="heading-3" style={{ fontSize: '1.1rem' }}>Kutilayotgan Rasmlar</h3>
            <span className="badge badge-warning">{photos.length} ta</span>
          </div>
          <div className="flex-col gap-3">
            {photos.length === 0 ? (
              <div className="flex-center flex-col gap-2" style={{ padding: '1.5rem' }}>
                <CheckCircle size={32} color="var(--success)" />
                <p className="text-muted">Hamma rasmlar tekshirilgan ✅</p>
              </div>
            ) : (
              photos.map((photo, i) => (
                <div key={photo.id} className="flex-between animate-fade-in" style={{ paddingBottom: '0.85rem', borderBottom: i !== photos.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <div className="flex-center gap-3">
                    <div
                      style={{ width: '46px', height: '46px', borderRadius: '8px', background: 'var(--bg-darker)', overflow: 'hidden', cursor: photo.photo ? 'pointer' : 'default', flexShrink: 0 }}
                      onClick={() => photo.photo && setSelectedPhoto(photo.photo)}
                      title="Rasmni kattalashtirish"
                    >
                      {photo.photo ? (
                        <img src={photo.photo} alt="Dars" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="flex-center" style={{ height: '100%' }}>
                          <Camera size={16} color="var(--primary)" />
                        </div>
                      )}
                    </div>
                    <div className="flex-col" style={{ gap: '0.1rem' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {photo.teacher_name || `Dars #${photo.lesson}`}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {photo.created_at ? new Date(photo.created_at).toLocaleDateString('uz-UZ') : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-center gap-2">
                    <button onClick={() => handlePhotoAction(photo.id, 'accepted')} className="btn btn-success" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>✓ Qabul</button>
                    <button onClick={() => handlePhotoAction(photo.id, 'rejected')} className="btn btn-danger" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}>✗ Rad</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Photo Zoom Modal */}
      {selectedPhoto && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.15)' }} />
          <button
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
          >
            ✕ Yopish
          </button>
        </div>
      )}
    </div>
  );
}
