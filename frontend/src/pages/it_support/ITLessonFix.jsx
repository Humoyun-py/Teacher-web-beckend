import React, { useState, useEffect } from 'react';
import { 
  BookOpen, PlayCircle, StopCircle, Loader, RefreshCw, Clock, 
  AlertTriangle, MapPin, Edit3, X, User, ArrowRightLeft, Calendar 
} from 'lucide-react';
import { api } from '../../api';

const STATUS_COLORS = {
  scheduled: 'badge-primary',
  in_progress: 'badge-warning',
  completed: 'badge-success',
  missed: 'badge-danger',
};
const STATUS_LABELS = {
  scheduled: 'Rejalashtirilgan',
  in_progress: 'Dars ketmoqda',
  completed: 'Yakunlangan',
  missed: "O'tilmagan",
};

export default function ITLessonFix() {
  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(null);

  // Correction Modal States
  const [showFixModal, setShowFixModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [fixForm, setFixForm] = useState({
    status: '',
    teacher_id: '',
    replacement_id: '',
    force_action: ''
  });

  const loadLessonsAndTeachers = async () => {
    setLoading(true);
    try {
      let params = `?date=${dateFilter || ''}`;
      if (filter) params += `&status=${filter}`;
      
      const [lessRes, teachRes] = await Promise.all([
        api.getLessons(params),
        api.getTeachers()
      ]);
      setLessons(Array.isArray(lessRes) ? lessRes : lessRes.results || []);
      setTeachers(teachRes.results || teachRes || []);
    } catch (err) {
      console.error(err);
      alert('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonsAndTeachers();
  }, [filter, dateFilter]);

  const handleOpenFix = (lesson) => {
    setSelectedLesson(lesson);
    setFixForm({
      status: lesson.status || '',
      teacher_id: lesson.teacher || '',
      replacement_id: lesson.replacement_teacher || '',
      force_action: ''
    });
    setShowFixModal(true);
  };

  const handleSaveFix = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const data = {
        lesson_id: selectedLesson.id,
        status: fixForm.status,
        teacher_id: fixForm.teacher_id || null,
        replacement_id: fixForm.replacement_id || null,
      };
      if (fixForm.force_action) {
        data.force_action = fixForm.force_action;
      }
      await api.fixITLesson(data);
      alert('✅ Dars ma\'lumotlari muvaffaqiyatli to\'g\'rilandi!');
      setShowFixModal(false);
      loadLessonsAndTeachers();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '—';

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Darslarni tuzatish paneli (IT Support)</h1>
          <p className="text-muted">Dars holatini tiklash, o'rinbosarlarni belgilash va vaqtlarni to'g'rilash</p>
        </div>
        <button className="btn btn-outline" onClick={loadLessonsAndTeachers}>
          <RefreshCw size={15} /> Yangilash
        </button>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="flex-center gap-2">
          {['', 'scheduled', 'in_progress', 'completed', 'missed'].map(s => (
            <button
              key={s}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(s)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            >
              {s ? (STATUS_LABELS[s] || s) : 'Barchasi'}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="var(--primary)" />
          <input
            type="date"
            className="input-field"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
          />
        </div>
      </div>

      {/* Lessons Table */}
      <div className="table-container glass" style={{ flex: 1, marginTop: '1rem' }}>
        {loading ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={36} color="var(--primary)" />
            <p className="text-muted">Darslar yuklanmoqda...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <BookOpen size={48} color="var(--text-muted)" />
            <p className="text-muted">Darslar topilmadi</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fan / Sinf</th>
                <th>Asosiy O'qituvchi</th>
                <th>O'rinbosar</th>
                <th>Reja vaqti</th>
                <th>Haqiqiy vaqti</th>
                <th>Xona</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => (
                <tr key={lesson.id} className="table-row-hover">
                  <td>
                    <div style={{ fontWeight: 600 }}>{lesson.subject_name || lesson.subject || '—'}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{lesson.class_name || lesson.school_class || '—'}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.88rem' }}>{lesson.teacher_name || '—'}</span>
                  </td>
                  <td>
                    {lesson.replacement_teacher_name ? (
                      <span className="text-warning" style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowRightLeft size={12} /> {lesson.replacement_teacher_name}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                      <Clock size={12} color="var(--primary)" />
                      <span>{formatTime(lesson.scheduled_start)} – {formatTime(lesson.scheduled_end)}</span>
                    </div>
                  </td>
                  <td>
                    {lesson.actual_start ? (
                      <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ color: 'var(--success)' }}>▶ {new Date(lesson.actual_start).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                        {lesson.actual_end && (
                          <div style={{ color: 'var(--accent)' }}>■ {new Date(lesson.actual_end).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} color="var(--primary)" /> {lesson.room || lesson.class_room || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[lesson.status] || 'badge-primary'}`}>
                      {STATUS_LABELS[lesson.status] || lesson.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}
                      onClick={() => handleOpenFix(lesson)}
                    >
                      <Edit3 size={12} /> Tuzatish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Fix Lesson Modal */}
      {showFixModal && selectedLesson && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '480px', padding: '2rem', gap: '1.25rem' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Dars ma'lumotlarini tuzatish</h3>
              <button onClick={() => setShowFixModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div>Fan: <b>{selectedLesson.subject_name}</b> ({selectedLesson.class_name})</div>
              <div>Sana: <b>{selectedLesson.date}</b> ({formatTime(selectedLesson.scheduled_start)} - {formatTime(selectedLesson.scheduled_end)})</div>
            </div>

            <form onSubmit={handleSaveFix} className="flex-col gap-4">
              {/* Status */}
              <div className="input-group">
                <label className="input-label">Dars holati (Status)</label>
                <select className="input-field" value={fixForm.status} onChange={e => setFixForm({ ...fixForm, status: e.target.value })}>
                  <option value="scheduled">Scheduled (Rejalashtirilgan)</option>
                  <option value="in_progress">In Progress (Boshlangan/Ketyapti)</option>
                  <option value="completed">Completed (Yakunlangan)</option>
                  <option value="missed">Missed (O'tilmagan)</option>
                </select>
              </div>

              {/* Principal Teacher */}
              <div className="input-group">
                <label className="input-label">Asosiy O'qituvchi</label>
                <select className="input-field" value={fixForm.teacher_id} onChange={e => setFixForm({ ...fixForm, teacher_id: e.target.value })}>
                  <option value="">Tanlang...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || t.username}</option>
                  ))}
                </select>
              </div>

              {/* Replacement Teacher */}
              <div className="input-group">
                <label className="input-label">O'rinbosar O'qituvchi</label>
                <select className="input-field" value={fixForm.replacement_id} onChange={e => setFixForm({ ...fixForm, replacement_id: e.target.value })}>
                  <option value="">O'rinbosar yo'q</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || t.username}</option>
                  ))}
                </select>
              </div>

              {/* Force start/end on behalf */}
              <div className="input-group">
                <label className="input-label">On behalf of teacher amallari</label>
                <select className="input-field" value={fixForm.force_action} onChange={e => setFixForm({ ...fixForm, force_action: e.target.value })}>
                  <option value="">Amal yo'q</option>
                  <option value="start">Darsni majburan boshlash (Force Start)</option>
                  <option value="end">Darsni majburan yakunlash (Force End)</option>
                </select>
              </div>

              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowFixModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
                  {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
