import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Lock, Trash2, Edit, CheckCircle, XCircle, X, RefreshCcw, Key } from 'lucide-react';
import { api } from '../../api';

export default function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', username: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [resetPassModal, setResetPassModal] = useState(null); // admin object
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => { loadAdmins(); }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const data = await api.getAdmins();
            setAdmins(data.results || data || []);
        } catch (err) {
            console.error("Adminlarni yuklashda xato:", err);
            // Fallback: try getUsers with admin filter
            try {
                const data = await api.getUsers('?role=admin');
                setAdmins(data.results || data || []);
            } catch (e) { console.error(e); }
        }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!form.username || !form.password) return alert("Username va parolni kiriting");
        setSaving(true);
        try {
            await api.createAdmin(form);
            setShowAddModal(false);
            setForm({ first_name: '', last_name: '', username: '', password: '' });
            loadAdmins();
        } catch (e) {
            alert("Xatolik: " + (e.data?.detail || JSON.stringify(e.data) || "Noma'lum"));
        }
        finally { setSaving(false); }
    };

    const handleToggleBlock = async (admin) => {
        if (!window.confirm(`${admin.first_name || admin.username} ni ${admin.is_active ? 'bloklash' : 'blokdan chiqarish'}ni tasdiqlaysizmi?`)) return;
        try {
            await api.updateUser(admin.id, { is_active: !admin.is_active });
            loadAdmins();
        } catch (e) { alert('Xatolik: ' + (e.data?.detail || "Noma'lum")); }
    };

    const handleDelete = async (admin) => {
        if (!window.confirm(`${admin.first_name || admin.username} ni o'chirmoqchimisiz? Bu qaytarilmaydi!`)) return;
        try {
            await api.deleteUser(admin.id);
            loadAdmins();
        } catch (e) { alert('O\'chirishda xatolik'); }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) return alert("Parol kamida 6 ta belgi bo'lishi kerak");
        try {
            await api.resetUserPassword(resetPassModal.id, newPassword);
            alert("✅ Parol muvaffaqiyatli o'zgartirildi");
            setResetPassModal(null);
            setNewPassword('');
        } catch (e) { alert("Xatolik: " + (e.data?.detail || "Ruxsat etilmadi")); }
    };

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="loader"></div></div>;

    return (
        <div className="animate-fade-in flex-col gap-6">
            <div className="flex-between">
                <div>
                    <h1 className="heading-1">Admin Management</h1>
                    <p className="text-muted">Tizim adminlarini boshqarish, huquqlarini belgilash va bloklash</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={loadAdmins}><RefreshCcw size={18} /></button>
                    <button className="btn btn-primary gap-2" onClick={() => setShowAddModal(true)}>
                        <UserPlus size={18} /> Yangi Admin Qo'shish
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {admins.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1/-1' }}>
                        <Shield size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p className="text-muted">Hali admin topilmadi</p>
                    </div>
                ) : admins.map(admin => (
                    <div key={admin.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Shield size={24} />
                            </div>
                            <span className={`badge badge-${admin.is_active !== false ? 'success' : 'danger'}`}>
                                {admin.is_active !== false ? 'Faol' : 'Bloklangan'}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                                {admin.first_name} {admin.last_name}
                            </h3>
                            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>@{admin.username}</p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span className="text-muted">Oxirgi kirish:</span>
                                <span>{admin.last_login ? new Date(admin.last_login).toLocaleDateString('uz-UZ') : '—'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                                onClick={() => { setResetPassModal(admin); setNewPassword(''); }}>
                                <Key size={16} /> Parol
                            </button>
                            <button className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', color: admin.is_active !== false ? 'var(--danger)' : 'var(--success)' }}
                                onClick={() => handleToggleBlock(admin)}>
                                {admin.is_active !== false ? <Lock size={16} /> : <CheckCircle size={16} />}
                                {admin.is_active !== false ? 'Bloklash' : 'Ochish'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '0.5rem' }}
                                onClick={() => handleDelete(admin)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
                    <div style={{ width: '440px', background: 'var(--bg-darker)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Yangi Admin</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>
                        {[
                            { l: 'Ism', k: 'first_name' },
                            { l: 'Familiya', k: 'last_name' },
                            { l: 'Username', k: 'username' },
                        ].map(f => (
                            <div key={f.k}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{f.l}</label>
                                <input className="input-field" style={{ width: '100%', height: '3rem' }} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} />
                            </div>
                        ))}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Parol</label>
                            <input className="input-field" type="password" style={{ width: '100%', height: '3rem' }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <button className="btn btn-primary" style={{ height: '3.5rem', width: '100%', fontWeight: 800 }} onClick={handleAdd} disabled={saving}>
                            {saving ? 'Saqlanmoqda...' : 'Admin Yaratish'}
                        </button>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPassModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setResetPassModal(null)}>
                    <div style={{ width: '420px', background: 'var(--bg-darker)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Parolni O'zgartirish</h2>
                        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <p style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>⚠️ {resetPassModal.first_name || resetPassModal.username} uchun yangi parol belgilanadi</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Yangi Parol</label>
                            <input className="input-field" type="password" placeholder="Kamida 6 ta belgi" style={{ width: '100%', height: '3rem' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1, height: '3.5rem' }} onClick={() => setResetPassModal(null)}>Bekor</button>
                            <button className="btn btn-primary" style={{ flex: 1, height: '3.5rem' }} onClick={handleResetPassword}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
