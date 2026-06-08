import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader, RefreshCw } from 'lucide-react';
import { api } from '../../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [marking, setMarking] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifs, count] = await Promise.allSettled([
        api.getNotifications(),
        api.getUnreadCount(),
      ]);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value.results || notifs.value || []);
      if (count.status === 'fulfilled') setUnread(count.value.count || count.value.unread_count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleMarkAll = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    // IT support mock count handle
    if (!unreadIds.length && unread > 0) {
      setUnread(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event('notificationsUpdated'));
      return;
    }
    if (!unreadIds.length) return;
    setMarking(true);
    try {
      await api.markAsRead(unreadIds);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnread(0);
      // Global event dispatch so DashboardLayout can update its unread badge
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setMarking(false); }
  };

  const handleMarkOne = async (id) => {
    try {
      await api.markAsRead([id]);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Bildirishnomalar</h1>
          <p className="text-muted">
            {unread > 0 ? `${unread} ta o'qilmagan xabar` : "Barcha xabarlar o'qilgan"}
          </p>
        </div>
        <div className="flex-center gap-3">
          {unread > 0 && (
            <button className="btn btn-primary" onClick={handleMarkAll} disabled={marking}>
              {marking ? <Loader size={15} className="spinner" /> : <CheckCheck size={15} />}
              Barchasini o'qilgan deb belgilash
            </button>
          )}
          <button className="btn btn-outline" onClick={loadNotifications}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: '1.5rem', flex: 1 }}>
        {loading ? (
          <div className="flex-center flex-col gap-4" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={36} color="var(--primary)" />
            <p className="text-muted">Yuklanmoqda...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-center flex-col gap-4" style={{ padding: '3rem' }}>
            <Bell size={56} color="var(--text-muted)" />
            <p className="text-muted">Hech qanday bildirishnoma yo'q</p>
          </div>
        ) : (
          <div className="flex-col gap-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className="glass-hover"
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${n.is_read ? 'var(--surface-border)' : 'var(--primary)'}`,
                  background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => !n.is_read && handleMarkOne(n.id)}
              >
                <div className="flex-between">
                  <div className="flex-col" style={{ gap: '0.2rem' }}>
                    <span style={{ fontWeight: n.is_read ? 400 : 600, fontSize: '0.95rem' }}>
                      {n.title || n.message || 'Bildirishnoma'}
                    </span>
                    {n.message && n.title && (
                      <span className="text-muted" style={{ fontSize: '0.83rem' }}>{n.message}</span>
                    )}
                  </div>
                  <div className="flex-center gap-2">
                    {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                    <span className="text-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString('uz-UZ') : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
