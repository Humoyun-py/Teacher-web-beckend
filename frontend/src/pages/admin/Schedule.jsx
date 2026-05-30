import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, Clock, X, Check, Loader, BookOpen, Users, MapPin, Building2 } from 'lucide-react';
import { api } from '../../api';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0]);
  const [showGenModal, setShowGenModal] = useState(false);

  const [form, setForm] = useState({
    teacher: '', subject: '', school_class: '',
    day_of_week: 1, start_time: '08:00', end_time: '08:45', room: '',
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sch, tch, sub, cls] = await Promise.allSettled([
        api.getSchedules(),
        api.getTeachers(),
        api.getSubjects(),
        api.getClasses(),
      ]);
      if (sch.status === 'fulfilled') {
        const raw = sch.value;
        // Backend array, paginated object, yoki boshqa format qaytarishi mumkin
        if (Array.isArray(raw)) setSchedules(raw);
        else if (Array.isArray(raw.results)) setSchedules(raw.results);
        else if (raw && typeof raw === 'object') {
          // Weekly endpoint {1: [...], 2: [...]} format bo'lsa flatten qilamiz
          const flat = Object.values(raw).flat().filter(Array.isArray(Object.values(raw)[0]) ? Boolean : () => false);
          setSchedules(flat.length ? flat : []);
        } else setSchedules([]);
      }
      if (tch.status === 'fulfilled') setTeachers(tch.value.results || tch.value || []);
      if (sub.status === 'fulfilled') setSubjects(sub.value.results || sub.value || []);
      if (cls.status === 'fulfilled') setClasses(cls.value.results || cls.value || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  // Sinf tanlanganda avtomatik xona to'ldirish
  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => c.id === parseInt(classId));
    setForm({ 
      ...form, 
      school_class: classId,
      room: selectedClass?.room || form.room,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSchedule(form);
      setShowModal(false);
      setForm({ teacher: '', subject: '', school_class: '', day_of_week: 1, start_time: '08:00', end_time: '08:45', room: '' });
      loadAll();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!await window.confirm("Bu jadvalni o'chirmoqchimisiz?")) return;
    try {
      await api.deleteSchedule(id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateLessonsFromSchedule(genDate);
      alert(`✅ ${res.created_count || 0} ta dars yaratildi!`);
      setShowGenModal(false);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setGenerating(false); }
  };

  // Group by day
  const byDay = {};
  DAYS.forEach((d, i) => { byDay[i + 1] = []; });
  schedules.forEach(s => {
    const day = s.day_of_week;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(s);
  });

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '100%' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">Jadval yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Dars Jadvali</h1>
          <p className="text-muted">Haftalik dars jadvali — xona, etaj va vaqtlar bilan</p>
        </div>
        <div className="flex-center gap-3">
          <button className="btn btn-outline" onClick={() => setShowGenModal(true)}>
            <Calendar size={16} /> Darslar yaratish
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Jadval qo'shish
          </button>
          <button className="btn btn-outline" onClick={loadAll}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Schedule Grid by day */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
        {DAYS.map((day, i) => (
          <div key={day} className="glass" style={{ padding: '1rem', minHeight: '200px' }}>
            <div style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>{day}</h4>
            </div>
            <div className="flex-col gap-2">
              {(byDay[i + 1] || []).length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>
                  Dars yo'q
                </p>
              ) : (
                (byDay[i + 1] || []).map(s => (
                  <div key={s.id} style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.75rem',
                    position: 'relative',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {s.subject_name || s.subject || '—'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.73rem', marginTop: '0.15rem' }}>
                      <Users size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {s.class_name || s.school_class || '—'}
                    </div>
                    {/* Xona va Etaj */}
                    {(s.room || s.class_room) && (
                      <div style={{ fontSize: '0.7rem', marginTop: '0.15rem', color: 'var(--accent)' }}>
                        <MapPin size={9} style={{ display: 'inline', marginRight: '2px' }} />
                        Xona: {s.room || s.class_room}
                        {s.class_floor && (
                          <span style={{ marginLeft: '4px' }}>
                            <Building2 size={9} style={{ display: 'inline', marginRight: '2px' }} />
                            {s.class_floor}-etaj
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.1rem' }}>
                      {s.teacher_name || '—'}
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', lineHeight: 1 }}
                      title="O'chirish"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Schedule Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '520px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">Yangi jadval qo'shish</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-col gap-4">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>O'qituvchi</label>
                <select required className="input-field" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} style={{ background: 'var(--bg-darker)' }}>
                  <option value="">— Tanlang —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Fan</label>
                <select required className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ background: 'var(--bg-darker)' }}>
                  <option value="">— Tanlang —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Sinf</label>
                <select required className="input-field" value={form.school_class} onChange={e => handleClassChange(e.target.value)} style={{ background: 'var(--bg-darker)' }}>
                  <option value="">— Tanlang —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.room ? ` (Xona: ${c.room}, ${c.floor}-etaj)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Hafta kuni</label>
                <select className="input-field" value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: +e.target.value })} style={{ background: 'var(--bg-darker)' }}>
                  {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Boshlanish vaqti
                  </label>
                  <input type="time" required className="input-field" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Tugash vaqti
                  </label>
                  <input type="time" required className="input-field" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              {/* Xona raqami (ixtiyoriy — sinf tanlanganda avtomatik to'ladi) */}
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Xona raqami (ixtiyoriy)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Sinf tanlanganida avtomatik to'ladi"
                  value={form.room} 
                  onChange={e => setForm({ ...form, room: e.target.value })} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={submitting}>
                {submitting ? <Loader size={16} className="spinner" /> : <Check size={16} />}
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generate Lessons Modal */}
      {showGenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">Darslarni yaratish</h2>
              <button onClick={() => setShowGenModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Tanlangan sana uchun jadvaldan avtomatik darslar yaratiladi.
            </p>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Sana</label>
              <input type="date" className="input-field" value={genDate} onChange={e => setGenDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader size={16} className="spinner" /> : <BookOpen size={16} />}
              {generating ? 'Yaratilmoqda...' : 'Darslarni yaratish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
