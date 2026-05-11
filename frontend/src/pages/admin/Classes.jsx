import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { GraduationCap, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', grade: '', section: '', capacity: 30, is_active: true });

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
        capacity: cls.capacity || 30, 
        is_active: cls.is_active 
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', grade: '', section: '', capacity: 30, is_active: true });
    }
    setShowModal(true);
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
    if (!window.confirm("Rostdan ham bu sinfni o'chirmoqchimisiz?")) return;
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
    c.grade.toString().includes(search)
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
                <th>Nomi</th>
                <th>Sinf darajasi</th>
                <th>Guruh/Harf</th>
                <th>Sig'imi</th>
                <th>Status</th>
                <th>O'qituvchilar</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Yuklanmoqda...</td></tr>
              ) : filteredClasses.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Hech narsa topilmadi</td></tr>
              ) : (
                filteredClasses.map(cls => (
                  <tr key={cls.id}>
                    <td style={{ fontWeight: 600 }}>{cls.name}</td>
                    <td>{cls.grade}</td>
                    <td>{cls.section || '-'}</td>
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
        <div className="modal-overlay flex-center animate-fade-in">
          <div className="modal-content glass-panel" style={{ width: '450px', padding: '1.5rem', position: 'relative' }}>
            <button 
              className="btn btn-outline" 
              style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem', border: 'none' }}
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="heading-3 mb-4">{editingId ? 'Sinfni Tahrirlash' : 'Yangi Sinf'}</h2>
            
            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Sinf Nomi</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Masalan: 10-A Matematika"
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="flex-between gap-4">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Sinf Darajasi (Grade)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Masalan: 10"
                    required 
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: parseInt(e.target.value) || ''})}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Guruh / Harf (ixtiyoriy)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="A, B, V..."
                    value={formData.section}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">O'quvchilar Sig'imi</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                <input 
                  type="checkbox" 
                  id="isActiveClass"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                <label htmlFor="isActiveClass" style={{ cursor: 'pointer' }}>Faol holatda</label>
              </div>
              
              <div className="flex-center gap-2 mt-2">
                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary flex-1">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
