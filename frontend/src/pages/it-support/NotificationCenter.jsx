import React, { useState, useEffect } from 'react';
import { Bell, Send, RefreshCcw, Search, Plus, X, Users, User } from 'lucide-react';
import { api } from '../../api';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [form, setForm] = useState({ title: '', message: '', target: 'all', teacher_id: '' });
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [n, t] = await Promise.all([api.getNotifications(), api.getTeachers()]);
            setNotifications(n.results || n || []);
            setTeachers(t.results || t || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSend = async () => {
        if (!form.title || !form.message) return alert("Sarlavha va xabarni kiriting");
        setSending(true);
        try {
            await api.sendNotification({ title: form.title, message: form.message, teacher_id: form.target === 'one' ? form.teacher_id : null, broadcast: form.target === 'all' });
            setShowCompose(false);
            setForm({ title: '', message: '', target: 'all', teacher_id: '' });
            loadAll();
        } catch (e) { alert("Xabar yuborishda xatolik: " + (e.data?.detail || "Ruxsat etilmadi")); }
        finally { setSending(false); }
    };

    const filtered = notifications.filter(n =>
        ((n.title || '') + ' ' + (n.message || '')).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), transparent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Bell className="text-primary" size={32} /> Bildirishnoma Markazi
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>O'qituvchilar va adminlarga xabar yuborish</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={loadAll}><RefreshCcw size={18} /></button>
                        <button className="btn btn-primary" onClick={() => setShowCompose(true)} style={{ height: '3rem', padding: '0 1.5rem' }}>
                            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Xabar Yuborish
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                    {[
                        { l: "Jami xabarlar", v: notifications.length, c: 'var(--primary)' },
                        { l: "Bugun yuborilgan", v: notifications.filter(n => n.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length, c: 'var(--success)' },
                        { l: "O'qilmagan", v: notifications.filter(n => !n.is_read).length, c: 'var(--warning)' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${s.c}` }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{s.l}</p>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: s.c, margin: 0 }}>{s.v}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input className="input-field" placeholder="Xabarlarni qidirish..." style={{ paddingLeft: '3rem', width: '100%', height: '3rem' }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="loader"></div></div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.4 }}>
                                <Bell size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                                <p>Xabarlar topilmadi</p>
                            </div>
                        ) : filtered.map(notif => (
                            <div key={notif.id} style={{ padding: '1.25rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ height: '40px', width: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Bell size={18} className="text-primary" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                        <h3 style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{notif.title}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{notif.created_at?.slice(0, 16)}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', margin: '4px 0 0 0' }}>{notif.message}</p>
                                    {notif.sender_name && <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, margin: '6px 0 0 0' }}>Yuboruvchi: {notif.sender_name}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCompose && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowCompose(false)}>
                    <div style={{ width: '480px', height: '100%', background: 'var(--bg-darker)', borderLeft: '1px solid var(--surface-border)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideInRight 0.3s ease', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Yangi Xabar</h2>
                            <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Kim uchun</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[
                                    { v: 'all', l: "Barchaga", i: <Users size={18} /> },
                                    { v: 'one', l: "Bitta O'qituvchi", i: <User size={18} /> },
                                ].map(opt => (
                                    <button key={opt.v} onClick={() => setForm({ ...form, target: opt.v })} style={{ padding: '1rem', borderRadius: '12px', border: '2px solid', borderColor: form.target === opt.v ? 'var(--primary)' : 'rgba(255,255,255,0.05)', background: form.target === opt.v ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)', color: form.target === opt.v ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {opt.i} {opt.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {form.target === 'one' && (
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>O'qituvchini Tanlang</label>
                                <select className="input-field" style={{ width: '100%', height: '3rem' }} value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                                    <option value="">Tanlang...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Sarlavha</label>
                            <input className="input-field" style={{ width: '100%', height: '3rem' }} placeholder="Xabar sarlavhasi..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Xabar</label>
                            <textarea className="input-field" style={{ width: '100%', minHeight: '180px', resize: 'vertical', padding: '1rem' }} placeholder="Xabar matni..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                        </div>

                        <button className="btn btn-primary" style={{ height: '3.5rem', width: '100%', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} onClick={handleSend} disabled={sending}>
                            <Send size={18} /> {sending ? "Yuborilmoqda..." : "Xabar Yuborish"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
