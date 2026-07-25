import { useState, useEffect } from 'react';
import { Camera, Check, X, Eye, Loader, RefreshCw } from 'lucide-react';
import { api } from '../../api';

const STATUS_LABELS = { pending: 'Kutilmoqda', accepted: 'Qabul qilindi', rejected: 'Rad etildi' };
const STATUS_BADGE = { pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger' };

export default function VideoReviewList() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [reviewing, setReviewing] = useState(null); // photo id being reviewed
  const [reviewNote, setReviewNote] = useState('');
  const [photoStats, setPhotoStats] = useState(null);
  const [missingPhotos, setMissingPhotos] = useState([]);
  const [missingByTeacher, setMissingByTeacher] = useState([]);
  const [showMissing, setShowMissing] = useState(false);

  const loadPhotos = async (status = filter) => {
    setLoading(true);
    try {
      const [photosRes, statsRes, missingRes, missingTeacherRes] = await Promise.allSettled([
        api.getPhotos(`?status=${status}&ordering=-created_at`),
        api.getPhotoStats(),
        api.getMissingPhotos(),
        api.getMissingByTeacher(),
      ]);
      if (photosRes.status === 'fulfilled') setPhotos(photosRes.value.results || []);
      if (statsRes.status === 'fulfilled') setPhotoStats(statsRes.value);
      if (missingRes.status === 'fulfilled') setMissingPhotos(missingRes.value.lessons_without_photo || []);
      if (missingTeacherRes.status === 'fulfilled') setMissingByTeacher(missingTeacherRes.value.report || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPhotos(filter); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (id, status) => {
    try {
      await api.reviewPhoto(id, status, reviewNote || 'Tekshirildi');
      setPhotos(photos.filter(p => p.id !== id));
      setReviewing(null);
      setReviewNote('');
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>

      {/* Header */}
      {/* Stats summary */}
      {photoStats && (
        <div className="grid grid-cols-4" style={{ gap: '1rem' }}>
          {[
            { label: 'Jami', value: photoStats.total, color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Kutilmoqda', value: photoStats.pending, color: 'var(--warning)', bg: 'rgba(234,179,8,0.1)' },
            { label: 'Qabul', value: photoStats.accepted, color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Rad', value: photoStats.rejected, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
          ].map((s, i) => (
            <div key={i} className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-between">
        <div>
          <h1 className="heading-2">Rasm Tekshiruv</h1>
          <p className="text-muted">O'qituvchilar tomonidan yuborilgan dars rasmlari</p>
        </div>
        <div className="flex-center gap-3">
          <button className={`btn ${showMissing ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowMissing(!showMissing)} style={{ fontSize: '0.85rem' }}>
            📷 Yetishmovchilik
          </button>
          {/* Filter buttons */}
          {['pending', 'accepted', 'rejected'].map(s => (
            <button
              key={s}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setFilter(s); setShowMissing(false); }}
              style={{ fontSize: '0.85rem' }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          <button className="btn btn-outline" onClick={() => loadPhotos(filter)}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Missing Photos / Missing By Teacher */}
      {showMissing && (
        <div className="flex-col gap-4">
          {missingPhotos.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 className="heading-3" style={{ fontSize: '1rem', marginBottom: '1rem' }}>📷 Rasmsiz darslar</h3>
              <div className="flex-col gap-2" style={{ fontSize: '0.85rem' }}>
                {missingPhotos.map((lesson, i) => (
                  <div key={lesson.id || i} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--surface-border)' }}>
                    <span>{lesson.subject_name || lesson.subject} — {lesson.class_name || lesson.school_class}</span>
                    <span className="text-muted">{lesson.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {missingByTeacher.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 className="heading-3" style={{ fontSize: '1rem', marginBottom: '1rem' }}>👨‍🏫 O'qituvchilar bo'yicha yetishmovchilik</h3>
              <div className="flex-col gap-2" style={{ fontSize: '0.85rem' }}>
                {missingByTeacher.map((t, i) => (
                  <div key={t.teacher_id || i} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--surface-border)' }}>
                    <span>{t.full_name || '—'}</span>
                    <span style={{ color: 'var(--danger)' }}>{t.missing_proofs} ta rasmsiz</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex-center flex-col gap-4" style={{ flex: 1 }}>
          <Loader className="spinner" size={36} color="var(--primary)" />
          <p className="text-muted">Rasmlar yuklanmoqda...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="glass flex-center flex-col gap-4" style={{ padding: '4rem', flex: 1 }}>
          <Camera size={56} color="var(--text-muted)" />
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>{filter === 'pending' ? 'Kutilayotgan rasmlar yo\'q ✅' : 'Rasmlar topilmadi'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
          {photos.map(photo => (
            <div key={photo.id} className="glass flex-col" style={{ padding: '1.5rem', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
              {/* Status strip */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: photo.status === 'accepted' ? 'var(--success)' : photo.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'
              }} />

              <div className="flex-between">
                <span className={`badge ${STATUS_BADGE[photo.status] || 'badge-warning'}`}>
                  {STATUS_LABELS[photo.status] || photo.status}
                </span>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {photo.created_at ? new Date(photo.created_at).toLocaleString('uz-UZ') : '—'}
                </span>
              </div>

              {/* Photo preview */}
              <div
                style={{ height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: photo.photo ? 'pointer' : 'default', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => photo.photo && setSelectedPhoto(api.getPhotoUrl(photo.photo))}
                title="Kattalashtirish"
              >
                {photo.photo ? (
                  <img src={api.getPhotoUrl(photo.photo)} alt="Dars" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Camera size={48} color="rgba(255,255,255,0.15)" />
                )}
              </div>

              <div>
                <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>
                  {photo.teacher_name || `Teacher`} — Dars #{photo.lesson}
                </h4>
                {photo.description && <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{photo.description}</p>}
                {photo.review_notes && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--accent)', marginTop: '0.4rem' }}>
                    📝 {photo.review_notes}
                  </p>
                )}
              </div>

              {photo.status === 'pending' && (
                reviewing === photo.id ? (
                  <div className="flex-col gap-2">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Izoh (ixtiyoriy)..."
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <div className="flex-center gap-2">
                      <button onClick={() => handleReview(photo.id, 'accepted')} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                        <Check size={16} /> Qabul
                      </button>
                      <button onClick={() => handleReview(photo.id, 'rejected')} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                        <X size={16} /> Rad
                      </button>
                      <button onClick={() => { setReviewing(null); setReviewNote(''); }} className="btn btn-outline" style={{ padding: '0.6rem' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-center gap-2">
                    <button onClick={() => photo.photo && setSelectedPhoto(api.getPhotoUrl(photo.photo))} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}>
                      <Eye size={15} /> Ko'rish
                    </button>
                    <button onClick={() => setReviewing(photo.id)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}>
                      Tekshirish
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {selectedPhoto && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="Zoomed" style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.12)' }} />
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            ✕ Yopish
          </button>
        </div>
      )}
    </div>
  );
}
