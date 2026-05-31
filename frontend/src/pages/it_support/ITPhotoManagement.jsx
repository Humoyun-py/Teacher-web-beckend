import React, { useState, useEffect } from 'react';
import { Camera, Check, X, Eye, Loader, RefreshCw, Trash2, Upload, AlertCircle } from 'lucide-react';
import { api } from '../../api';

const STATUS_LABELS = { pending: 'Kutilmoqda', accepted: 'Qabul qilindi', rejected: 'Rad etildi' };
const STATUS_BADGE = { pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger' };

export default function ITPhotoManagement() {
  const [photos, setPhotos] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Review state
  const [reviewing, setReviewing] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  // Force upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    lesson_id: '',
    photo: null
  });
  const [uploading, setUploading] = useState(false);

  const loadPhotosAndLessons = async (status = filter) => {
    setLoading(true);
    try {
      const [phRes, lessRes] = await Promise.all([
        api.getPhotos(`?status=${status}&ordering=-created_at`),
        api.getLessons('?status=in_progress,completed')
      ]);
      setPhotos(phRes.results || phRes || []);
      setLessons(Array.isArray(lessRes) ? lessRes : lessRes.results || []);
    } catch (err) {
      console.error(err);
      alert('Ma\'lumotlarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotosAndLessons(filter);
  }, [filter]);

  const handleReview = async (id, status) => {
    try {
      await api.reviewPhoto(id, status, reviewNote || 'IT Support tomonidan tekshirildi');
      alert(`✅ Rasm holati "${STATUS_LABELS[status]}" deb o'zgartirildi.`);
      setReviewing(null);
      setReviewNote('');
      loadPhotosAndLessons(filter);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!await window.confirm('Rostdan ham ushbu rasm isbotini butunlay o\'chirib tashlamoqchimisiz?')) return;
    try {
      await api.deletePhoto(id);
      alert('✅ Rasm o\'chirildi.');
      loadPhotosAndLessons(filter);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handleForceUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.lesson_id || !uploadForm.photo) {
      alert('Iltimos, dars va rasmni tanlang!');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('lesson', uploadForm.lesson_id);
      fd.append('photo', uploadForm.photo);

      // Force upload using django REST API
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://teacher-web-beckend.onrender.com/api/v1/photos/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });
      
      if (response.ok) {
        alert('✅ Rasm muvaffaqiyatli yuklandi!');
        setShowUploadModal(false);
        setUploadForm({ lesson_id: '', photo: null });
        loadPhotosAndLessons(filter);
      } else {
        const errorData = await response.json();
        alert('Xatolik: ' + JSON.stringify(errorData));
      }
    } catch (err) {
      alert('Yuklashda xatolik: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Dars rasmlari boshqaruvi (IT Support)</h1>
          <p className="text-muted">Dars boshlangani haqidagi rasmlarni tekshirish va favqulodda yuklash</p>
        </div>
        <div className="flex-center gap-3">
          {['pending', 'accepted', 'rejected'].map(s => (
            <button
              key={s}
              className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(s)}
              style={{ fontSize: '0.85rem' }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          <button className="btn btn-outline" onClick={() => loadPhotosAndLessons(filter)}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> Rasm Yuklash (Force)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-center flex-col gap-4" style={{ height: '50vh' }}>
          <Loader className="spinner" size={36} color="var(--primary)" />
          <p className="text-muted">Rasmlar yuklanmoqda...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="glass flex-center flex-col gap-4" style={{ padding: '4rem', height: '40vh' }}>
          <Camera size={56} color="var(--text-muted)" />
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>{filter === 'pending' ? 'Kutilayotgan rasmlar yo\'q ✅' : 'Rasmlar topilmadi'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          {photos.map(photo => (
            <div key={photo.id} className="glass flex-col" style={{ padding: '1.25rem', gap: '0.85rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: photo.status === 'accepted' ? 'var(--success)' : photo.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'
              }} />

              <div className="flex-between">
                <span className={`badge ${STATUS_BADGE[photo.status] || 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                  {STATUS_LABELS[photo.status] || photo.status}
                </span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {photo.created_at ? new Date(photo.created_at).toLocaleString('uz-UZ') : '—'}
                </span>
              </div>

              {/* Photo preview */}
              <div
                style={{ height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: photo.photo ? 'pointer' : 'default', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                <h4 style={{ fontWeight: 600, fontSize: '0.92rem', margin: 0 }}>
                  {photo.teacher_name || `O'qituvchi`}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Dars: {photo.lesson_details?.subject || `Dars #${photo.lesson}`} ({photo.lesson_details?.class || 'Sinf yo\'q'})
                </div>
                {photo.review_notes && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--accent)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    Izoh: {photo.review_notes}
                  </p>
                )}
              </div>

              <div className="flex-col gap-2" style={{ marginTop: 'auto' }}>
                {reviewing === photo.id ? (
                  <div className="flex-col gap-2">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Izoh (ixtiyoriy)..."
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                    />
                    <div className="flex-center gap-2">
                      <button onClick={() => handleReview(photo.id, 'accepted')} className="btn btn-success" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', justifyContent: 'center' }}>✓ Qabul</button>
                      <button onClick={() => handleReview(photo.id, 'rejected')} className="btn btn-danger" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', justifyContent: 'center' }}>✗ Rad</button>
                      <button onClick={() => { setReviewing(null); setReviewNote(''); }} className="btn btn-outline" style={{ padding: '0.4rem' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-center gap-2">
                    <button onClick={() => setReviewing(photo.id)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}>Tahrirlash</button>
                    <button onClick={() => handleDelete(photo.id)} className="btn btn-outline" style={{ color: 'var(--danger)', padding: '0.4rem' }} title="O'chirish">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
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

      {/* Force Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '440px', padding: '2rem', gap: '1.25rem' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Dars rasmini favqulodda yuklash</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleForceUpload} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Darsni tanlang</label>
                <select className="input-field" value={uploadForm.lesson_id} onChange={e => setUploadForm({ ...uploadForm, lesson_id: e.target.value })} required>
                  <option value="">Tanlang...</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.subject_name} ({l.class_name}) — {l.date} ({l.teacher_name})</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Rasm yuklang</label>
                <input 
                  type="file" 
                  className="input-field" 
                  accept="image/*" 
                  onChange={e => setUploadForm({ ...uploadForm, photo: e.target.files[0] })} 
                  required 
                />
              </div>

              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowUploadModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
