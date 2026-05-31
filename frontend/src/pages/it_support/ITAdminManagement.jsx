import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, Key, Unlock, Lock, Loader, Edit3, Check, X } from 'lucide-react';
import { api } from '../../api';

export default function ITAdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modallar
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ username: '', first_name: '', last_name: '', email: '', phone: '', password: '' });
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const loadAdmins = async () => {
    try {
      const res = await api.getITAdmins();
      setAdmins(res || []);
    } catch (e) {
      alert('Xatolik: Adminlar ro\'yxatini yuklab bo\'lmadi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert("Username va parolni to'ldirish majburiy!");
      return;
    }
    try {
      await api.createITAdmin(formData);
      alert('✅ Admin muvaffaqiyatli yaratildi!');
      setShowAddModal(false);
      setFormData({ username: '', first_name: '', last_name: '', email: '', phone: '', password: '' });
      loadAdmins();
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patchITAdmin(selectedAdmin.id, selectedAdmin);
      alert('✅ Admin ma\'lumotlari tahrirlandi!');
      setShowEditModal(false);
      loadAdmins();
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    }
  };

  const handleDelete = async (id, name) => {
    const confirm = await window.confirm(`Haqiqatan ham "${name}" adminini o'chirmoqchimisiz?`);
    if (!confirm) return;
    try {
      await api.deleteITAdmin(id);
      alert('✅ Admin o\'chirildi!');
      loadAdmins();
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    }
  };

  const handleToggleBlock = async (id, name) => {
    try {
      const res = await api.toggleITUserBlock(id);
      alert(`✅ ${name} ${res.is_active ? 'blokdan chiqarildi' : 'bloklandi'}!`);
      loadAdmins();
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
      return;
    }
    try {
      await api.resetITUserPassword(selectedAdmin.id, newPassword);
      alert(`✅ ${selectedAdmin.username} paroli muvaffaqiyatli almashtirildi!`);
      setShowPassModal(false);
      setNewPassword('');
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    }
  };

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '70vh' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">Adminlar boshqaruvi yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Adminlar boshqaruvi</h1>
          <p className="text-muted">Tizimdagi adminlar ro'yxati, huquqlari va bloklash sozlamalari</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> Yangi Admin Qo'shish
        </button>
      </div>

      {/* Adminlar jadvali */}
      <div className="glass" style={{ overflowX: 'auto', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.85rem' }}>F.I.SH. / Username</th>
              <th style={{ padding: '0.85rem' }}>Email / Telefon</th>
              <th style={{ padding: '0.85rem' }}>Rol</th>
              <th style={{ padding: '0.85rem' }}>Status</th>
              <th style={{ padding: '0.85rem', textAlign: 'right' }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Hech qanday admin topilmadi.
                </td>
              </tr>
            ) : (
              admins.map((adm) => (
                <tr key={adm.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'all 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1rem' }}>
                    <div className="flex-col" style={{ gap: '0.1rem' }}>
                      <span style={{ fontWeight: 600 }}>{adm.first_name ? `${adm.first_name} ${adm.last_name || ''}` : 'Admin'}</span>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>@{adm.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex-col" style={{ gap: '0.1rem', fontSize: '0.88rem' }}>
                      <span>{adm.email || '—'}</span>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>{adm.phone || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${adm.role === 'it_support' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      {adm.role === 'it_support' ? 'IT Support' : 'Admin'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${adm.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {adm.is_active ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', color: 'var(--primary)' }}
                        onClick={() => { setSelectedAdmin(adm); setShowEditModal(true); }}
                        title="Tahrirlash"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', color: 'var(--warning)' }}
                        onClick={() => { setSelectedAdmin(adm); setShowPassModal(true); }}
                        title="Parolni almashtirish"
                      >
                        <Key size={15} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', color: adm.is_active ? 'var(--danger)' : 'var(--success)' }}
                        onClick={() => handleToggleBlock(adm.id, adm.username)}
                        title={adm.is_active ? "Bloklash" : "Blokdan chiqarish"}
                      >
                        {adm.is_active ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', color: 'var(--danger)' }}
                        onClick={() => handleDelete(adm.id, adm.username)}
                        title="O'chirish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '450px', padding: '2rem', gap: '1.25rem' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Yangi admin qo'shish</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Username</label>
                <input type="text" className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Ism</label>
                <input type="text" className="input-field" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Familiya</label>
                <input type="text" className="input-field" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Telefon</label>
                <input type="text" className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+998" />
              </div>
              <div className="input-group">
                <label className="input-label">Parol</label>
                <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Yaratish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '450px', padding: '2rem', gap: '1.25rem' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Admin ma'lumotlarini tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Username</label>
                <input type="text" className="input-field" value={selectedAdmin.username} onChange={e => setSelectedAdmin({ ...selectedAdmin, username: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Ism</label>
                <input type="text" className="input-field" value={selectedAdmin.first_name || ''} onChange={e => setSelectedAdmin({ ...selectedAdmin, first_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Familiya</label>
                <input type="text" className="input-field" value={selectedAdmin.last_name || ''} onChange={e => setSelectedAdmin({ ...selectedAdmin, last_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input-field" value={selectedAdmin.email || ''} onChange={e => setSelectedAdmin({ ...selectedAdmin, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Telefon</label>
                <input type="text" className="input-field" value={selectedAdmin.phone || ''} onChange={e => setSelectedAdmin({ ...selectedAdmin, phone: e.target.value })} />
              </div>
              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPassModal && selectedAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '400px', padding: '2rem', gap: '1.25rem' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Parolni yangilash</h3>
              <button onClick={() => setShowPassModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}><b>@{selectedAdmin.username}</b> foydalanuvchisi uchun yangi parol o'rnating.</p>
            <form onSubmit={handleResetPassword} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Yangi parol</label>
                <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Kamida 6 ta belgi" />
              </div>
              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPassModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Almashtirish</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
