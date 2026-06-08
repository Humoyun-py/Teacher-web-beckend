import React, { useState, useEffect } from 'react';
import {
    RefreshCcw, Search, Calendar, Clock, AlertTriangle,
    CheckCircle, ArrowLeftRight, Trash2, Edit3, Save, X, UserCheck
} from 'lucide-react';
import { api } from '../../api';

export default function SystemRestore() {
    const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'attendance'
    const [lessons, setLessons] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [editingLesson, setEditingLesson] = useState(null);
    const [editingAttendance, setEditingAttendance] = useState(null);

    useEffect(() => {
        if (activeTab === 'lessons') loadLessons();
        else loadAttendance();
    }, [activeTab]);

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

    const handleStatusChange = async (lessonId, newStatus) => {
        try {
            await api.patchLesson(lessonId, { status: newStatus });
            alert("✅ Muvaffaqiyatli o'zgartirildi");
            loadLessons();
        } catch (err) {
            alert("❌ Xatolik");
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
        } catch (err) {
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
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--surface-border)' }} className="flex-between gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            className="input-field w-full pl-10"
                            placeholder={`${activeTab === 'lessons' ? 'Dars yoki o\'qituvchi' : 'O\'qituvchi'} bo'yicha qidiruv...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={activeTab === 'lessons' ? loadLessons : loadAttendance}>
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {activeTab === 'lessons' ? (
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
