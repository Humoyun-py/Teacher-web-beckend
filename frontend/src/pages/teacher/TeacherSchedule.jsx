import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, PlayCircle, StopCircle, Camera, Loader, CheckCircle, AlertCircle } from 'lucide-react';
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
      alert('Xatolik: ' + msg);
    } finally { setActionLoading(null); }
  };

  const handleEnd = async (id) => {
    const notes = prompt("Dars bo'yicha izoh (ixtiyoriy):", '') ;
    if (notes === null) return;
    setActionLoading(id + '-end');
    try {
      await api.endLesson(id, notes);
      loadLessons();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setActionLoading(null); }
  };

  const handlePhotoUpload = async (e, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLesson(lessonId);
    try {
      await api.uploadPhoto(lessonId, file, 'Dars jarayonida olingan rasm');
      alert('✅ Rasm muvaffaqiyatli yuborildi!');
    } catch (err) {
      alert('Rasm yuborishda xatolik: ' + JSON.stringify(err.data || err.message));
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
          <p className="text-muted">Kunlik darslar ro'yxati va boshqaruv</p>
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
                    <h3 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                      {lesson.subject_name || lesson.subject || '—'} — {lesson.class_name || lesson.school_class || '—'}
                    </h3>
                    <div className="flex-center gap-3" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span className="flex-center gap-1">
                        <Clock size={13} />
                        {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}
                      </span>
                      {lesson.actual_start_time && (
                        <span style={{ color: 'var(--accent)' }}>
                          Boshlandi: {new Date(lesson.actual_start_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
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
