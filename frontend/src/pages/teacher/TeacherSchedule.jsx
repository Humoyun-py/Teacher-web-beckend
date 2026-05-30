import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, PlayCircle, StopCircle, Camera, Loader, CheckCircle, AlertCircle, MapPin, Building2 } from 'lucide-react';
import { api } from '../../api';

const STATUS_LABELS = {
  scheduled: 'Rejalashtirilgan',
  in_progress: 'Dars ketmoqda',
  completed: 'Yakunlangan',
  missed: "O'tilmagan",
};
const STATUS_COLORS = {
  scheduled: 'badge-primary',
  in_progress: 'badge-warning',
  completed: 'badge-success',
  missed: 'badge-danger',
};

export default function TeacherSchedule() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadingLesson, setUploadingLesson] = useState(null);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const res = await api.getLessons(`?date=${selectedDate}&ordering=start_time`);
      setLessons(Array.isArray(res) ? res : res.results || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadLessons(); }, [selectedDate]);

  const handleStart = async (id) => {
    setActionLoading(id + '-start');
    try {
      await api.startLesson(id);
      loadLessons();
    } catch (err) {
      const msg = err.data?.error || err.data?.lesson_id?.[0] || JSON.stringify(err.data || err.message);
      await alert('Xatolik: ' + msg);
    } finally { setActionLoading(null); }
  };

  const handleEnd = async (id) => {
    const notes = await prompt("Dars bo'yicha izoh (ixtiyoriy):", '') ;
    if (notes === null) return;
    setActionLoading(id + '-end');
    try {
      await api.endLesson(id, notes);
      loadLessons();
    } catch (err) {
      await alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setActionLoading(null); }
  };

  const handlePhotoUpload = async (e, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLesson(lessonId);
    try {
      await api.uploadPhoto(lessonId, file, 'Dars jarayonida olingan rasm');
      await alert('✅ Rasm muvaffaqiyatli yuborildi!');
    } catch (err) {
      await alert('Rasm yuborishda xatolik: ' + JSON.stringify(err.data || err.message));
    } finally {
      setUploadingLesson(null);
      e.target.value = '';
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Mening Darslarim</h1>
          <p className="text-muted">Kunlik darslar — xona, etaj va vaqtlar bilan</p>
        </div>
        <div className="flex-center gap-3">
          <input
            type="date"
            className="input-field"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '0.5rem 1rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-center flex-col gap-4" style={{ flex: 1 }}>
          <Loader className="spinner" size={36} color="var(--primary)" />
          <p className="text-muted">Darslar yuklanmoqda...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="glass flex-center flex-col gap-4" style={{ padding: '4rem', flex: 1 }}>
          <Calendar size={56} color="var(--text-muted)" />
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            {selectedDate === today ? "Bugun dars yo'q" : `${selectedDate} sanasida dars yo'q`}
          </p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {lessons.map(lesson => (
            <div key={lesson.id} className="glass" style={{
              padding: '1.5rem',
              borderLeft: `4px solid ${lesson.status === 'in_progress' ? 'var(--warning)' : lesson.status === 'completed' ? 'var(--success)' : lesson.status === 'missed' ? 'var(--danger)' : 'var(--primary)'}`,
              position: 'relative',
            }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                {/* Lesson info */}
                <div className="flex-center gap-4">
                  <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)' }}>
                    <BookOpen size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {lesson.subject_name || lesson.subject || '—'} — {lesson.class_name || lesson.school_class || '—'}
                      {lesson.is_replaced && lesson.replacement_status === 'approved' && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', textTransform: 'none', padding: '0.15rem 0.4rem' }}>O'rinbosar dars</span>
                      )}
                    </h3>
                    <div className="flex-center gap-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      {/* Boshlanish va Tugash vaqti */}
                      <span className="flex-center gap-1">
                        <Clock size={13} />
                        {lesson.scheduled_start?.slice(0, 5)} – {lesson.scheduled_end?.slice(0, 5)}
                      </span>
                      {/* Xona va Etaj */}
                      {(lesson.room || lesson.class_room) && (
                        <span className="flex-center gap-1" style={{ color: 'var(--accent)' }}>
                          <MapPin size={12} />
                          Xona: {lesson.room || lesson.class_room}
                        </span>
                      )}
                      {lesson.class_floor && (
                        <span className="flex-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Building2 size={12} />
                          {lesson.class_floor}-etaj
                        </span>
                      )}
                      {lesson.is_replaced && lesson.replacement_status === 'approved' && lesson.teacher_name && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          ({lesson.teacher_name} o'rniga)
                        </span>
                      )}
                    </div>
                    {/* Haqiqiy vaqtlar */}
                    {lesson.actual_start && (
                      <div style={{ marginTop: '0.3rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--success)' }}>
                          ▶ Boshlandi: {new Date(lesson.actual_start).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {lesson.actual_end && (
                          <span style={{ color: 'var(--accent)', marginLeft: '0.75rem' }}>
                            ■ Tugadi: {new Date(lesson.actual_end).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            {lesson.duration_minutes && (
                              <span className="text-muted" style={{ fontSize: '0.72rem', marginLeft: '4px' }}>
                                ({lesson.duration_minutes} daqiqa)
                              </span>
                            )}
                          </span>
                        )}
                        {lesson.started_late && (
                          <span style={{ color: 'var(--danger)', marginLeft: '0.75rem', fontSize: '0.75rem' }}>⚠ Kech boshlangan</span>
                        )}
                      </div>
                    )}
                    {lesson.notes && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>📝 {lesson.notes}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-center gap-3">
                  <span className={`badge ${STATUS_COLORS[lesson.status] || 'badge-primary'}`}>
                    {STATUS_LABELS[lesson.status] || lesson.status}
                  </span>

                  {/* Photo upload */}
                  {(lesson.status === 'scheduled' || lesson.status === 'in_progress') && (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        id={`photo-${lesson.id}`}
                        onChange={e => handlePhotoUpload(e, lesson.id)}
                        style={{ display: 'none' }}
                        disabled={uploadingLesson === lesson.id}
                      />
                      <label
                        htmlFor={`photo-${lesson.id}`}
                        className="btn btn-outline"
                        style={{ cursor: uploadingLesson === lesson.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                      >
                        {uploadingLesson === lesson.id ? <Loader size={14} className="spinner" /> : <Camera size={14} />}
                        {uploadingLesson === lesson.id ? 'Yuborilmoqda...' : 'Rasm'}
                      </label>
                    </div>
                  )}

                  {lesson.status === 'scheduled' && selectedDate === today && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                      onClick={() => handleStart(lesson.id)}
                      disabled={actionLoading === lesson.id + '-start'}
                    >
                      {actionLoading === lesson.id + '-start' ? <Loader size={14} className="spinner" /> : <PlayCircle size={14} />}
                      Boshlash
                    </button>
                  )}

                  {lesson.status === 'in_progress' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
                      onClick={() => handleEnd(lesson.id)}
                      disabled={actionLoading === lesson.id + '-end'}
                    >
                      {actionLoading === lesson.id + '-end' ? <Loader size={14} className="spinner" /> : <StopCircle size={14} />}
                      Yakunlash
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
