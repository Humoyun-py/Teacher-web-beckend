import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Plus, Edit2, Trash2, Search, X, MapPin, Building2 } from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', grade: '', section: '', room: '', floor: 1, capacity: 30, is_active: true
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await api.getClasses();
      setClasses(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingId(cls.id);
      setFormData({
        name: cls.name,
        grade: cls.grade,
        section: cls.section || '',
        room: cls.room || '',
        floor: cls.floor || 1,
        capacity: cls.capacity || 30,
        is_active: cls.is_active
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', grade: '', section: '', room: '', floor: 1, capacity: 30, is_active: true });
    }
    setShowModal(true);
  };

  // Auto-generate name from grade + section
  const handleGradeChange = (val) => {
    const grade = parseInt(val) || '';
    const name = grade && formData.section ? `${grade}-${formData.section}` : grade ? `${grade}` : '';
    setFormData({ ...formData, grade, name });
  };

  const handleSectionChange = (val) => {
    const section = val.toUpperCase();
    const name = formData.grade && section ? `${formData.grade}-${section}` : formData.grade ? `${formData.grade}` : '';
    setFormData({ ...formData, section, name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateClass(editingId, formData);
      } else {
        await api.createClass(formData);
      }
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!await window.confirm("Rostdan ham bu sinfni o'chirmoqchimisiz?")) return;
    try {
      await api.deleteClass(id);
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.grade.toString().includes(search) ||
    (c.room || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex-col gap-4">
      <div className="flex-between">
        <h1 className="heading-2">Sinflar</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Yangi Sinf Qo'shish
        </button>
      </div>

      <div className="glass-panel p-4 flex-col gap-4">
        <div className="input-group" style={{ maxWidth: '300px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Qidirish..."
              style={{ paddingLeft: '2.75rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sinf nomi</th>
                <th>Sinf raqami</th>
                <th>Harf (Bo'lim)</th>
                <th>Xona raqami</th>
                <th>Etaj</th>
                <th>Sig'imi</th>
                <th>Status</th>
                <th>O'qituvchilar</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>Yuklanmoqda...</td></tr>
              ) : filteredClasses.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>Hech narsa topilmadi</td></tr>
              ) : (
                filteredClasses.map(cls => (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 600 }}>{cls.name}</td>
                    <td>{cls.grade}</td>
                    <td>
                      {cls.section ? (
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                          {cls.section}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {cls.room ? (
                        <span className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                          <MapPin size={13} color="var(--primary)" />
                          {cls.room}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {cls.floor ? (
                        <span className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                          <Building2 size={13} color="var(--accent)" />
                          {cls.floor}-etaj
                        </span>
                      ) : '—'}
                    </td>
                    <td>{cls.capacity}</td>
                    <td>
                      <span className={`badge ${cls.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {cls.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td>{cls.teachers_count || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderColor: 'transparent' }} onClick={() => handleOpenModal(cls)}>
                          <Edit2 size={16} className="text-primary" />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderColor: 'transparent' }} onClick={() => handleDelete(cls.id)}>
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '480px',
              height: '100%',
              borderRadius: '24px 0 0 24px',
              padding: '2.5rem',
              position: 'relative',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'var(--bg-darker)',
              border: 'none',
              borderLeft: '1px solid var(--surface-border)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>

            <button
              className="btn btn-ghost"
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.5rem' }}
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>{editingId ? 'Sinfni Tahrirlash' : 'Yangi Sinf Yaratish'}</h2>

            <form onSubmit={handleSubmit} className="flex-col gap-4">
              {/* Sinf raqami va Harf */}
              <div className="flex-between gap-4">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Sinf raqami *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Masalan: 10"
                    required
                    min={1}
                    max={12}
                    value={formData.grade}
                    onChange={e => handleGradeChange(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Harf (Bo'lim) *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="A, B, V, G..."
                    maxLength={3}
                    value={formData.section}
                    onChange={e => handleSectionChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Auto-generated name display */}
              <div className="input-group">
                <label className="input-label">Sinf nomi (avtomatik)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Sinf raqami va harf kiriting"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ background: 'rgba(99,102,241,0.05)', fontWeight: 600 }}
                />
              </div>

              {/* Xona raqami va Etaj */}
              <div className="flex-between gap-4">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">
                    <span className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <MapPin size={14} /> Xona raqami
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Masalan: 101, 205, Lab-3"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">
                    <span className="flex-center gap-1" style={{ justifyContent: 'flex-start' }}>
                      <Building2 size={14} /> Etaj
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Nechinchi etaj"
                    min={1}
                    max={10}
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* O'quvchilar Sig'imi */}
              <div className="input-group">
                <label className="input-label">O'quvchilar Sig'imi</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                <input
                  type="checkbox"
                  id="isActiveClass"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="isActiveClass" style={{ cursor: 'pointer' }}>Faol holatda</label>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, height: '3.5rem', borderRadius: '12px' }} onClick={() => setShowModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3.5rem', borderRadius: '12px' }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
