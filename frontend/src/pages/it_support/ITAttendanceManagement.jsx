import React, { useState, useEffect } from 'react';
import { 
  QrCode, Calendar, Loader, RefreshCw, Edit3, X, UserCheck, UserX, 
  Clock, Search, PlusCircle 
} from 'lucide-react';
import { api } from '../../api';

const STATUS_LABELS = {
  present: 'Kelgan',
  late: 'Kechikkan',
  absent: 'Kelmagan',
  not_checked_in: 'Kutilmoqda'
};

const STATUS_COLORS = {
  present: 'badge-success',
  late: 'badge-warning',
  absent: 'badge-danger',
  not_checked_in: 'badge-outline'
};

export default function ITAttendanceManagement() {
  const [teachers, setTeachers] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    status: 'present',
    check_in_time: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [techRes, attRes] = await Promise.all([
        api.getTeachers(),
        api.getAttendanceLogs(`?date=${date}`)
      ]);
      setTeachers(techRes.results || techRes || []);
      setAttendanceLogs(attRes.results || attRes || []);
    } catch (e) {
      console.error(e);
      alert('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const handleOpenOverride = (teacher, currentAtt = null) => {
    setSelectedTeacher(teacher);
    let checkInVal = '';
    if (currentAtt && currentAtt.check_in_time) {
      // Format to HH:MM
      const dateObj = new Date(currentAtt.check_in_time);
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const mins = String(dateObj.getMinutes()).padStart(2, '0');
      checkInVal = `${hours}:${mins}`;
    }
    setOverrideForm({
      status: currentAtt ? currentAtt.status : 'present',
      check_in_time: checkInVal,
      notes: currentAtt?.notes || ''
    });
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const data = {
        teacher_id: selectedTeacher.id,
        date: date,
        status: overrideForm.status,
        notes: overrideForm.notes
      };

      if (overrideForm.check_in_time && overrideForm.status !== 'absent') {
        data.check_in_time = overrideForm.check_in_time;
      }

      await api.fixITAttendance(data);
      alert('✅ Davomat muvaffaqiyatli to\'g\'rilandi!');
      setShowOverrideModal(false);
      loadData();
    } catch (e) {
      alert('Xatolik: ' + JSON.stringify(e.data || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Combine teachers and their attendance status for the selected date
  const combinedData = teachers.map(teacher => {
    const att = attendanceLogs.find(a => a.teacher === teacher.id);
    return {
      teacher,
      attendance: att || null
    };
  }).filter(item => {
    const fullName = `${item.teacher.first_name || ''} ${item.teacher.last_name || ''} ${item.teacher.username || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Davomat va QR Nazorat (IT Support)</h1>
          <p className="text-muted">Kunlik davomat monitoringi va qo'lda chetlab o'tish (Override) imkoniyati</p>
        </div>
        <button className="btn btn-outline" onClick={loadData}>
          <RefreshCw size={15} /> Yangilash
        </button>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="O'qituvchi ismi bo'yicha..." 
            style={{ paddingLeft: '2.5rem' }} 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="var(--primary)" />
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-container glass" style={{ flex: 1, marginTop: '1rem' }}>
        {loading ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={36} color="var(--primary)" />
            <p className="text-muted">Davomat ma'lumotlari yuklanmoqda...</p>
          </div>
        ) : combinedData.length === 0 ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <QrCode size={48} color="var(--text-muted)" />
            <p className="text-muted">Hech qanday ma'lumot topilmadi.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>O'qituvchi</th>
                <th>Sana</th>
                <th>Skanerlash vaqti (Kelish)</th>
                <th>Status</th>
                <th>Izoh</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {combinedData.map(({ teacher, attendance }) => {
                const status = attendance ? attendance.status : 'not_checked_in';
                return (
                  <tr key={teacher.id} className="table-row-hover">
                    <td>
                      <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.full_name || teacher.username)}&background=6366f1&color=fff`} alt="" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600 }}>{teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>@{teacher.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.88rem' }}>{date}</span>
                    </td>
                    <td>
                      {attendance?.check_in_time ? (
                        <div className="flex-center gap-1" style={{ justifyContent: 'flex-start', fontSize: '0.88rem' }}>
                          <Clock size={13} color="var(--success)" />
                          <span>{new Date(attendance.check_in_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{attendance?.notes || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}
                        onClick={() => handleOpenOverride(teacher, attendance)}
                      >
                        <Edit3 size={12} /> Override
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Override Modal */}
      {showOverrideModal && selectedTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '440px', padding: '2rem', gap: '1.25rem' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>Davomatni Override qilish</h3>
              <button onClick={() => setShowOverrideModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '0.85rem', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', fontSize: '0.85rem' }}>
              O'qituvchi: <b>{selectedTeacher.full_name || selectedTeacher.username}</b><br/>
              Sana: <b>{date}</b>
            </div>

            <form onSubmit={handleSaveOverride} className="flex-col gap-4">
              {/* Status */}
              <div className="input-group">
                <label className="input-label">Davomat holati (Status)</label>
                <select className="input-field" value={overrideForm.status} onChange={e => setOverrideForm({ ...overrideForm, status: e.target.value })}>
                  <option value="present">Present (Kelgan)</option>
                  <option value="late">Late (Kechikkan)</option>
                  <option value="absent">Absent (Kelmagan)</option>
                </select>
              </div>

              {/* Check in time */}
              {overrideForm.status !== 'absent' && (
                <div className="input-group">
                  <label className="input-label">Kelgan vaqti (Check-in time)</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={overrideForm.check_in_time} 
                    onChange={e => setOverrideForm({ ...overrideForm, check_in_time: e.target.value })}
                    required 
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Agar kiritilmasa, hozirgi vaqt saqlanadi.</span>
                </div>
              )}

              {/* Notes */}
              <div className="input-group">
                <label className="input-label">Sabab / Izoh (Notes)</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '70px', padding: '0.5rem 0.75rem', resize: 'none' }}
                  value={overrideForm.notes} 
                  onChange={e => setOverrideForm({ ...overrideForm, notes: e.target.value })}
                  placeholder="Override sababi yoki izoh yozing..."
                />
              </div>

              <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowOverrideModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={actionLoading}>
                  {actionLoading ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
