import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Lock, Unlock, BookOpen, RefreshCcw, X, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../api';

export default function TeacherManagement() {
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerMode, setDrawerMode] = useState('add'); // 'add' | 'edit' | 'password' | 'assign'
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', username: '', phone: '', employee_id: '',
        password: '', password2: '', is_active: true, subject_ids: [], class_ids: []
    });
    const [saving, setSaving] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [t, s, c] = await Promise.all([api.getTeachers(), api.getSubjects(), api.getClasses()]);
            setTeachers(t.results || t || []);
            setSubjects(s.results || s || []);
            setClasses(c.results || c || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openDrawer = (mode, teacher = null) => {
        setDrawerMode(mode);
        setSelectedTeacher(teacher);
        if (mode === 'edit' && teacher) {
            setFormData({ first_name: teacher.first_name, last_name: teacher.last_name, username: teacher.username, phone: teacher.phone || '', employee_id: teacher.employee_id || '', password: '', password2: '', is_active: teacher.is_active, subject_ids: [], class_ids: [] });
        } else if (mode === 'add') {
            setFormData({ first_name: '', last_name: '', username: '', phone: '', employee_id: '', password: '', password2: '', is_active: true, subject_ids: [], class_ids: [] });
        } else if (mode === 'assign' && teacher) {
            setFormData({ ...formData, subject_ids: teacher.subjects?.map(s => s.id) || [], class_ids: teacher.classes?.map(c => c.id) || [] });
        }
        setShowDrawer(true);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (drawerMode === 'add') {
                const teacherData = { first_name: formData.first_name, last_name: formData.last_name, username: formData.username, password: formData.password, is_active: formData.is_active };
                if (formData.employee_id) teacherData.employee_id = formData.employee_id;
                if (formData.phone) teacherData.phone = formData.phone;
                await api.createTeacher(teacherData);
                await loadAll();
                setShowDrawer(false);
                alert('✅ O\'qituvchi muvaffaqiyatli yaratildi!');
            } else if (drawerMode === 'edit') {
                await api.updateTeacher(selectedTeacher.id, { first_name: formData.first_name, last_name: formData.last_name, username: formData.username, is_active: formData.is_active });
                await loadAll();
                setShowDrawer(false);
                alert('✅ O\'qituvchi ma\'lumotlari yangilandi!');
            } else if (drawerMode === 'password') {
                await api.patchTeacher(selectedTeacher.id, { password: formData.password });
                setShowDrawer(false);
                alert('✅ Parol muvaffaqiyatli o\'zgartirildi!');
            } else if (drawerMode === 'assign') {
                await Promise.all([
                    formData.subject_ids.length > 0 && api.assignSubjectsToTeacher(selectedTeacher.id, formData.subject_ids),
                    formData.class_ids.length > 0 && api.assignClassesToTeacher(selectedTeacher.id, formData.class_ids)
                ]);
                await loadAll();
                setShowDrawer(false);
                alert('✅ Fan va sinflar biriktirildi!');
            }
        } catch (e) {
            console.error('Xatolik:', e);
            if (e?.status === 500) {
                alert("❌ Tizimda xatolik yuz berdi. Bu login yoki ID avval foydalanilgan bo'lishi mumkin. Boshqa ma'lumot kiritib ko'ring.");
            } else {
                alert('❌ Xatolik: ' + (e.data?.detail || JSON.stringify(e.data) || 'Noma\'lum xato'));
            }
        }
        finally { setSaving(false); }
    };

    const handleToggleBlock = async (teacher) => {
        if (!window.confirm(`${teacher.first_name} ni ${teacher.is_active ? 'bloklash' : 'blokdan chiqarish'}ni tasdiqlaysizmi?`)) return;
        try {
            await api.patchTeacher(teacher.id, { is_active: !teacher.is_active });
            loadAll();
        } catch (_) { alert('Xatolik'); }
    };

    const handleDelete = async (teacher) => {
        if (!window.confirm(`${teacher.first_name} ${teacher.last_name} ni o'CHIRMOQCHIMISIZ? Bu amalni qaytarib bo'lmaydi!`)) return;
        try { await api.deleteTeacher(teacher.id); loadAll(); }
        catch (_) { alert('O\'chirishda xatolik'); }
    };

    const filtered = teachers.filter(t => {
        const matchSearch = (t.first_name + ' ' + t.last_name + ' ' + t.username).toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? t.is_active : !t.is_active);
        return matchSearch && matchStatus;
    });

    const drawerTitle = { add: 'Yangi O\'qituvchi', edit: 'O\'qituvchini Tahrirlash', password: 'Parolni Almashtirish', assign: 'Fan va Sinf Biriktirish' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), transparent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users className="text-primary" size={32} /> O'qituvchilar Boshqaruvi
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Barcha o'qituvchilarni to'liq nazorat qilish va boshqarish</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={loadAll}><RefreshCcw size={18} /></button>
                        <button className="btn btn-primary" onClick={() => openDrawer('add')} style={{ height: '3rem', padding: '0 1.5rem' }}>
                            <Plus size={18} style={{ marginRight: '0.5rem' }} /> O'qituvchi Qo'shish
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input className="input-field" placeholder="Ism, familiya yoki username..." style={{ paddingLeft: '3rem', width: '100%', height: '3rem' }} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {['all', 'active', 'inactive'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '0 1.25rem', height: '3rem', borderRadius: '12px', border: '1px solid', borderColor: filterStatus === s ? 'var(--primary)' : 'var(--surface-border)', background: filterStatus === s ? 'rgba(99,102,241,0.15)' : 'transparent', color: filterStatus === s ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                            {s === 'all' ? 'Barchasi' : s === 'active' ? '✓ Faol' : '✗ Bloklangan'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                    { l: 'Jami', v: teachers.length, c: 'var(--primary)' },
                    { l: 'Faol', v: teachers.filter(t => t.is_active).length, c: 'var(--success)' },
                    { l: 'Bloklangan', v: teachers.filter(t => !t.is_active).length, c: 'var(--danger)' },
                    { l: 'Bugun Kelgan', v: Math.floor(teachers.filter(t => t.is_active).length * 0.8), c: 'var(--info)' },
                ].map((s, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${s.c}` }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{s.l}</p>
                        <p style={{ fontSize: '2rem', fontWeight: 900, color: s.c, margin: 0 }}>{s.v}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '4rem', textAlign: 'center' }}><div className="loader"></div></div> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {['O\'qituvchi', 'Username', 'Status', 'Fanlar', 'Amallar'].map(h => (
                                        <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(teacher => (
                                    <React.Fragment key={teacher.id}>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ height: '40px', width: '40px', borderRadius: '50%', background: teacher.is_active ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: teacher.is_active ? 'var(--primary)' : 'var(--danger)' }}>
                                                            {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{teacher.first_name} {teacher.last_name}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>ID: {teacher.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{teacher.username}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, background: teacher.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: teacher.is_active ? 'var(--success)' : 'var(--danger)' }}>
                                                    {teacher.is_active ? '● Faol' : '● Bloklangan'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                                                    {teacher.subjects?.slice(0, 2).map(s => <span key={s.id} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600 }}>{s.name}</span>)}
                                                    {(teacher.subjects?.length || 0) > 2 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{teacher.subjects.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button title="Tahrirlash" onClick={() => openDrawer('edit', teacher)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}><Edit2 size={15} /></button>
                                                    <button title="Parol" onClick={() => openDrawer('password', teacher)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', cursor: 'pointer', display: 'flex' }}><Key size={15} /></button>
                                                    <button title="Fan/Sinf" onClick={() => openDrawer('assign', teacher)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', cursor: 'pointer', display: 'flex' }}><BookOpen size={15} /></button>
                                                    <button title={teacher.is_active ? 'Bloklash' : 'Ochish'} onClick={() => handleToggleBlock(teacher)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: teacher.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: teacher.is_active ? 'var(--danger)' : 'var(--success)', cursor: 'pointer', display: 'flex' }}>
                                                        {teacher.is_active ? <Lock size={15} /> : <Unlock size={15} />}
                                                    </button>
                                                    <button title="O'chirish" onClick={() => handleDelete(teacher)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                                                    <button onClick={() => setExpandedRow(expandedRow === teacher.id ? null : teacher.id)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                                        {expandedRow === teacher.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === teacher.id && (
                                            <tr style={{ background: 'rgba(99,102,241,0.03)' }}>
                                                <td colSpan={5} style={{ padding: '1.5rem 2rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                                        <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>TELEFON</p><p style={{ fontWeight: 600 }}>{teacher.phone || '—'}</p></div>
                                                        <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>SINFLAR</p><p style={{ fontWeight: 600 }}>{teacher.classes?.map(c => c.name).join(', ') || '—'}</p></div>
                                                        <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>FANLAR</p><p style={{ fontWeight: 600 }}>{teacher.subjects?.map(s => s.name).join(', ') || '—'}</p></div>
                                                        <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>QOSHILGAN</p><p style={{ fontWeight: 600 }}>{teacher.created_at?.slice(0, 10) || '—'}</p></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Side Drawer */}
            {showDrawer && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowDrawer(false)}>
                    <div style={{ width: '480px', height: '100%', background: 'var(--bg-darker)', borderLeft: '1px solid var(--surface-border)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideInRight 0.3s ease', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{drawerTitle[drawerMode]}</h2>
                            <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}><X size={24} /></button>
                        </div>

                        {selectedTeacher && drawerMode !== 'add' && (
                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ height: '48px', width: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontWeight: 800, color: 'white' }}>{selectedTeacher.first_name?.[0]}{selectedTeacher.last_name?.[0]}</span>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, margin: 0 }}>{selectedTeacher.first_name} {selectedTeacher.last_name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>@{selectedTeacher.username}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                            {(drawerMode === 'add' || drawerMode === 'edit') && (<>
                                {[{ l: 'Ism', k: 'first_name', t: 'text' }, { l: 'Familiya', k: 'last_name', t: 'text' }, { l: 'Username', k: 'username', t: 'text' }, { l: 'Telefon', k: 'phone', t: 'tel' }, { l: 'Xodim ID (ixtiyoriy)', k: 'employee_id', t: 'text', placeholder: 'Avtomatik generatsiya qilinadi' }].map(f => (
                                    <div key={f.k}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{f.l}</label>
                                        <input className="input-field" type={f.t} placeholder={f.placeholder || ''} style={{ width: '100%', height: '3.25rem' }} value={formData[f.k]} onChange={e => setFormData({ ...formData, [f.k]: e.target.value })} />
                                    </div>
                                ))}
                                {drawerMode === 'add' && (
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Boshlang'ich Parol</label>
                                        <input className="input-field" type="password" style={{ width: '100%', height: '3.25rem' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                )}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                    <span style={{ fontWeight: 600 }}>Faol holat</span>
                                </label>
                            </>)}

                            {drawerMode === 'password' && (<>
                                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <p style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>⚠️ O'qituvchi kiri uchun yangi parol belgilashingiz mumkin. Eski parol bekor bo'ladi.</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Yangi Parol</label>
                                    <input className="input-field" type="password" placeholder="Kamida 6 ta belgi" style={{ width: '100%', height: '3.25rem' }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                            </>)}

                            {drawerMode === 'assign' && (<>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Fanlar</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {subjects.map(s => {
                                            const selected = formData.subject_ids.includes(s.id);
                                            return <button key={s.id} onClick={() => setFormData({ ...formData, subject_ids: selected ? formData.subject_ids.filter(id => id !== s.id) : [...formData.subject_ids, s.id] })} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid', borderColor: selected ? 'var(--primary)' : 'var(--surface-border)', background: selected ? 'rgba(99,102,241,0.15)' : 'transparent', color: selected ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>{s.name}</button>;
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Sinflar</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {classes.map(c => {
                                            const selected = formData.class_ids.includes(c.id);
                                            return <button key={c.id} onClick={() => setFormData({ ...formData, class_ids: selected ? formData.class_ids.filter(id => id !== c.id) : [...formData.class_ids, c.id] })} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid', borderColor: selected ? 'var(--success)' : 'var(--surface-border)', background: selected ? 'rgba(34,197,94,0.12)' : 'transparent', color: selected ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>{c.name}</button>;
                                        })}
                                    </div>
                                </div>
                            </>)}
                        </div>

                        <button className="btn btn-primary" style={{ height: '3.5rem', width: '100%', fontSize: '1rem', fontWeight: 800 }} onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
