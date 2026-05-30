import React, { useState, useEffect } from 'react';
import { BookOpen, PlayCircle, StopCircle, Loader, RefreshCw, Clock, AlertTriangle, MapPin, Building2 } from 'lucide-react';
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

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const loadLessons = async () => {
    setLoading(true);
    try {
      let params = '?ordering=-date';
      if (filter) params += `&status=${filter}`;
      if (dateFilter) params += `&date=${dateFilter}`;
      const res = await api.getLessons(params);
      setLessons(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadLessons(); }, [filter, dateFilter]);

  const handleStart = async (id) => {
    setActionLoading(id + '-start');
    try {
      await api.startLesson(id);
      loadLessons();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setActionLoading(null); }
  };

  const handleEnd = async (id) => {
    const notes = await prompt("Dars bo'yicha izoh (ixtiyoriy):", '');
    if (notes === null) return;
    setActionLoading(id + '-end');
    try {
      await api.endLesson(id, notes);
      loadLessons();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setActionLoading(null); }
  };

  const handleMarkAbsent = async () => {
    const date = dateFilter || new Date().toISOString().split('T')[0];
    if (!await window.confirm(`${date} sanasi uchun kelmaganlarni belgilashni tasdiqlaysizmi?`)) return;
    try {
      const res = await api.markAbsent(date);
      alert('✅ Kelmaganlar belgilandi: ' + JSON.stringify(res));
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '—';

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Darslar boshqaruvi</h1>
          <p className="text-muted">Barcha darslarni kuzatish — xona, etaj, vaqtlar bilan</p>
        </div>
        <div className="flex-center gap-2">
          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleMarkAbsent}>
            <AlertTriangle size={15} /> Kelmaganlarni belgilash
          </button>
          <button className="btn btn-outline" onClick={loadLessons}>
            <RefreshCw size={15} />
          </button>
        </div>
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
        <div style={{ marginLeft: 'auto' }}>
          <input
            type="date"
            className="input-field"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
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
                <th>O'qituvchi</th>
                <th>Sana</th>
                <th>Reja vaqti</th>
                <th>Haqiqiy vaqti</th>
                <th>Xona / Etaj</th>
                <th>Status</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => (
                <tr key={lesson.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lesson.subject_name || lesson.subject || '—'}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>{lesson.class_name || lesson.school_class || '—'}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {lesson.teacher_name || '—'}
                    {lesson.is_replaced && lesson.replacement_teacher_name && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: '0.1rem' }}>
                        ↔ {lesson.replacement_teacher_name}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {lesson.date || '—'}
                  </td>
                  {/* Reja vaqti - boshlanish va tugash */}
                  <td>
                    <div className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <Clock size={12} color="var(--primary)" />
                      <span style={{ fontWeight: 500 }}>
                        {formatTime(lesson.scheduled_start)} – {formatTime(lesson.scheduled_end)}
                      </span>
                    </div>
                  </td>
                  {/* Haqiqiy boshlanish va tugash vaqti */}
                  <td>
                    {lesson.actual_start ? (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                          ▶ {new Date(lesson.actual_start).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {lesson.actual_end ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                            ■ {new Date(lesson.actual_end).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            {lesson.duration_minutes && (
                              <span className="text-muted" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                                ({lesson.duration_minutes} daq)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: 'var(--warning)' }}>Davom etmoqda...</div>
                        )}
                        {lesson.started_late && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: '0.1rem' }}>⚠ Kech boshlangan</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  {/* Xona va Etaj */}
                  <td>
                    {(lesson.room || lesson.class_room) ? (
                      <div>
                        <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', fontSize: '0.82rem' }}>
                          <MapPin size={12} color="var(--primary)" />
                          {lesson.room || lesson.class_room}
                        </div>
                        {lesson.class_floor && (
                          <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            <Building2 size={11} />
                            {lesson.class_floor}-etaj
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[lesson.status] || 'badge-primary'}`}>
                      {STATUS_LABELS[lesson.status] || lesson.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      {lesson.status === 'scheduled' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleStart(lesson.id)}
                          disabled={actionLoading === lesson.id + '-start'}
                        >
                          {actionLoading === lesson.id + '-start' ? <Loader size={13} className="spinner" /> : <PlayCircle size={13} />}
                          Boshlash
                        </button>
                      )}
                      {lesson.status === 'in_progress' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleEnd(lesson.id)}
                          disabled={actionLoading === lesson.id + '-end'}
                        >
                          {actionLoading === lesson.id + '-end' ? <Loader size={13} className="spinner" /> : <StopCircle size={13} />}
                          Yakunlash
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
