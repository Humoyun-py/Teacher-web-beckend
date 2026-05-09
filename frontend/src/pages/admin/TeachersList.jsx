import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Loader, X } from 'lucide-react';
import { api } from '../../api';

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ first_name: '', last_name: '', username: '', password: '', phone: '' });

  const loadTeachers = () => {
    setLoading(true);
    api.getTeachers()
      .then(res => setTeachers(res.results || []))
      .catch(err => console.error("O'qituvchilarni yuklashda xatolik:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const employee_id = 'TCH-' + Math.floor(10000 + Math.random() * 90000);
      await api.createTeacher({ ...newTeacher, employee_id });
      setShowModal(false);
      setNewTeacher({ first_name: '', last_name: '', username: '', password: '', phone: '' });
      loadTeachers();
    } catch (err) {
      console.error(err);
      alert("Xatolik: " + (err.data ? JSON.stringify(err.data) : err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Rostdan ham ushbu o'qituvchini o'chirmoqchimisiz?")) return;
    try {
      await api.deleteTeacher(id);
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (err) {
      alert("Xatolik: " + (err.data ? JSON.stringify(err.data) : err.message));
    }
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">O'qituvchilar ro'yxati</h1>
          <p className="text-muted">Haqiqiy baza orqali bog'langan tizim</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Yangi Qo'shish
        </button>
      </div>

      <div className="glass flex-col" style={{ flex: 1, padding: '1.5rem', gap: '1rem' }}>
        <div className="input-group" style={{ flexDirection: 'row', width: '350px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" className="input-field" placeholder="Ism yoki fan bo'yicha izlash..." style={{ paddingLeft: '2.5rem' }} />
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem' }}>
            <Loader className="spinner" size={32} color="var(--primary)" />
            <p className="text-muted">Bazadan yuklanmoqda...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>O'qituvchi logini (I.O.F)</th>
                  <th style={{ padding: '1rem' }}>Username (Login)</th>
                  <th style={{ padding: '1rem' }}>Telefon raqami</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Hech qanday o'qituvchi topilmadi
                    </td>
                  </tr>
                ) : teachers.map(teacher => (
                  <tr key={teacher.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden' }}>
                          <img src={`https://ui-avatars.com/api/?name=${teacher.full_name || teacher.username}&background=6366f1&color=fff`} alt="" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 500 }}>{teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Ism kiritilmagan'}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{teacher.employee_id || 'ID yo\'q'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>@{teacher.username}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{teacher.phone || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${teacher.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {teacher.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                        <button className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--accent)', borderColor: 'var(--surface-border)' }} title="Tahrirlash">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteTeacher(teacher.id)} className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--danger)', borderColor: 'var(--surface-border)' }} title="O'chirish">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">Yangi O'qituvchi qo'shish</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="flex-col gap-4">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Ism (First Name)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input required type="text" className="input-field" value={newTeacher.first_name} onChange={e => setNewTeacher({ ...newTeacher, first_name: e.target.value })} placeholder="Masalan: Sarvar" />
                  <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => {
                    if (!newTeacher.first_name) return alert("Avval Ismni kiriting!");
                    const base = (newTeacher.first_name + (newTeacher.last_name || '')).toLowerCase().replace(/[^a-z0-9]/g, '');
                    const rNum = Math.floor(100 + Math.random() * 900);
                    const rPass = Math.floor(100000 + Math.random() * 900000);
                    setNewTeacher({ ...newTeacher, username: `${base}${rNum}`, password: rPass.toString() });
                  }} title="Avtomatik login/parol yaratish">
                    ✨
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Familiya (Last Name)</label>
                <input required type="text" className="input-field" value={newTeacher.last_name} onChange={e => setNewTeacher({ ...newTeacher, last_name: e.target.value })} placeholder="Masalan: Boxodirov" />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Login (Username)</label>
                <input required type="text" className="input-field" value={newTeacher.username} onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })} placeholder="Masalan: alisher123" />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Parol (Password)</label>
                <input required type="text" className="input-field" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} placeholder="Kamida 6 ta belgi" />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Telefon Raqam</label>
                <input required type="text" className="input-field" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} placeholder="+998 90 123 45 67" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? "Yaratilmoqda..." : "Saqlash va Yaratish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
