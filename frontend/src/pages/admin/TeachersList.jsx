import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Loader, X, DollarSign, Calendar } from 'lucide-react';
import { api } from '../../api';

export default function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ first_name: '', last_name: '', username: '', password: '', phone: '', monthly_salary: '' });

  // Salary report state
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryReport, setSalaryReport] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [salaryTeacherId, setSalaryTeacherId] = useState(null);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.getTeachers();
      setTeachers(res.results || res || []);
    } catch (err) {
      console.error("O'qituvchilarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher);
    setNewTeacher({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      username: teacher.username || '',
      password: '',
      phone: teacher.phone || '',
      monthly_salary: teacher.monthly_salary || '',
    });
    setShowModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingTeacher(null);
    setNewTeacher({ first_name: '', last_name: '', username: '', password: '', phone: '', monthly_salary: '' });
    setShowModal(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTeacher) {
        const updateData = { ...newTeacher };
        if (!updateData.password) delete updateData.password;
        if (updateData.monthly_salary === '') delete updateData.monthly_salary;
        await api.patchTeacher(editingTeacher.id, updateData);
        alert('✅ O\'qituvchi muvaffaqiyatli yangilandi!');
      } else {
        const createData = { ...newTeacher };
        if (createData.monthly_salary === '') delete createData.monthly_salary;
        const employee_id = 'TCH-' + Math.floor(10000 + Math.random() * 90000);
        await api.createTeacher({ ...createData, employee_id });
        alert('✅ O\'qituvchi muvaffaqiyatli yaratildi!');
      }
      setShowModal(false);
      setNewTeacher({ first_name: '', last_name: '', username: '', password: '', phone: '', monthly_salary: '' });
      setEditingTeacher(null);
      await loadTeachers();
    } catch (err) {
      console.error('Teacher saqlashda xato:', err);
      if (err?.status === 500) {
        alert("❌ Tizimda xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki boshqa login ishlating.");
      } else {
        const errMsg = err?.data
          ? Object.entries(err.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
          : (err?.message || 'Noma\'lum xatolik');
        alert("❌ Xatolik:\n" + errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!await window.confirm("Rostdan ham ushbu o'qituvchini o'chirmoqchimisiz?")) return;
    try {
      await api.deleteTeacher(id);
      await loadTeachers();
    } catch (err) {
      alert("O'chirishda xatolik: " + (err?.data ? JSON.stringify(err.data) : err?.message));
    }
  };

  const handleOpenSalaryReport = async (teacherId) => {
    setSalaryTeacherId(teacherId);
    setShowSalaryModal(true);
    await fetchSalaryReport(teacherId, salaryMonth, salaryYear);
  };

  const fetchSalaryReport = async (teacherId, month, year) => {
    setSalaryLoading(true);
    setSalaryReport(null);
    try {
      const res = await api.getTeacherSalaryReport(teacherId, month, year);
      setSalaryReport(res);
    } catch (err) {
      console.error('Maosh hisobotini yuklashda xato:', err);
      alert('Maosh hisobotini yuklashda xatolik!');
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleMonthChange = (month, year) => {
    setSalaryMonth(month);
    setSalaryYear(year);
    if (salaryTeacherId) fetchSalaryReport(salaryTeacherId, month, year);
  };

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " so'm";
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">O'qituvchilar ro'yxati</h1>
          <p className="text-muted">Haqiqiy baza orqali bog'langan tizim</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
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
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>O'qituvchi logini (I.O.F)</th>
                  <th>Username (Login)</th>
                  <th>Telefon raqami</th>
                  <th>Oylik maosh</th>
                  <th>Status</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Hech qanday o'qituvchi topilmadi
                    </td>
                  </tr>
                ) : teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>
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
                    <td style={{ color: 'var(--text-muted)' }}>@{teacher.username}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{teacher.phone || '-'}</td>
                    <td>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {teacher.monthly_salary ? formatMoney(teacher.monthly_salary) : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${teacher.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {teacher.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                        <button onClick={() => handleOpenSalaryReport(teacher.id)} className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--success)', borderColor: 'var(--surface-border)' }} title="Maosh hisoboti">
                          <DollarSign size={16} />
                        </button>
                        <button onClick={() => handleEditClick(teacher)} className="btn-outline flex-center" style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--accent)', borderColor: 'var(--surface-border)' }} title="Tahrirlash">
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

      {/* CREATE / EDIT Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">{editingTeacher ? "O'qituvchi ma'lumotlarini tahrirlash" : "Yangi O'qituvchi qo'shish"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="flex-col gap-4">
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Ism (First Name)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input required type="text" className="input-field" value={newTeacher.first_name} onChange={e => setNewTeacher({ ...newTeacher, first_name: e.target.value })} placeholder="Masalan: Sarvar" />
                  {!editingTeacher && (
                    <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => {
                      if (!newTeacher.first_name) return alert("Avval Ismni kiriting!");
                      const base = (newTeacher.first_name + (newTeacher.last_name || '')).toLowerCase().replace(/[^a-z0-9]/g, '');
                      const rNum = Math.floor(100 + Math.random() * 900);
                      const rPass = Math.floor(100000 + Math.random() * 900000);
                      setNewTeacher({ ...newTeacher, username: `${base}${rNum}`, password: rPass.toString() });
                    }} title="Avtomatik login/parol yaratish">
                      ✨
                    </button>
                  )}
                </div>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Familiya (Last Name)</label>
                <input required type="text" className="input-field" value={newTeacher.last_name} onChange={e => setNewTeacher({ ...newTeacher, last_name: e.target.value })} placeholder="Masalan: Boxodirov" />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Login (Username)</label>
                <input required disabled={!!editingTeacher} type="text" className="input-field" value={newTeacher.username} onChange={e => setNewTeacher({ ...newTeacher, username: e.target.value })} placeholder="Masalan: alisher123" />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Parol (Password) {editingTeacher && "(O'zgartirish ixtiyoriy)"}</label>
                <input required={!editingTeacher} type="text" className="input-field" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} placeholder={editingTeacher ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Telefon Raqam</label>
                <input required type="text" className="input-field" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} placeholder="+998 90 123 45 67" />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>💰 Oylik maosh (so'm)</label>
                <input type="number" className="input-field" value={newTeacher.monthly_salary} onChange={e => setNewTeacher({ ...newTeacher, monthly_salary: e.target.value })} placeholder="Masalan: 3000000" min="0" step="1000" />
                {newTeacher.monthly_salary > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>📊 Avtomatik hisob:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <span>Kunlik:</span><span style={{ fontWeight: 600 }}>{formatMoney(newTeacher.monthly_salary / 24)}</span>
                      <span>Soatlik:</span><span style={{ fontWeight: 600 }}>{formatMoney(newTeacher.monthly_salary / 24 / 8)}</span>
                      <span>Minutlik:</span><span style={{ fontWeight: 600 }}>{formatMoney(newTeacher.monthly_salary / 24 / 8 / 60)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? (editingTeacher ? "Yangilanmoqda..." : "Yaratilmoqda...") : (editingTeacher ? "Saqlash va Yangilash" : "Saqlash va Yaratish")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SALARY REPORT Modal */}
      {showSalaryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '700px', maxHeight: '85vh', overflow: 'auto', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="heading-3">💰 Maosh Hisoboti</h2>
              <button onClick={() => { setShowSalaryModal(false); setSalaryReport(null); }} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Month/Year selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <Calendar size={18} color="var(--primary)" />
              <select className="input-field" value={salaryMonth} onChange={e => handleMonthChange(parseInt(e.target.value), salaryYear)} style={{ width: 'auto' }}>
                {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select className="input-field" value={salaryYear} onChange={e => handleMonthChange(salaryMonth, parseInt(e.target.value))} style={{ width: 'auto' }}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {salaryLoading ? (
              <div className="flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
                <Loader className="spinner" size={32} color="var(--primary)" />
                <p className="text-muted">Hisobot yuklanmoqda...</p>
              </div>
            ) : salaryReport ? (
              <div className="flex-col gap-4">
                {/* Teacher info */}
                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{salaryReport.full_name}</h3>
                  <span className="text-muted">{salaryReport.employee_id}</span>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oylik maosh</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(salaryReport.monthly_salary)}</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelgan kunlar</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>{salaryReport.days_present} kun</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelmagan</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)' }}>{salaryReport.days_absent} kun</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kechikkan</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#eab308' }}>{salaryReport.days_late} kun ({salaryReport.total_late_minutes} min)</div>
                  </div>
                </div>

                {/* Financial summary */}
                <div style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Ishlagan kunlar uchun:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{formatMoney(salaryReport.total_earned)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Jarima (kechikish):</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{formatMoney(salaryReport.total_penalty)}</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Jami to'lanadigan:</span>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{formatMoney(salaryReport.final_salary)}</span>
                  </div>
                </div>

                {/* Rate info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="text-muted">Kunlik</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(salaryReport.daily_rate)}</div>
                  </div>
                  <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="text-muted">Soatlik</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(salaryReport.hourly_rate)}</div>
                  </div>
                  <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                    <div className="text-muted">Minutlik</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(salaryReport.minute_rate)}</div>
                  </div>
                </div>

                {/* Daily breakdown */}
                {salaryReport.daily_details && salaryReport.daily_details.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>📋 Kunlik tafsilot</h4>
                    <div className="table-container">
                      <table className="table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Sana</th>
                            <th>Holat</th>
                            <th>Kelish vaqti</th>
                            <th>Kechikish</th>
                            <th>Jarima</th>
                            <th>Kunlik</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salaryReport.daily_details.map((d, i) => (
                            <tr key={i}>
                              <td>{d.date}</td>
                              <td>
                                <span className={`badge ${d.status === 'Kelgan' ? 'badge-success' : d.status === 'Kechikkan' ? 'badge-warning' : 'badge-danger'}`}>
                                  {d.status}
                                </span>
                              </td>
                              <td>{d.check_in_time ? new Date(d.check_in_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                              <td style={{ color: d.late_minutes > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {d.late_minutes > 0 ? `${d.late_minutes} min` : '-'}
                              </td>
                              <td style={{ color: parseFloat(d.penalty_amount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                {parseFloat(d.penalty_amount) > 0 ? `-${formatMoney(d.penalty_amount)}` : '-'}
                              </td>
                              <td style={{ color: parseFloat(d.earned) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                {parseFloat(d.earned) > 0 ? formatMoney(d.earned) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Ma'lumot topilmadi</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
