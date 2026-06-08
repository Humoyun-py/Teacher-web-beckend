import React, { useState, useEffect } from 'react';
import {
    Search, User, Play, CheckSquare, Video, QrCode,
    ShieldAlert, Calendar, Clock, ChevronRight, RefreshCcw, Command, UserCheck
} from 'lucide-react';
import { api } from '../../api';

export default function TeacherControls() {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherLessons, setTeacherLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { loadTeachers(); }, []);
    useEffect(() => {
        if (selectedTeacher) loadTeacherLessons();
        else setTeacherLessons([]);
    }, [selectedTeacher]);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const data = await api.getTeachers();
            setTeachers(data.results || data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadTeacherLessons = async () => {
        if (!selectedTeacher) return;
        try {
            setLessonsLoading(true);
            const data = await api.getLessons(`?teacher=${selectedTeacher.id}&ordering=-date`);
            setTeacherLessons(data.results || data);
        } catch (err) { console.error(err); }
        finally { setLessonsLoading(false); }
    };

    const handleStartLesson = async (lessonId) => {
        if (!window.confirm("Tanlangan o'qituvchi nomidan darsni boshlamoqchimisiz?")) return;
        try {
            await api.startLesson(lessonId);
            loadTeacherLessons();
        } catch (err) { alert("Xatolik: " + (err.data?.detail || "Ruxsat etilmadi")); }
    };

    const handleEndLesson = async (lessonId) => {
        const notes = window.prompt("Dars yakuni bo'yicha eslatma:", "");
        if (notes === null) return;
        try {
            await api.endLesson(lessonId, notes);
            loadTeacherLessons();
        } catch (err) { alert("Xatolik: " + (err.data?.detail || "Ruxsat etilmadi")); }
    };

    const filteredTeachers = teachers.filter(t =>
        (t.first_name + ' ' + t.last_name + ' ' + t.username).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), transparent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Command className="text-primary" size={36} /> Teacher Control Hub
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>O'qituvchi profillarini masofaviy boshqarish va dars monitoringi</p>
                    </div>
                    <button className="btn btn-primary" onClick={loadTeachers} style={{ height: '3.5rem', padding: '0 1.5rem' }}>
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} style={{ marginRight: '0.75rem' }} /> Tizimni Yangilash
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', flex: 1 }}>
                {/* Left: Interactive Teacher Sidebar */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: 'calc(100vh - 250px)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            className="input-field"
                            placeholder="Ism yoki username..."
                            style={{ width: '100%', paddingLeft: '3rem', height: '3.5rem', borderRadius: '1rem' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                        {filteredTeachers.map(teacher => (
                            <div
                                key={teacher.id}
                                onClick={() => setSelectedTeacher(teacher)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '1rem',
                                    background: selectedTeacher?.id === teacher.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    border: selectedTeacher?.id === teacher.id ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <div style={{ height: '44px', width: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color={selectedTeacher?.id === teacher.id ? 'white' : 'var(--text-muted)'} />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: selectedTeacher?.id === teacher.id ? 'white' : 'white' }}>{teacher.first_name} {teacher.last_name}</p>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0, color: selectedTeacher?.id === teacher.id ? 'white' : 'var(--text-muted)' }}>@{teacher.username}</p>
                                </div>
                                {selectedTeacher?.id === teacher.id && <ChevronRight size={18} color="white" style={{ marginLeft: 'auto' }} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Operations Panel */}
                <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedTeacher ? (
                        <>
                            <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div style={{ height: '70px', width: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
                                            <User size={32} color="white" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{selectedTeacher.first_name} {selectedTeacher.last_name}</h2>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>IT OVERRIDE ACTIVE</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{selectedTeacher.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="btn btn-outline" style={{ height: '3rem', padding: '0 1.25rem' }} onClick={() => api.generateStaticQR()}>
                                            <QrCode size={18} style={{ marginRight: '0.5rem' }} /> Static QR
                                        </button>
                                        <button className="btn btn-danger" style={{ height: '3rem', padding: '0 1.25rem' }} onClick={() => setSelectedTeacher(null)}>
                                            <ShieldAlert size={18} style={{ marginRight: '0.5rem' }} /> Dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Calendar size={20} className="text-primary" /> O'qituvchi Dars Jadvali
                                    </h3>
                                    <button className="btn btn-ghost" onClick={loadTeacherLessons}>
                                        <RefreshCcw size={16} className={lessonsLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {lessonsLoading ? (
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}><div className="loader"></div></div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {teacherLessons.length > 0 ? teacherLessons.slice(0, 10).map(lesson => (
                                            <div
                                                key={lesson.id}
                                                style={{
                                                    padding: '1.25rem',
                                                    borderRadius: '1.25rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                    <div style={{
                                                        height: '48px',
                                                        width: '48px',
                                                        borderRadius: '14px',
                                                        background: lesson.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : (lesson.status === 'started' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: lesson.status === 'completed' ? 'var(--success)' : (lesson.status === 'started' ? 'var(--warning)' : 'var(--primary)')
                                                    }}>
                                                        <Clock size={24} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>{lesson.subject_name} — {lesson.class_name}</p>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Calendar size={12} /> {lesson.date} <span style={{ opacity: 0.3 }}>|</span> <Clock size={12} /> {lesson.start_time || '--:--'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        background: lesson.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : (lesson.status === 'started' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)'),
                                                        color: lesson.status === 'completed' ? 'var(--success)' : (lesson.status === 'started' ? 'var(--warning)' : 'var(--text-muted)')
                                                    }}>
                                                        {lesson.status}
                                                    </span>
                                                    {lesson.status === 'planned' && (
                                                        <button className="btn btn-primary" onClick={() => handleStartLesson(lesson.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Boshlash</button>
                                                    )}
                                                    {lesson.status === 'started' && (
                                                        <button className="btn btn-success" onClick={() => handleEndLesson(lesson.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Tugatish</button>
                                                    )}
                                                    <div style={{ height: '36px', width: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} className="hover:bg-white/10">
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.3 }}>
                                                <Calendar size={64} />
                                                <p style={{ fontWeight: 600 }}>Hozircha darslar mavjud emas</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1.25rem', margin: '0 2rem 2rem 2rem', borderRadius: '1.25rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', gap: '1rem' }}>
                                <ShieldAlert className="text-warning" size={24} style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.85rem', color: 'var(--warning)', margin: 0, lineHeight: 1.5 }}>
                                    <strong>Super Admin Bildiruv:</strong> Siz hozir o'qituvchi nomidan harakat qilyapsiz. Barcha amallar (dars boshlash/tugatish) audit loglarda qayd etiladi.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', opacity: 0.5 }}>
                            <div style={{ height: '120px', width: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck size={64} style={{ opacity: 0.1 }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Boshqarish Paneli</h3>
                                <p style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>O'qituvchini tanlang va uning darslarini nazorat qilishni boshlang.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
