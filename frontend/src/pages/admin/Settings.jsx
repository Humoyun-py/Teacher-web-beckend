import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Edit2, RefreshCw, X, HelpCircle } from 'lucide-react';
import { api } from '../../api';

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [form, setForm] = useState({ key: '', value: '', description: '', category: 'general', is_active: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Rolni aniqlash
        try {
            const u = localStorage.getItem('user');
            if (u) {
                const parsed = JSON.parse(u);
                setUserRole(String(parsed.role || '').trim().toLowerCase().replace(/[\s-]+/g, '_'));
            }
        } catch (e) {
            console.error(e);
        }
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await api.getSystemSettings();
            setSettings(data.results || data || []);
        } catch (err) {
            console.error("Sozlamalarni yuklashda xatolik:", err);
        } finally {
            setLoading(false);
        }
    };

    const isITSupport = userRole === 'it_support' || userRole === 'superadmin';

    const handleSave = async () => {
        if (!form.key || !form.value) return alert("Kalit va qiymat maydonlarini kiriting");
        setSaving(true);
        try {
            if (editingSetting) {
                await api.updateSystemSetting(editingSetting.key, form);
                alert("✅ Sozlama muvaffaqiyatli yangilandi");
            } else {
                await api.createSystemSetting(form);
                alert("✅ Yangi sozlama qo'shildi");
            }
            setShowModal(false);
            setEditingSetting(null);
            setForm({ key: '', value: '', description: '', category: 'general', is_active: true });
            loadSettings();
        } catch (e) {
            alert("Xatolik: " + (e.data?.detail || JSON.stringify(e.data) || "Noma'lum"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (key) => {
        if (!window.confirm(`"${key}" sozlamasini o'chirishni xohlaysizmi?`)) return;
        try {
            await api.deleteSystemSetting(key);
            alert("✅ Sozlama o'chirildi");
            loadSettings();
        } catch (e) {
            alert("Xatolik: " + (e.data?.detail || "Xatolik"));
        }
    };

    const openEdit = (setting) => {
        setEditingSetting(setting);
        setForm({
            key: setting.key,
            value: setting.value,
            description: setting.description || '',
            category: setting.category || 'general',
            is_active: setting.is_active !== false
        });
        setShowModal(true);
    };

    const getCategoryBadge = (category) => {
        const badges = {
            general: { label: 'Umumiy', color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)' },
            attendance: { label: 'Davomat', color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
            kpi: { label: 'KPI', color: 'var(--warning)', bg: 'rgba(234,179,8,0.1)' },
            salary: { label: 'Maosh', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
        };
        const current = badges[category] || badges.general;
        return (
            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: current.color, background: current.bg, textTransform: 'uppercase' }}>
                {current.label}
            </span>
        );
    };

    return (
        <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div className="flex-between">
                <div>
                    <h1 className="heading-2">Tizim Sozlamalari (Configuration)</h1>
                    <p className="text-muted">Maktab logikasi, KPI parametrlari, geo-lokatsiya va maosh sozlamalari</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={loadSettings}>
                        <RefreshCw size={16} />
                    </button>
                    {isITSupport && (
                        <button className="btn btn-primary" onClick={() => { setEditingSetting(null); setForm({ key: '', value: '', description: '', category: 'general', is_active: true }); setShowModal(true); }}>
                            <Plus size={16} style={{ marginRight: '0.25rem' }} /> Yangi Sozlama
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}><div className="loader"></div></div>
            ) : (
                <div className="glass flex-col" style={{ padding: '2rem', gap: '1.5rem' }}>
                    {!isITSupport && (
                        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Shield className="text-primary" size={20} />
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: 0, fontWeight: 600 }}>
                                Siz sozlamalarni faqat ko'rish rejimidasiz. O'zgartirish kiritish faqat IT Support uchun ruxsat etilgan.
                            </p>
                        </div>
                    )}

                    {settings.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                            <HelpCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                            <p className="text-muted">Hozircha tizim sozlamalari topilmadi.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {settings.map((setting) => (
                                <div key={setting.id} className="glass-panel" style={{ padding: '1.25rem', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="flex-between">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'white', fontSize: '1rem' }}>{setting.key}</span>
                                            {getCategoryBadge(setting.category)}
                                            {setting.is_active === false && (
                                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontWeight: 700 }}>noactive</span>
                                            )}
                                        </div>
                                        {isITSupport && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openEdit(setting)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }} title="Tahrirlash">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(setting.key)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }} title="O'chirish">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                                        <div>
                                            {setting.description && (
                                                <p className="text-muted" style={{ fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>{setting.description}</p>
                                            )}
                                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{setting.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay flex-center" style={{ backdropFilter: 'blur(10px)', zIndex: 1000 }} onClick={() => setShowModal(false)}>
                    <div className="glass-panel p-8 w-full max-w-lg flex-col gap-6 animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="flex-between">
                            <h2 className="heading-3 m-0">{editingSetting ? "Sozlamani Tahrirlash" : "Yangi Tizim Sozlamasi"}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Sozlama Kaliti (Key)</label>
                                <input className="input-field" placeholder="Masalan: MIN_LATE_MINUTES" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} disabled={!!editingSetting} style={{ fontFamily: 'monospace' }} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Qiymat (Value)</label>
                                <textarea className="input-field" placeholder="Masalan: 15 yoki Prezident Maktabi" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} style={{ minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Kategoriya</label>
                                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="general">Umumiy sozlamalar</option>
                                    <option value="attendance">Davomat sozlamalari</option>
                                    <option value="kpi">KPI sozlamalari</option>
                                    <option value="salary">Maosh sozlamalari</option>
                                </select>
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Tavsif (Description)</label>
                                <input className="input-field" placeholder="Ushbu sozlama nima vazifa bajarishini yozing..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                <span style={{ fontWeight: 600 }}>Faol (Active)</span>
                            </label>
                        </div>
                        <button className="btn btn-primary w-full h-14" onClick={handleSave} disabled={saving}>
                            {saving ? "Saqlanmoqda..." : "Saqlash"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
