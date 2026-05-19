import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, Loader, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../api';

export default function Replacements() {
  const [replacements, setReplacements] = useState([]);
  const [lessons, setLessons] = useState([]);
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
      setLessons(Array.isArray(lesRes) ? lesRes : lesRes.results || []);
      setTeachers(Array.isArray(tchRes) ? tchRes : tchRes.results || []);
    } catch (err) {
      console.error('Yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleReplace = async (e) => {
    e.preventDefault();
    if (!form.lesson_id || !form.replacement_teacher_id) return alert("Dars va o'rinbosar tanlang!");
    setIsSubmitting(true);
    try {
      await api.replaceLesson(parseInt(form.lesson_id), parseInt(form.replacement_teacher_id), form.reason);
      setShowModal(false);
      setForm({ lesson_id: '', replacement_teacher_id: '', reason: '' });
      await loadData();
    } catch (err) {
      alert("Xatolik: " + (err?.data ? JSON.stringify(err.data) : err?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (lessonId) => {
    if (!window.confirm("O'rinbosarni bekor qilmoqchimisiz?")) return;
    try {
      await api.cancelReplace(lessonId);
      await loadData();
    } catch (err) {
      alert("Xatolik: " + (err?.data ? JSON.stringify(err.data) : err?.message));
    }
  };

  const handleApproveReject = async (lessonId, action) => {
    if (!window.confirm(`So'rovni ${action === 'approve' ? 'tasdiqlaysizmi' : 'rad etasizmi'}?`)) return;
    try {
      await api.approveReplace(lessonId, action);
      await loadData();
    } catch (err) {
      alert("Xatolik: " + (err?.data ? JSON.stringify(err.data) : err?.message));
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">🔄 O'rinbosarlar</h1>
          <p className="text-muted">Darslarni boshqa o'qituvchiga biriktirish</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> O'rinbosar biriktirish
        </button>
      </div>

      <div className="glass flex-col" style={{ flex: 1, padding: '1.5rem', gap: '1rem' }}>
        {loading ? (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem' }}>
            <Loader className="spinner" size={32} color="var(--primary)" />
            <p className="text-muted">Yuklanmoqda...</p>
          </div>
        ) : replacements.length === 0 ? (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={48} style={{ opacity: 0.3 }} />
            <p>Hali o'rinbosar biriktirilmagan</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Dars</th>
                  <th>Asl ustoz</th>
                  <th>O'rinbosar</th>
                  <th>Sabab</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {replacements.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>
                      <div className="flex-col">
                        <span style={{ fontWeight: 500 }}>{r.subject_name}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{r.class_name} | {r.scheduled_start}-{r.scheduled_end}</span>
                      </div>
                    </td>
                    <td>{r.teacher_name}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.replacement_teacher_name}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.replacement_reason || '-'}</td>
                    <td>
                      {r.replacement_status === 'pending' ? (
                        <span className="badge badge-warning">Kutilmoqda</span>
                      ) : r.replacement_status === 'rejected' ? (
                        <span className="badge badge-danger">Rad etilgan</span>
                      ) : (
                        <span className={`badge ${r.status === 'completed' ? 'badge-success' : r.status === 'in_progress' ? 'badge-warning' : 'badge-info'}`}>
                          {r.status_display}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                        {r.replacement_status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveReject(r.id, 'approve')} className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--success)', borderColor: 'var(--surface-border)' }} title="Tasdiqlash">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleApproveReject(r.id, 'reject')} className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'var(--surface-border)' }} title="Rad etish">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {r.replacement_status !== 'pending' && r.status === 'scheduled' && (
                          <button onClick={() => handleCancel(r.id)} className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'var(--surface-border)' }} title="Bekor qilish">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">🔄 O'rinbosar biriktirish</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleReplace} className="flex-col gap-4" autoComplete="off">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Darsni tanlang</label>
                <select className="input-field" value={form.lesson_id} onChange={e => setForm({ ...form, lesson_id: e.target.value })} required autoComplete="off">
                  <option value="">-- Dars tanlang --</option>
                  {lessons.filter(l => !l.is_replaced && l.replacement_status !== 'pending' && l.status === 'scheduled').map(l => (
                    <option key={l.id} value={l.id}>
                      {l.date} | {l.subject_name} | {l.teacher_name} | {l.scheduled_start}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>O'rinbosar teacher</label>
                <select className="input-field" value={form.replacement_teacher_id} onChange={e => setForm({ ...form, replacement_teacher_id: e.target.value })} required autoComplete="off">
                  <option value="">-- Teacher tanlang --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Sabab (ixtiyoriy)</label>
                <textarea className="input-field" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Masalan: Kasal bo'lganligi sababli" rows={2} style={{ resize: 'vertical' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? "Biriktirilmoqda..." : "O'rinbosar biriktirish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
