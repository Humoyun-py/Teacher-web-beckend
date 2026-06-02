import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Search, Loader, X, DollarSign, Calendar, 
  BookOpen, Award, CheckCircle, ShieldAlert, Key, ToggleLeft, ToggleRight,
  BookmarkCheck, School
} from 'lucide-react';
import { api } from '../../api';

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2, 6, 23, 0.75)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '2rem 1rem',
  overflowY: 'auto',
};

const modalCardStyle = {
  width: '100%',
  padding: '2rem',
  gap: '1.25rem',
  maxHeight: 'calc(100dvh - 4rem)',
  overflowY: 'auto',
  margin: 'auto 0',
};

export default function ITTeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modallar
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  // Form states
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newTeacher, setNewTeacher] = useState({ first_name: '', last_name: '', username: '', password: '', phone: '', monthly_salary: '', status: 'active' });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Assignment states
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Salary report state
  const [salaryReport, setSalaryReport] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const [techRes, subRes, classRes] = await Promise.all([
        api.getTeachers(),
        api.getSubjects(),
        api.getClasses()
      ]);
      setTeachers(techRes.results || techRes || []);
      setSubjects(subRes.results || subRes || []);
      setClasses(classRes.results || classRes || []);
    } catch (err) {
      console.error(err);
      alert("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTeacher(null);
    setNewTeacher({ first_name: '', last_name: '', username: '', password: '', phone: '', monthly_salary: '', status: 'active' });
    setShowModal(true);
  };

  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher);
    setNewTeacher({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      username: teacher.username || '',
      password: '',
      phone: teacher.phone || '',
      monthly_salary: teacher.monthly_salary || '',
      status: teacher.status || 'active'
    });
    setShowModal(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        const updateData = { ...newTeacher };
        if (!updateData.password) delete updateData.password;
        if (updateData.monthly_salary === '') delete updateData.monthly_salary;
        await api.patchTeacher(editingTeacher.id, updateData);
        alert('✅ O\'qituvchi muvaffaqiyatli tahrirlandi!');
      } else {
        const employee_id = 'TCH-' + Math.floor(10000 + Math.random() * 90000);
        await api.createTeacher({ ...newTeacher, employee_id });
        alert('✅ Yangi o\'qituvchi yaratildi!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("❌ Xatolik: " + JSON.stringify(err.data || err.message));
    }
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!await window.confirm(`Rostdan ham "${name}" o'qituvchisini o'chirmoqchimisiz?`)) return;
    try {
      await api.deleteTeacher(id);
      alert('✅ O\'qituvchi o\'chirildi!');
      loadData();
    } catch (err) {
      alert("Xatolik: " + JSON.stringify(err.data || err.message));
    }
  };

  const handleToggleBlock = async (id, name) => {
    try {
      const res = await api.toggleITUserBlock(id);
      alert(`✅ ${name} ${res.is_active ? 'blokdan chiqarildi (Faol)' : 'bloklandi (Nofaol)'}!`);
      loadData();
    } catch (err) {
      alert("Xatolik: " + JSON.stringify(err.data || err.message));
    }
  };

  const handleOpenAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedSubjects(teacher.subject_ids || teacher.subjects?.map(s => s.id) || []);
    setSelectedClasses(teacher.class_ids || teacher.classes?.map(c => c.id) || []);
    setShowAssignModal(true);
  };

  const handleSaveAssignments = async () => {
    try {
      await Promise.all([
        api.assignSubjectsToTeacher(selectedTeacher.id, selectedSubjects),
        api.assignClassesToTeacher(selectedTeacher.id, selectedClasses)
      ]);
      alert('✅ Fan va sinflar muvaffaqiyatli biriktirildi!');
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      alert("Xatolik: " + JSON.stringify(err.data || err.message));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Parol kamida 6 belgidan iborat bo\'lishi kerak!');
      return;
    }
    try {
      await api.resetITUserPassword(selectedTeacher.id, newPassword);
      alert(`✅ @${selectedTeacher.username} paroli yangilandi!`);
      setShowPassModal(false);
      setNewPassword('');
    } catch (err) {
      alert("Xatolik: " + JSON.stringify(err.data || err.message));
    }
  };

  const handleOpenSalary = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowSalaryModal(true);
    fetchSalaryReport(teacher.id, salaryMonth, salaryYear);
  };

  const fetchSalaryReport = async (teacherId, month, year) => {
    setSalaryLoading(true);
    try {
      const res = await api.getTeacherSalaryReport(teacherId, month, year);
      setSalaryReport(res);
    } catch (err) {
      console.error(err);
      alert('Maosh hisobotini yuklab bo\'lmadi.');
    } finally {
      setSalaryLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.first_name || ''} ${t.last_name || ''} ${t.username || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('uz-UZ') + " so'm";
  };

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '70vh' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">O'qituvchilar ro'yxati yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">O'qituvchilar Boshqaruvi (IT Support)</h1>
          <p className="text-muted">Barcha o'qituvchi profillarini to'liq nazorat qilish</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} /> Yangi O'qituvchi Qo'shish
        </button>
      </div>

      {/* Filter / Table */}
      <div className="glass flex-col" style={{ padding: '1.5rem', gap: '1.25rem' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="O'qituvchi ismi, logini..." 
            style={{ paddingLeft: '2.5rem' }} 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem' }}>F.I.SH. / ID</th>
                <th style={{ padding: '0.85rem' }}>Username / Telefon</th>
                <th style={{ padding: '0.85rem' }}>Fanlar / Sinflar</th>
                <th style={{ padding: '0.85rem' }}>Oylik / Status</th>
                <th style={{ padding: '0.85rem', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Hech qanday o'qituvchi topilmadi.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-border)' }} className="table-row-hover">
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden' }}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.full_name || t.username)}&background=6366f1&color=fff`} alt="" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600 }}>{t.full_name || `${t.first_name || ''} ${t.last_name || ''}`}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{t.employee_id || 'ID yo\'q'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-col" style={{ fontSize: '0.88rem' }}>
                        <span>@{t.username}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{t.phone || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-col" style={{ gap: '0.2rem', maxWidth: '220px' }}>
                        <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <BookOpen size={12} /> {t.subjects?.map(s => s.name).join(', ') || 'Fan biriktirilmagan'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <School size={12} /> {t.classes?.map(c => c.name).join(', ') || 'Sinf biriktirilmagan'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex-col" style={{ gap: '0.15rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9rem' }}>{t.monthly_salary ? formatMoney(t.monthly_salary) : '—'}</span>
                        <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                          {t.status || 'active'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--success)' }} onClick={() => handleOpenSalary(t)} title="Maosh Report"><DollarSign size={15} /></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--primary)' }} onClick={() => handleOpenAssign(t)} title="Fan & Sinf Biriktirish"><BookmarkCheck size={15} /></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--warning)' }} onClick={() => { setSelectedTeacher(t); setShowPassModal(true); }} title="Parol Almashtirish"><Key size={15} /></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--accent)' }} onClick={() => handleEditClick(t)} title="Tahrirlash"><Edit size={15} /></button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: t.status === 'active' ? 'var(--danger)' : 'var(--success)' }} onClick={() => handleToggleBlock(t.user_id || t.id, t.username)} title={t.status === 'active' ? "Bloklash" : "Aktivlashtirish"}>
                          {t.status === 'active' ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }} onClick={() => handleDeleteTeacher(t.id, t.full_name)} title="O'chirish"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT Modal */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div className="glass flex-col" style={{ ...modalCardStyle, maxWidth: '450px' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>{editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveTeacher} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Ism</label>
                <input required type="text" className="input-field" value={newTeacher.first_name} onChange={e => setNewTeacher({ ...newTeacher, first_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Familiya</label>
                <input required type="text" className="input-field" value={newTeacher.last_name} onChange={e => setNewTeacher({ ...newTeacher, last_name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input required disabled={!!editingTeacher} type="text" className="input-field" value={newTeacher.username} onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })} />
              </div>
              {!editingTeacher && (
                <div className="input-group">
                  <label className="input-label">Parol</label>
                  <input required type="password" className="input-field" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Telefon raqam</label>
                <input required type="text" className="input-field" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Oylik maosh (so'm)</label>
                <input type="number" className="input-field" value={newTeacher.monthly_salary} onChange={e => setNewTeacher({ ...newTeacher, monthly_salary: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="input-field" value={newTeacher.status} onChange={e => setNewTeacher({ ...newTeacher, status: e.target.value })}>
                  <option value="active">Active (Faol)</option>
                  <option value="inactive">Inactive (Nofaol)</option>
                </select>
              </div>
              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTeacher && (
        <div style={modalOverlayStyle}>
          <div className="glass flex-col" style={{ ...modalCardStyle, maxWidth: '500px' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Fan va Sinflarni biriktirish</h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>O'qituvchi: <b>{selectedTeacher.full_name || selectedTeacher.username}</b></p>
            
            <div className="flex-col gap-4">
              {/* Subjects */}
              <div className="flex-col gap-2">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><BookOpen size={16} /> Biriktirilgan fanlar</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  {subjects.map(s => (
                    <label key={s.id} className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedSubjects.includes(s.id)} 
                        onChange={e => {
                          if (e.target.checked) setSelectedSubjects([...selectedSubjects, s.id]);
                          else setSelectedSubjects(selectedSubjects.filter(id => id !== s.id));
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Classes */}
              <div className="flex-col gap-2">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><School size={16} /> Biriktirilgan sinflar</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  {classes.map(c => (
                    <label key={c.id} className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedClasses.includes(c.id)} 
                        onChange={e => {
                          if (e.target.checked) setSelectedClasses([...selectedClasses, c.id]);
                          else setSelectedClasses(selectedClasses.filter(id => id !== c.id));
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAssignModal(false)}>Bekor qilish</button>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveAssignments}>Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPassModal && selectedTeacher && (
        <div style={modalOverlayStyle}>
          <div className="glass flex-col" style={{ ...modalCardStyle, maxWidth: '400px' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>O'qituvchi parolini yangilash</h3>
              <button onClick={() => setShowPassModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}><b>@{selectedTeacher.username}</b> uchun yangi parol o'rnating.</p>
            <form onSubmit={handleResetPassword} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Yangi parol</label>
                <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Kamida 6 ta belgi" />
              </div>
              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPassModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Yangilash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && selectedTeacher && (
        <div style={modalOverlayStyle}>
          <div className="glass flex-col" style={{ ...modalCardStyle, maxWidth: '650px' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>💰 Maosh Hisoboti</h3>
              <button onClick={() => setShowSalaryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Calendar size={18} color="var(--primary)" />
              <select className="input-field" value={salaryMonth} onChange={e => { setSalaryMonth(e.target.value); fetchSalaryReport(selectedTeacher.id, e.target.value, salaryYear); }} style={{ width: 'auto' }}>
                {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select className="input-field" value={salaryYear} onChange={e => { setSalaryYear(e.target.value); fetchSalaryReport(selectedTeacher.id, salaryMonth, e.target.value); }} style={{ width: 'auto' }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {salaryLoading ? (
              <div className="flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
                <Loader className="spinner" size={32} color="var(--primary)" />
                <p className="text-muted">Yuklanmoqda...</p>
              </div>
            ) : salaryReport ? (
              <div className="flex-col gap-4">
                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px' }}>
                  <h4 style={{ margin: 0 }}>{salaryReport.full_name}</h4>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{salaryReport.employee_id}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oylik maosh</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{formatMoney(salaryReport.monthly_salary)}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelgan kunlar</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>{salaryReport.days_present} kun</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelmagan</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)' }}>{salaryReport.days_absent} kun</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kechikishlar</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#eab308' }}>{salaryReport.days_late} kun</div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span>Ishlagan kunlari uchun:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{formatMoney(salaryReport.total_earned)}</span>
                  </div>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span>Kechikish jarimasi:</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{formatMoney(salaryReport.total_penalty)}</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 0' }} />
                  <div className="flex-between">
                    <span style={{ fontWeight: 700 }}>To'lanadigan yakuniy summa:</span>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{formatMoney(salaryReport.final_salary)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted" style={{ textAlign: 'center' }}>Hisobot yuklanmadi.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
