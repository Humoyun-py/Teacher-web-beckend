import { useState, useEffect } from 'react';
import { BookOpen, RefreshCcw, Search, Play, Check, X, Edit2 } from 'lucide-react';
import { api } from '../../api';

const STATUS_COLORS = {
    planned: { bg: 'rgba(99,102,241,0.12)', color: 'var(--primary)', label: 'Rejalashtirilgan' },
    started: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', label: 'Boshlangan' },
    completed: { bg: 'rgba(34,197,94,0.12)', color: 'var(--success)', label: 'Yakunlangan' },
    missed: { bg: 'rgba(239,68,68,0.12)', color: 'var(--danger)', label: "O'tilmagan" },
};

export default function LessonManagement() {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [editingLesson, setEditingLesson] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadLessons(); }, []);

    const loadLessons = async () => {
        setLoading(true);
        try {
            const data = await api.getLessons('?ordering=-date&limit=100');
            setLessons(data.results || data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openEdit = (lesson) => {
        setEditingLesson(lesson);
        setEditForm({ status: lesson.status, start_time: lesson.start_time || '', end_time: lesson.end_time || '', date: lesson.date || '' });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patchLesson(editingLesson.id, editForm);
            setEditingLesson(null);
            loadLessons();
        } catch (e) { alert('Xatolik: ' + (e.data?.detail || "Noma'lum")); }
        finally { setSaving(false); }
    };

    const quickAction = async (lesson, action) => {
        try {
            if (action === 'start') await api.startLesson(lesson.id);
            else if (action === 'end') await api.endLesson(lesson.id, '');
            else await api.patchLesson(lesson.id, { status: action });
            loadLessons();
        } catch (e) { alert('Xatolik: ' + (e.data?.detail || 'Ruxsat etilmadi')); }
    };

    const filtered = lessons.filter(l => {
        const matchSearch = ((l.subject_name || '') + ' ' + (l.class_name || '') + ' ' + (l.teacher_name || '')).toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || l.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), transparent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BookOpen className="text-primary" size={32} /> Darslar Monitori
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Barcha darslarni tiklash, tahrirlash va boshqarish</p>
                    </div>
                    <button className="btn btn-outline" onClick={loadLessons}><RefreshCcw size={18} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    {Object.entries(STATUS_COLORS).map(([k, v]) => (
                        <div key={k} onClick={() => setFilterStatus(k)} style={{ padding: '1rem', borderRadius: '12px', background: v.bg, border: `1px solid ${v.color}40`, cursor: 'pointer' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: v.color, marginBottom: '4px', textTransform: 'uppercase' }}>{v.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: v.color }}>{lessons.filter(l => l.status === k).length}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input className="input-field" placeholder="Fan, sinf, o'qituvchi..." style={{ paddingLeft: '3rem', width: '100%', height: '3rem' }} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['all', 'planned', 'started', 'completed', 'missed'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '0 1rem', height: '3rem', borderRadius: '10px', border: '1px solid', borderColor: filterStatus === s ? (STATUS_COLORS[s]?.color || 'var(--primary)') : 'var(--surface-border)', background: filterStatus === s ? (STATUS_COLORS[s]?.bg || 'rgba(99,102,241,0.12)') : 'transparent', color: filterStatus === s ? (STATUS_COLORS[s]?.color || 'var(--primary)') : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
                                {s === 'all' ? 'Barchasi' : STATUS_COLORS[s]?.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '4rem', textAlign: 'center' }}><div className="loader"></div></div> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {["Fan / Sinf", "O'qituvchi", 'Sana', 'Vaqt', 'Status', 'Amallar'].map(h => (
                                        <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(lesson => {
                                    const sc = STATUS_COLORS[lesson.status] || STATUS_COLORS.planned;
                                    return (
                                        <tr key={lesson.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <p style={{ fontWeight: 700, margin: 0 }}>{lesson.subject_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{lesson.class_name}</p>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{lesson.teacher_name}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>{lesson.date}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {lesson.start_time || '--:--'} → {lesson.end_time || '--:--'}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button title="Tahrirlash" onClick={() => openEdit(lesson)} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                    {lesson.status === 'planned' && <button title="Boshlash" onClick={() => quickAction(lesson, 'start')} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', cursor: 'pointer' }}><Play size={14} /></button>}
                                                    {lesson.status === 'started' && <button title="Yakunlash" onClick={() => quickAction(lesson, 'end')} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', cursor: 'pointer' }}><Check size={14} /></button>}
                                                    {lesson.status === 'missed' && <button title="Tiklash" onClick={() => quickAction(lesson, 'planned')} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer' }}><RefreshCcw size={14} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editingLesson && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingLesson(null)}>
                    <div style={{ width: '460px', background: 'var(--bg-darker)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Darsni Tahrirlash</h2>
                            <button onClick={() => setEditingLesson(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99,102,241,0.08)' }}>
                            <p style={{ fontWeight: 700, margin: 0 }}>{editingLesson.subject_name} — {editingLesson.class_name}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{editingLesson.teacher_name}</p>
                        </div>
                        {[
                            { l: 'Status', k: 'status', type: 'select', opts: ['planned', 'started', 'completed', 'missed'] },
                            { l: 'Sana', k: 'date', type: 'date' },
                            { l: 'Boshlanish', k: 'start_time', type: 'time' },
                            { l: 'Tugash', k: 'end_time', type: 'time' },
                        ].map(f => (
                            <div key={f.k}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{f.l}</label>
                                {f.type === 'select' ? (
                                    <select className="input-field" style={{ width: '100%', height: '3rem' }} value={editForm[f.k]} onChange={e => setEditForm({ ...editForm, [f.k]: e.target.value })}>
                                        {f.opts.map(o => <option key={o} value={o}>{STATUS_COLORS[o]?.label || o}</option>)}
                                    </select>
                                ) : (
                                    <input className="input-field" type={f.type} style={{ width: '100%', height: '3rem' }} value={editForm[f.k]} onChange={e => setEditForm({ ...editForm, [f.k]: e.target.value })} />
                                )}
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1, height: '3.5rem' }} onClick={() => setEditingLesson(null)}>Bekor</button>
                            <button className="btn btn-primary" style={{ flex: 1, height: '3.5rem' }} onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
