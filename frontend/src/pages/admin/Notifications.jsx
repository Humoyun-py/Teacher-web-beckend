import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader, RefreshCw, X } from 'lucide-react';
import { api } from '../../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [marking, setMarking] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', message: '', recipient_type: 'all', recipient_ids: [] });
  const [sending, setSending] = useState(false);

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

  const handleSendNotification = async () => {
    if (!sendForm.title || !sendForm.message) return alert('Sarlavha va xabar matnini kiriting');
    setSending(true);
    try {
      await api.sendNotification(sendForm);
      alert('✅ Xabar yuborildi');
      setShowSendForm(false);
      setSendForm({ title: '', message: '', recipient_type: 'all', recipient_ids: [] });
      loadNotifications();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setSending(false); }
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
          <button className="btn btn-primary" onClick={() => setShowSendForm(true)}>
            📤 Yuborish
          </button>
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

      {/* Send Notification Modal */}
      {showSendForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">Yangi Xabar Yuborish</h2>
              <button onClick={() => setShowSendForm(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-col gap-3">
              <input type="text" className="input-field" placeholder="Sarlavha..." value={sendForm.title} onChange={e => setSendForm({ ...sendForm, title: e.target.value })} />
              <textarea className="input-field" placeholder="Xabar matni..." value={sendForm.message} onChange={e => setSendForm({ ...sendForm, message: e.target.value })} style={{ minHeight: '100px', resize: 'vertical' }} />
              <select className="input-field" value={sendForm.recipient_type} onChange={e => setSendForm({ ...sendForm, recipient_type: e.target.value })}>
                <option value="all">Barcha foydalanuvchilar</option>
                <option value="teachers">Faqat o'qituvchilar</option>
                <option value="admins">Faqat adminlar</option>
              </select>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSendNotification} disabled={sending}>
                {sending ? <Loader size={15} className="spinner" /> : '📤 Yuborish'}
              </button>
            </div>
          </div>
        </div>
      )}

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
