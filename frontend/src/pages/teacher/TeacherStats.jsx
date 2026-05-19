import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, CheckCircle, XCircle, Clock, Camera, Loader, RefreshCw, BarChart3 } from 'lucide-react';
import { api } from '../../api';

export default function TeacherStats() {
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, att, ph] = await Promise.allSettled([
        api.getTeacherDashboard(),
        api.getAttendanceLogs('?ordering=-date'),
        api.getPhotos('?ordering=-created_at'),
      ]);
      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (att.status === 'fulfilled') setAttendance((att.value.results || []).slice(0, 10));
      if (ph.status === 'fulfilled') setPhotos((ph.value.results || []).slice(0, 8));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '100%' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">Statistika yuklanmoqda...</p>
      </div>
    );
  }

  const statCards = dashboard ? [
    {
      label: 'Bugungi darslar',
      value: dashboard.today_total_lessons ?? '-',
      icon: <BookOpen size={22} color="var(--primary)" />,
      bg: 'rgba(99,102,241,0.1)',
    },
    {
      label: 'Yakunlangan',
      value: dashboard.completed_lessons ?? '-',
      icon: <CheckCircle size={22} color="var(--success)" />,
      bg: 'rgba(34,197,94,0.1)',
    },
    {
      label: "O'tkazib yuborilgan",
      value: dashboard.missed_lessons ?? 0,
      icon: <XCircle size={22} color="var(--danger)" />,
      bg: 'rgba(239,68,68,0.1)',
    },
    {
      label: 'Keyingi dars',
      value: dashboard.next_lesson ? `${dashboard.next_lesson.time?.slice(0, 5) || '—'}` : '—',
      sub: dashboard.next_lesson ? `${dashboard.next_lesson.subject} — ${dashboard.next_lesson.class}` : 'Yo\'q',
      icon: <Clock size={22} color="var(--warning)" />,
      bg: 'rgba(234,179,8,0.1)',
    },
  ] : [];

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Mening Statistikam</h1>
          <p className="text-muted">Shaxsiy ko'rsatkichlar va dars tarixi</p>
        </div>
        <button className="btn btn-outline" onClick={loadData}>
          <RefreshCw size={15} /> Yangilash
        </button>
      </div>

      {/* Stat cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
          {statCards.map((card, i) => (
            <div key={i} className="glass glass-hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.85rem', background: card.bg, borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.2rem' }}>{card.label}</p>
                <p style={{ fontWeight: 700, fontSize: '1.6rem', lineHeight: 1 }}>{card.value}</p>
                {card.sub && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{card.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Attendance history */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 className="heading-3" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Davomat tarixi</h3>
          {attendance.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>Ma'lumot yo'q</p>
          ) : (
            <div className="flex-col gap-2">
              {attendance.map(a => (
                <div key={a.id} className="flex-between" style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--surface-border)' }}>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{a.date}</span>
                    {a.check_in_time && (
                      <span className="text-muted" style={{ fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                        {new Date(a.check_in_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex-center gap-2">
                    {a.is_late && <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>Kechikdi</span>}
                    <span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'late' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                      {a.status_display || a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My photos */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 className="heading-3" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Mening rasmlarim</h3>
          {photos.length === 0 ? (
            <div className="flex-center flex-col gap-3" style={{ padding: '2rem 0' }}>
              <Camera size={40} color="var(--text-muted)" />
              <p className="text-muted">Hali rasm yuklanmagan</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-darker)' }}>
                  {p.photo ? (
                    <img src={api.getPhotoUrl(p.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="flex-center" style={{ height: '100%' }}>
                      <Camera size={20} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '0.3rem 0.4rem',
                    fontSize: '0.65rem',
                    color: p.status === 'accepted' ? 'var(--success)' : p.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                    fontWeight: 600,
                  }}>
                    {p.status === 'accepted' ? '✓ Qabul' : p.status === 'rejected' ? '✗ Rad' : '⏳ Kutmoqda'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
