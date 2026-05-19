import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, Loader, ArrowRightLeft } from 'lucide-react';
import { api } from '../../api';

export default function MyReplacements() {
  const [replacements, setReplacements] = useState([]);
  const [myLessons, setMyLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ lesson_id: '', replacement_teacher_id: '', reason: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [repRes, lesRes, tchRes] = await Promise.all([
        api.getReplacements(),
        api.getLessons(`?date__gte=${today}`),
        api.getTeachers(),
      ]);
      setReplacements(Array.isArray(repRes) ? repRes : repRes.results || []);
      setMyLessons(Array.isArray(lesRes) ? lesRes : lesRes.results || []);
      setTeachers(Array.isArray(tchRes) ? tchRes : tchRes.results || []);
    } catch (err) {
      console.error('Yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Separate: my lessons that were replaced/requested vs lessons I'm replacing
  const myReplacedOut = replacements.filter(r => r.teacher_name && r.teacher_name.includes(user.first_name || '___'));
  const myReplacedIn = replacements.filter(r => r.replacement_teacher_name && r.replacement_teacher_name.includes(user.first_name || '___'));

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!form.lesson_id) return alert("Darsni tanlang!");
    setIsSubmitting(true);
    try {
      await api.replaceLesson(parseInt(form.lesson_id), form.replacement_teacher_id ? parseInt(form.replacement_teacher_id) : null, form.reason);
      setShowModal(false);
      setForm({ lesson_id: '', replacement_teacher_id: '', reason: '' });
      await loadData();
      alert("So'rov muvaffaqiyatli yuborildi!");
    } catch (err) {
      alert("Xatolik: " + (err?.data ? JSON.stringify(err.data) : err?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">🔄 O'rinbosarlar</h1>
          <p className="text-muted">Sizning o'rinbosar darsingiz va boshqalar o'rniga darslar</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> O'rinbosar so'rash
        </button>
      </div>

      {loading ? (
        <div className="glass flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
          <Loader className="spinner" size={32} color="var(--primary)" />
          <p className="text-muted">Yuklanmoqda...</p>
        </div>
      ) : replacements.length === 0 ? (
        <div className="glass flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', padding: '3rem', color: 'var(--text-muted)' }}>
          <ArrowRightLeft size={48} style={{ opacity: 0.3 }} />
          <p>Hali o'rinbosar darslar yo'q</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {/* Darslar - boshqalar o'rniga (men o'rinbosar) */}
          {myReplacedIn.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ Siz o'rinbosar bo'lgan darslar ({myReplacedIn.length})
              </h3>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Fan</th><th>Sinf</th><th>Asl ustoz</th><th>Vaqt</th><th>Holat</th></tr></thead>
                  <tbody>
                    {myReplacedIn.map(r => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 500 }}>{r.subject_name}</td>
                        <td>{r.class_name}</td>
                        <td>{r.teacher_name}</td>
                        <td className="text-muted">{r.scheduled_start} - {r.scheduled_end}</td>
                        <td>
                          {r.replacement_status === 'pending' ? (
                            <span className="badge badge-warning">Kutilmoqda</span>
                          ) : r.replacement_status === 'rejected' ? (
                            <span className="badge badge-danger">Rad etilgan</span>
                          ) : (
                            <span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status_display}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mening darslarim - replace bo'lgan yoki so'ralgan */}
          {myReplacedOut.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ❌ Sizning darslaringiz — o'rinbosar so'ralgan/yuborilgan ({myReplacedOut.length})
              </h3>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Fan</th><th>Sinf</th><th>O'rinbosar</th><th>Sabab</th><th>Holat</th></tr></thead>
                  <tbody>
                    {myReplacedOut.map(r => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 500 }}>{r.subject_name}</td>
                        <td>{r.class_name}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.replacement_teacher_name || '-'}</td>
                        <td className="text-muted">{r.replacement_reason || '-'}</td>
                        <td>
                          {r.replacement_status === 'pending' ? (
                            <span className="badge badge-warning">Kutilmoqda</span>
                          ) : r.replacement_status === 'rejected' ? (
                            <span className="badge badge-danger">Rad etilgan</span>
                          ) : (
                            <span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status_display}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Barcha replacement darslar */}
          <div className="glass" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>📋 Barcha o'rinbosar darslar</h3>
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead><tr><th>Sana</th><th>Fan</th><th>Asl ustoz</th><th>O'rinbosar</th><th>Sabab</th><th>Holat</th></tr></thead>
                <tbody>
                  {replacements.map(r => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.subject_name}</td>
                      <td>{r.teacher_name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.replacement_teacher_name || '-'}</td>
                      <td className="text-muted">{r.replacement_reason || '-'}</td>
                      <td>
                        {r.replacement_status === 'pending' ? (
                          <span className="badge badge-warning">Kutilmoqda</span>
                        ) : r.replacement_status === 'rejected' ? (
                          <span className="badge badge-danger">Rad etilgan</span>
                        ) : (
                          <span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status_display}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Request Replacement */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">🔄 O'rinbosar so'rash</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleRequest} className="flex-col gap-4" autoComplete="off">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Darsingizni tanlang</label>
                <select className="input-field" value={form.lesson_id} onChange={e => setForm({ ...form, lesson_id: e.target.value })} required autoComplete="off">
                  <option value="">-- Dars tanlang --</option>
                  {myLessons.filter(l => !l.is_replaced && l.replacement_status !== 'pending' && l.status === 'scheduled').map(l => (
                    <option key={l.id} value={l.id}>
                      {l.date} | {l.subject_name} | {l.scheduled_start}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>O'rinbosar teacher (ixtiyoriy)</label>
                <select className="input-field" value={form.replacement_teacher_id} onChange={e => setForm({ ...form, replacement_teacher_id: e.target.value })} autoComplete="off">
                  <option value="">-- Barchaga ochiq (Admin tayinlaydi) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Sabab</label>
                <textarea className="input-field" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Kasal bo'lganligi sababli..." rows={2} style={{ resize: 'vertical' }} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? "Yuborilmoqda..." : "So'rov yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
