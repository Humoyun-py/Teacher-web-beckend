import { useState, useEffect } from 'react';
import { RefreshCcw, Search, Trash2, Edit3 } from 'lucide-react';
import { api } from '../../api';

export default function SystemRestore() {
    const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'attendance' | 'deleted'
    const [lessons, setLessons] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [deletedRecords, setDeletedRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingAttendance, setEditingAttendance] = useState(null);
    const [deletedModel, setDeletedModel] = useState('lessons');

    useEffect(() => {
        if (activeTab === 'lessons') loadLessons();
        else if (activeTab === 'attendance') loadAttendance();
        else if (activeTab === 'deleted') loadDeletedRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, deletedModel]);

    const loadLessons = async () => {
        try {
            setLoading(true);
            const data = await api.getLessons('?limit=50&ordering=-date');
            setLessons(data.results || data);
        } catch (err) {
            console.error("Darslarni yuklashda xato:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const data = await api.getAttendanceLogs('?limit=50&ordering=-date');
            setAttendance(data.results || data);
        } catch (err) {
            console.error("Davomatni yuklashda xato:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadDeletedRecords = async () => {
        try {
            setLoading(true);
            const data = await api.getDeletedRecords(deletedModel);
            setDeletedRecords(data.deleted_records || data.results || []);
        } catch (err) {
            console.error("O'chirilgan yozuvlarni yuklashda xato:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (modelName, pk) => {
        if (!window.confirm(`${modelName} #${pk} tiklashni tasdiqlaysizmi?`)) return;
        try {
            await api.restoreRecord(modelName, pk);
            alert('✅ Yozuv tiklandi');
            loadDeletedRecords();
        } catch (err) {
            alert('Xatolik: ' + JSON.stringify(err.data || err.message));
        }
    };

    const handleAttendanceUpdate = async () => {
        try {
            await api.patchAttendance(editingAttendance.id, {
                status: editingAttendance.status,
                check_in_time: editingAttendance.check_in_time
            });
            alert("✅ Davomat yangilandi");
            setEditingAttendance(null);
            loadAttendance();
        } catch (_) {
            alert("❌ Xatolik");
        }
    };

    const filteredData = (activeTab === 'lessons' ? lessons : attendance).filter(item =>
        (item.teacher_name || item.teacher?.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.subject_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in flex-col gap-6">
            <div className="flex-between">
                <div>
                    <h1 className="heading-1">Tizimni Tiklash va Tuzatish</h1>
                    <p className="text-muted">Darslar va davomat ma'lumotlarini to'g'rilash</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'lessons' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'}`}
                        onClick={() => setActiveTab('lessons')}
                    >
                        Darslar
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'attendance' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'}`}
                        onClick={() => setActiveTab('attendance')}
                    >
                        Davomat
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'deleted' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-main'}`}
                        onClick={() => setActiveTab('deleted')}
                    >
                        O'chirilganlar
                    </button>
                </div>
            </div>

                <div className="glass-panel" style={{ padding: '0' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--surface-border)' }} className="flex-between gap-4">
                    <div className="relative flex-1" style={{ display: 'flex', gap: '0.5rem' }}>
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            className="input-field w-full pl-10"
                            placeholder={`${activeTab === 'lessons' ? 'Dars yoki o\'qituvchi' : activeTab === 'attendance' ? 'O\'qituvchi' : 'Qidiruv...'} bo'yicha qidiruv...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {activeTab === 'deleted' && (
                            <select className="input-field" value={deletedModel} onChange={e => setDeletedModel(e.target.value)} style={{ width: 'auto' }}>
                                <option value="lessons">Darslar</option>
                                <option value="attendance">Davomat</option>
                                <option value="teachers">O'qituvchilar</option>
                                <option value="subjects">Fanlar</option>
                                <option value="classes">Sinflar</option>
                            </select>
                        )}
                    </div>
                    <button className="btn btn-outline" onClick={activeTab === 'lessons' ? loadLessons : activeTab === 'attendance' ? loadAttendance : loadDeletedRecords}>
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {activeTab === 'deleted' ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Model</th>
                                    <th>Nomi</th>
                                    <th>O'chirilgan vaqt</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deletedRecords.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>O'chirilgan yozuvlar topilmadi</td></tr>
                                ) : deletedRecords.map(rec => (
                                    <tr key={rec.id || rec.pk}>
                                        <td>{rec.id || rec.pk}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{rec.model || deletedModel}</td>
                                        <td style={{ fontWeight: 600 }}>{rec.name || rec.display || JSON.stringify(rec.data || rec).slice(0, 50)}</td>
                                        <td className="text-xs text-muted">{rec.deleted_at ? new Date(rec.deleted_at).toLocaleString('uz-UZ') : '—'}</td>
                                        <td>
                                            <button className="btn btn-ghost btn-sm text-success" onClick={() => handleRestore(rec.model || deletedModel, rec.id || rec.pk)}>
                                                <RefreshCcw size={14} /> Tiklash
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : activeTab === 'lessons' ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Sana</th>
                                    <th>O'qituvchi</th>
                                    <th>Fan / Sinf</th>
                                    <th>Status</th>
                                    <th>Vaqt</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(lesson => (
                                    <tr key={lesson.id}>
                                        <td>{lesson.date}</td>
                                        <td style={{ fontWeight: 600 }}>{lesson.teacher_name}</td>
                                        <td>{lesson.subject_name} <br /><span className="text-xs text-muted">{lesson.class_name}</span></td>
                                        <td>
                                            <span className={`badge badge-${lesson.status === 'completed' ? 'success' : (lesson.status === 'started' ? 'warning' : 'info')}`}>
                                                {lesson.status}
                                            </span>
                                        </td>
                                        <td className="text-xs">
                                            {lesson.start_time?.slice(0, 5)} - {lesson.end_time?.slice(0, 5)}
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="p-2 hover:text-primary transition-all" onClick={() => setEditingLesson(lesson)}><Edit3 size={16} /></button>
                                                <button className="p-2 hover:text-danger transition-all" onClick={async () => {
                                                    if (window.confirm("O'chirilsinmi?")) {
                                                        await api.deleteLesson(lesson.id);
                                                        loadLessons();
                                                    }
                                                }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Sana</th>
                                    <th>O'qituvchi</th>
                                    <th>Kelgan vaqti</th>
                                    <th>Status</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.date}</td>
                                        <td style={{ fontWeight: 600 }}>{log.teacher?.first_name} {log.teacher?.last_name}</td>
                                        <td>{log.check_in_time?.slice(0, 5) || '--:--'}</td>
                                        <td>
                                            <span className={`badge badge-${log.status === 'present' ? 'success' : (log.status === 'late' ? 'warning' : 'danger')}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingAttendance(log)}><Edit3 size={14} /> Tuzatish</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {editingLesson && (
                <div className="modal-overlay flex-center">
                    <div className="glass-panel w-full max-w-md p-6 flex-col gap-6 animate-scale-up">
                        <h2 className="heading-3">Darsni Tuzatish</h2>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select className="input-field" value={editingLesson.status} onChange={e => setEditingLesson({ ...editingLesson, status: e.target.value })}>
                                <option value="planned">Planned</option>
                                <option value="started">Started</option>
                                <option value="completed">Completed</option>
                                <option value="missed">Missed</option>
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <input type="time" className="input-field" value={editingLesson.start_time?.slice(0, 5) || ''} onChange={e => setEditingLesson({ ...editingLesson, start_time: e.target.value })} />
                            <input type="time" className="input-field" value={editingLesson.end_time?.slice(0, 5) || ''} onChange={e => setEditingLesson({ ...editingLesson, end_time: e.target.value })} />
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-outline flex-1" onClick={() => setEditingLesson(null)}>Bekor qilish</button>
                            <button className="btn btn-primary flex-1" onClick={async () => {
                                await api.patchLesson(editingLesson.id, { status: editingLesson.status, start_time: editingLesson.start_time, end_time: editingLesson.end_time });
                                setEditingLesson(null); loadLessons();
                            }}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}

            {editingAttendance && (
                <div className="modal-overlay flex-center">
                    <div className="glass-panel w-full max-w-md p-6 flex-col gap-6 animate-scale-up">
                        <h2 className="heading-3">Davomatni Tuzatish</h2>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select className="input-field" value={editingAttendance.status} onChange={e => setEditingAttendance({ ...editingAttendance, status: e.target.value })}>
                                <option value="present">Kelgan (Present)</option>
                                <option value="late">Kechikkan (Late)</option>
                                <option value="absent">Kelmagan (Absent)</option>
                                <option value="excused">Sababli (Excused)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Kelgan vaqti</label>
                            <input type="time" className="input-field" value={editingAttendance.check_in_time?.slice(0, 5) || ''} onChange={e => setEditingAttendance({ ...editingAttendance, check_in_time: e.target.value })} />
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-outline flex-1" onClick={() => setEditingAttendance(null)}>Bekor qilish</button>
                            <button className="btn btn-primary flex-1" onClick={handleAttendanceUpdate}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
