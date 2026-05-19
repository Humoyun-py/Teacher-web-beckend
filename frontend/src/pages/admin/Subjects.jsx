import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { BookOpen, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await api.getSubjects();
      setSubjects(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingId(subject.id);
      setFormData({ name: subject.name, description: subject.description || '', is_active: subject.is_active });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', is_active: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateSubject(editingId, formData);
      } else {
        await api.createSubject(formData);
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!await window.confirm("Rostdan ham bu fanni o'chirmoqchimisiz?")) return;
    try {
      await api.deleteSubject(id);
      fetchSubjects();
    } catch (err) {
      console.error(err);
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in flex-col gap-4">
      <div className="flex-between">
        <h1 className="heading-2">Fanlar</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Yangi Fan Qo'shish
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
                <th>Tavsif</th>
                <th>Status</th>
                <th>O'qituvchilar soni</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Yuklanmoqda...</td></tr>
              ) : filteredSubjects.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Hech narsa topilmadi</td></tr>
              ) : (
                filteredSubjects.map(sub => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600 }}>{sub.name}</td>
                    <td className="text-muted">{sub.description || '-'}</td>
                    <td>
                      <span className={`badge ${sub.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {sub.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td>{sub.teachers_count || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderColor: 'transparent' }} onClick={() => handleOpenModal(sub)}>
                          <Edit2 size={16} className="text-primary" />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', borderColor: 'transparent' }} onClick={() => handleDelete(sub.id)}>
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
          <div className="modal-content glass-panel" style={{ width: '400px', padding: '1.5rem', position: 'relative' }}>
            <button 
              className="btn btn-outline" 
              style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem', border: 'none' }}
              onClick={() => setShowModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="heading-3 mb-4">{editingId ? 'Fanni Tahrirlash' : 'Yangi Fan'}</h2>
            
            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Nomi</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Tavsif (ixtiyoriy)</label>
                <textarea 
                  className="input-field" 
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                <label htmlFor="isActive" style={{ cursor: 'pointer' }}>Faol holatda</label>
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
