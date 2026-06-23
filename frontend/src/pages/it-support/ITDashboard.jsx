import React, { useState, useEffect } from 'react';
import {
    Users, Calendar, CheckCircle, XCircle, Clock, Video,
    Activity, TrendingUp, Filter, Download, Shield, Zap,
    Database, Server, Globe, Bell, BookOpen, Search, Layers, Layout, ChevronRight
} from 'lucide-react';
import { api } from '../../api';

export default function ITDashboard() {
    const [stats, setStats] = useState({
        total_teachers: 0, present_today: 0, absent_today: 0, late_today: 0,
        total_lessons: 0, completed_lessons: 0, missed_lessons: 0,
        videos_sent: 0, videos_pending: 0, active_teachers: 0, total_classes: 0, total_subjects: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const [dashRes, classesRes, subjectsRes] = await Promise.allSettled([
                api.getAdminDashboard(),
                api.getClasses(),
                api.getSubjects(),
            ]);
            const d = dashRes.status === 'fulfilled' ? dashRes.value : {};
            const classes = classesRes.status === 'fulfilled' ? classesRes.value : {};
            const subjects = subjectsRes.status === 'fulfilled' ? subjectsRes.value : {};
            setStats({
                total_teachers: d.teachers?.total || 0,
                present_today: d.teachers?.present || 0,
                absent_today: d.teachers?.absent || 0,
                late_today: d.teachers?.late || 0,
                total_lessons: d.lessons?.total || 0,
                completed_lessons: d.lessons?.completed || 0,
                missed_lessons: d.lessons?.missed || 0,
                videos_sent: d.photos?.accepted || 0,
                videos_pending: d.photos?.pending || 0,
                active_teachers: d.teachers?.total || 0,
                total_classes: classes.results?.length || (Array.isArray(classes) ? classes.length : 0),
                total_subjects: subjects.results?.length || (Array.isArray(subjects) ? subjects.length : 0)
            });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const GlobalStatCard = ({ title, value, icon, color, bg }) => (
        <div className="glass-panel relative overflow-hidden" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}`, flex: 1 }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, transform: 'rotate(-15deg)' }}>
                {React.cloneElement(icon, { size: 80 })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '12px', background: bg, color: color, display: 'flex' }}>
                    {icon}
                </div>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{title}</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{value}</p>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="loader"></div></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            {/* Header Banner */}
            <div className="glass-panel" style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(124, 58, 237, 0.12))',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield className="text-primary" size={32} />
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Maktab Boshqaruv Markazi</h1>
                        </div>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Butun maktab infratuzilmasi va akademik jarayonlarni to'liq nazorat qilish</p>
                    </div>
                    <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            className="input-field"
                            placeholder="Qidiruv (o'qituvchi, sinf, fan)..."
                            style={{ width: '100%', paddingLeft: '3rem', height: '3.5rem', borderRadius: '1rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Top Stats - Yonma-yon 4 ta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <GlobalStatCard title="Jami Ustozlar" value={stats.total_teachers} icon={<Users size={24} />} color="#6366f1" bg="rgba(99, 102, 241, 0.12)" />
                <GlobalStatCard title="Mavjud Sinflar" value={stats.total_classes} icon={<Layers size={24} />} color="#ec4899" bg="rgba(236, 72, 153, 0.12)" />
                <GlobalStatCard title="O'tiladigan Fanlar" value={stats.total_subjects} icon={<BookOpen size={24} />} color="#8b5cf6" bg="rgba(139, 92, 246, 0.12)" />
                <GlobalStatCard title="Davomat (Bugun)" value={`${Math.round((stats.present_today / stats.total_teachers) * 100 || 0)}%`} icon={<Activity size={24} />} color="#22c55e" bg="rgba(34, 197, 94, 0.12)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Academic Monitoring */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="flex-between">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Layout size={20} className="text-primary" /> Akademik Monitoring
                        </h2>
                        <span className="badge badge-success">Bugun: {new Date().toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                            { label: "O'tilgan Darslar", val: `${stats.completed_lessons}/${stats.total_lessons}`, p: (stats.completed_lessons / stats.total_lessons) * 100, c: 'var(--success)' },
                            { label: "Video Proof", val: `${Math.round((stats.videos_sent / stats.completed_lessons) * 100 || 0)}%`, p: (stats.videos_sent / stats.completed_lessons) * 100, c: 'var(--info)' },
                            { label: "Kechikishlar", val: stats.late_today, p: (stats.late_today / stats.total_teachers) * 100, c: 'var(--warning)' },
                            { label: "Missed", val: stats.missed_lessons, p: (stats.missed_lessons / stats.total_lessons) * 100, c: 'var(--danger)' }
                        ].map((stat, i) => (
                            <div key={i} style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>{stat.label}</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{stat.val}</p>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', marginTop: '0.75rem', overflow: 'hidden' }}>
                                    <div style={{ width: `${stat.p}%`, height: '100%', background: stat.c }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Global Infratuzilma Yuklamasi</p>
                        <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                            {[70, 85, 60, 95, 80, 75, 90, 85, 95, 100, 85, 70, 90, 80, 95, 85, 75, 90].map((h, i) => (
                                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', opacity: 0.2 + (h / 150), borderRadius: '2px' }}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="flex-between">
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bell size={18} className="text-primary" /> Live Activity
                        </h2>
                        <span style={{ display: 'flex', height: '8px', width: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }}></span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                        {[
                            { t: '13:20', a: 'ADMIN ACTION', m: '9-B sinf jadvali yangilandi', c: 'var(--primary)' },
                            { t: '12:55', a: 'TEACHER ACTION', m: 'Jasur Aliyev video yukladi', c: 'var(--success)' },
                            { t: '12:30', a: 'SYSTEM ALERT', m: '11-A xonasida dars kechikmoqda', c: 'var(--warning)' }
                        ].map((log, i) => (
                            <div key={i} style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${log.c}` }}>
                                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: log.c, marginBottom: '2px' }}>{log.t} • {log.a}</p>
                                <p style={{ fontSize: '0.8rem', margin: 0 }}>{log.m}</p>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', justifyContent: 'center' }}>To'liq Hisobot</button>
                </div>
            </div>

            {/* Infrastructure Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {[
                    { l: 'Cloud Space', v: '42.8 GB', i: <Database size={18} /> },
                    { l: 'Network Speed', v: '124 ms', i: <Zap size={18} /> },
                    { l: 'Active Sessions', v: '342', i: <Globe size={18} /> },
                    { l: 'CPU Load', v: '14%', i: <Activity size={18} /> }
                ].map((item, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ opacity: 0.3 }}>{item.i}</div>
                        <div>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>{item.l}</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{item.v}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
