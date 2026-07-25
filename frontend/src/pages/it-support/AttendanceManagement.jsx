import { useState, useEffect } from 'react';
import { Activity, Search, RefreshCcw, Edit2, X, Clock } from 'lucide-react';
import { api } from '../../api';

const ATT_STATUS = {
    present: { label: 'Keldi', color: 'var(--success)', bg: 'rgba(34,197,94,0.12)' },
    absent: { label: 'Kelmadi', color: 'var(--danger)', bg: 'rgba(239,68,68,0.12)' },
    late: { label: 'Kechikdi', color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)' },
    excused: { label: 'Sababli', color: 'var(--info)', bg: 'rgba(59,130,246,0.12)' },
};

const getTimePart = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('T')) {
        const timePart = dateTimeStr.split('T')[1];
        return timePart.substring(0, 5);
    }
    if (dateTimeStr.includes(' ')) {
        const timePart = dateTimeStr.split(' ')[1];
        return timePart.substring(0, 5);
    }
    return '';
};

export default function AttendanceManagement() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    
    const [editingRecord, setEditingRecord] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [checkInTime, setCheckInTime] = useState('');
    const [checkOutTime, setCheckOutTime] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadRecords(); }, []);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const data = await api.getAttendanceLogs('?limit=100&ordering=-date');
            setRecords(data.results || data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleEditClick = (record) => {
        setEditingRecord(record);
        setNewStatus(record.status);
        setCheckInTime(getTimePart(record.check_in_time));
        setCheckOutTime(getTimePart(record.check_out_time));
        setNotes(record.notes || '');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                attendance_id: editingRecord.id,
                status: newStatus,
                notes: notes
            };

            if (checkInTime) {
                payload.check_in_time = `${editingRecord.date}T${checkInTime}:00`;
            } else {
                payload.check_in_time = null;
            }

            if (checkOutTime) {
                payload.check_out_time = `${editingRecord.date}T${checkOutTime}:00`;
            } else {
                payload.check_out_time = null;
            }

            await api.fixAttendance(payload);
            setEditingRecord(null);
            loadRecords();
        } catch (e) { alert('Xatolik: ' + (e.data?.detail || 'Ruxsat etilmadi')); }
        finally { setSaving(false); }
    };

    const filtered = records.filter(r => {
        const name = (r.teacher?.first_name || '') + ' ' + (r.teacher?.last_name || '');
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), transparent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Activity className="text-primary" size={32} /> Davomat Boshqaruvi
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>O'qituvchilarning kunlik davomati, kelish/ketish vaqtlarini tahrirlash</p>
                    </div>
                    <button className="btn btn-outline" onClick={loadRecords}><RefreshCcw size={18} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    {Object.entries(ATT_STATUS).map(([k, v]) => (
                        <div key={k} onClick={() => setFilterStatus(k)} style={{ padding: '1rem', borderRadius: '12px', background: filterStatus === k ? v.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${filterStatus === k ? v.color + '60' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: v.color, marginBottom: '4px', textTransform: 'uppercase' }}>{v.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: v.color }}>{records.filter(r => r.status === k).length}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input className="input-field" placeholder="O'qituvchi ismi..." style={{ paddingLeft: '3rem', width: '100%', height: '3rem' }} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button onClick={() => setFilterStatus('all')} className="btn btn-outline" style={{ height: '3rem' }}>Barchasi</button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '4rem', textAlign: 'center' }}><div className="loader"></div></div> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {["O'qituvchi", 'Sana', 'Kelish Vaqti', 'Ketish Vaqti', 'Status', 'Amallar'].map(h => (
                                        <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(record => {
                                    const sc = ATT_STATUS[record.status] || ATT_STATUS.absent;
                                    return (
                                        <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: sc.color }}>
                                                            {record.teacher?.first_name?.[0]}{record.teacher?.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{record.teacher?.first_name} {record.teacher?.last_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{record.date}</td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Clock size={14} />
                                                    {getTimePart(record.check_in_time) || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Clock size={14} />
                                                    {getTimePart(record.check_out_time) || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <button onClick={() => handleEditClick(record)} style={{ padding: '7px', borderRadius: '8px', border: 'none', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', cursor: 'pointer' }}>
                                                    <Edit2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editingRecord && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingRecord(null)}>
                    <div style={{ width: '460px', background: 'var(--bg-darker)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Davomatni O'zgartirish</h2>
                            <button onClick={() => setEditingRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99,102,241,0.08)' }}>
                            <p style={{ fontWeight: 700, margin: 0 }}>{editingRecord.teacher?.first_name} {editingRecord.teacher?.last_name}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Sana: {editingRecord.date}</p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Kirish Vaqti (Keldi)</label>
                                <input 
                                    type="time" 
                                    className="input-field" 
                                    style={{ width: '100%', height: '3rem' }} 
                                    value={checkInTime} 
                                    onChange={e => setCheckInTime(e.target.value)} 
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Chiqish Vaqti (Ketdi)</label>
                                <input 
                                    type="time" 
                                    className="input-field" 
                                    style={{ width: '100%', height: '3rem' }} 
                                    value={checkOutTime} 
                                    onChange={e => setCheckOutTime(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Status</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {Object.entries(ATT_STATUS).map(([k, v]) => (
                                    <button key={k} onClick={() => setNewStatus(k)} style={{ padding: '0.75rem', borderRadius: '12px', border: '2px solid', borderColor: newStatus === k ? v.color : 'rgba(255,255,255,0.05)', background: newStatus === k ? v.bg : 'rgba(255,255,255,0.02)', color: newStatus === k ? v.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Izoh / Sabab</label>
                            <textarea 
                                className="input-field" 
                                style={{ width: '100%', height: '4rem', padding: '0.75rem', resize: 'none' }} 
                                placeholder="Tuzatish sababini yozing..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1, height: '3.5rem' }} onClick={() => setEditingRecord(null)}>Bekor</button>
                            <button className="btn btn-primary" style={{ flex: 1, height: '3.5rem' }} onClick={handleSave} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
