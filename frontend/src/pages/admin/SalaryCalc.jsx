import { useState, useEffect } from 'react';
import { DollarSign, Calendar, Loader, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../../api';

export default function SalaryCalc() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [_salaryRecords, _setSalaryRecords] = useState([]);
  const [_salaryReportLoading, setSalaryReportLoading] = useState(false);
  const [globalSalaryReport, setGlobalSalaryReport] = useState(null);

  useEffect(() => {
    api.getTeachers().then(res => {
      setTeachers(res.results || res || []);
      setTeachersLoading(false);
    }).catch(() => setTeachersLoading(false));
  }, []);

  const fetchReport = async (teacherId, m, y) => {
    if (!teacherId) return;
    setLoading(true);
    setReport(null);
    try {
      const res = await api.getTeacherSalaryReport(teacherId, m, y);
      setReport(res);
    } catch (err) {
      console.error('Xatolik:', err);
      alert("Hisobotni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherChange = (id) => {
    setSelectedTeacher(id);
    if (id) fetchReport(id, month, year);
  };

  const handleDateChange = (m, y) => {
    setMonth(m); setYear(y);
    if (selectedTeacher) fetchReport(selectedTeacher, m, y);
    fetchGlobalSalaryReport(m, y);
  };

  const fetchGlobalSalaryReport = async (m, y) => {
    setSalaryReportLoading(true);
    try {
      const res = await api.getSalaryReport(`?month=${m}&year=${y}`);
      setGlobalSalaryReport(res);
    } catch (err) {
      console.error('Global salary report xato:', err);
    } finally {
      setSalaryReportLoading(false);
    }
  };

  const handleCalculateSalary = async () => {
    if (!window.confirm(`${monthNames[month-1]} ${year} uchun barcha o'qituvchilar maoshini hisoblashni tasdiqlaysizmi?`)) return;
    try {
      const res = await api.calculateSalary({ month, year });
      alert('✅ ' + (res.message || 'Maosh hisoblandi'));
      fetchGlobalSalaryReport(month, year);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handleApproveSalary = async () => {
    if (!globalSalaryReport?.results?.length) return alert('Avval maosh hisoblang');
    if (!window.confirm('Barcha hisoblangan maoshlarni tasdiqlashni xohlaysizmi?')) return;
    try {
      for (const record of globalSalaryReport.results.slice(0, 10)) {
        if (record.status === 'calculated') await api.approveSalary(record.id);
      }
      alert('✅ Maoshlar tasdiqlandi');
      fetchGlobalSalaryReport(month, year);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handlePaySalary = async () => {
    if (!globalSalaryReport?.results?.length) return alert('Avval maosh hisoblang');
    if (!window.confirm('Barcha tasdiqlangan maoshlarni to\'langan deb belgilashni xohlaysizmi?')) return;
    try {
      for (const record of globalSalaryReport.results.slice(0, 10)) {
        if (record.status === 'approved') await api.paySalary(record.id);
      }
      alert('✅ Maoshlar to\'langan deb belgilandi');
      fetchGlobalSalaryReport(month, year);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const fmt = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('uz-UZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " so'm";
  };

  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div className="flex-between">
        <div>
          <h1 className="heading-2">💰 Oylik Hisoblash</h1>
          <p className="text-muted">O'qituvchi oylik maoshini hisoblash (replace va jarimalar bilan)</p>
        </div>
        <div className="flex-center gap-2">
          <button className="btn btn-primary" onClick={handleCalculateSalary}>
            📊 Hisoblash
          </button>
          <button className="btn btn-warning" onClick={handleApproveSalary}>
            ✓ Tasdiqlash
          </button>
          <button className="btn btn-success" onClick={handlePaySalary}>
            💵 To'lash
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
            <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />O'qituvchi
          </label>
          {teachersLoading ? (
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader className="spinner" size={16} /> Yuklanmoqda...
            </div>
          ) : (
            <select className="input-field" value={selectedTeacher} onChange={e => handleTeacherChange(e.target.value)}>
              <option value="">-- O'qituvchi tanlang --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
              ))}
            </select>
          )}
        </div>
        <div className="input-group" style={{ minWidth: '130px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
            <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />Oy
          </label>
          <select className="input-field" value={month} onChange={e => handleDateChange(parseInt(e.target.value), year)}>
            {monthNames.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="input-group" style={{ minWidth: '100px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Yil</label>
          <select className="input-field" value={year} onChange={e => handleDateChange(month, parseInt(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {!selectedTeacher ? (
        <div className="glass flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', padding: '3rem', color: 'var(--text-muted)' }}>
          <DollarSign size={56} style={{ opacity: 0.2 }} />
          <p>O'qituvchini tanlang</p>
        </div>
      ) : loading ? (
        <div className="glass flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
          <Loader className="spinner" size={36} color="var(--primary)" />
          <p className="text-muted">Hisobot yuklanmoqda...</p>
        </div>
      ) : report ? (
        <div className="flex-col gap-4">
          {/* Global Salary Report Summary */}
          {globalSalaryReport && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 className="heading-3" style={{ fontSize: '1rem', marginBottom: '1rem' }}>📊 Umumiy Maosh Hisoboti</h3>
              <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                {[
                  { label: 'Jami yozuvlar', value: globalSalaryReport.count || globalSalaryReport.results?.length || 0, color: 'var(--primary)' },
                  { label: 'Hisoblangan', value: globalSalaryReport.results?.filter(r => r.status === 'calculated').length || 0, color: 'var(--warning)' },
                  { label: 'Tasdiqlangan', value: globalSalaryReport.results?.filter(r => r.status === 'approved').length || 0, color: 'var(--success)' },
                  { label: "To'langan", value: globalSalaryReport.results?.filter(r => r.status === 'paid').length || 0, color: 'var(--accent)' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Teacher info */}
          <div className="glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', overflow: 'hidden', flexShrink: 0 }}>
              <img src={`https://ui-avatars.com/api/?name=${report.full_name}&background=6366f1&color=fff`} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>{report.full_name}</h3>
              <span className="text-muted">{report.employee_id} • {monthNames[month-1]} {year}</span>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Oylik maosh', value: fmt(report.monthly_salary), color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)' },
              { label: 'Kelgan kunlar', value: `${report.days_present} kun`, color: 'var(--success)', bg: 'rgba(34,197,94,0.1)' },
              { label: 'Kelmagan', value: `${report.days_absent} kun`, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Kechikkan', value: `${report.days_late} kun`, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
              { label: "O'z darslari", value: `${report.own_lessons} ta`, color: 'var(--primary)', bg: 'rgba(99,102,241,0.08)' },
              { label: "O'rniga o'tilgan", value: `${report.replaced_in_count} ta`, color: 'var(--success)', bg: 'rgba(34,197,94,0.08)' },
              { label: 'Replace bo\'lgan', value: `${report.replaced_out_count} ta`, color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)' },
            ].map((c, i) => (
              <div key={i} style={{ padding: '1rem', background: c.bg, borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Financial breakdown */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>📊 Moliyaviy hisob</h4>
            <div className="flex-col gap-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="flex-center gap-2"><TrendingUp size={16} color="var(--success)" /> Ishlagan kunlar uchun:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{fmt(report.total_earned)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="flex-center gap-2"><TrendingUp size={16} color="var(--success)" /> O'rinbosar darslar uchun:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{fmt(report.replacement_earned)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="flex-center gap-2"><TrendingDown size={16} color="var(--danger)" /> Replace bo'lgan darslar:</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{fmt(report.replaced_out_deduction)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="flex-center gap-2"><TrendingDown size={16} color="var(--danger)" /> Kechikish jarimasi:</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{fmt(report.total_penalty)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>💰 Jami to'lanadigan:</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: parseFloat(report.final_salary) >= 0 ? 'var(--primary)' : 'var(--danger)' }}>{fmt(report.final_salary)}</span>
              </div>
            </div>
          </div>

          {/* Replace details */}
          {report.replaced_in_count > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>✅ Boshqalar o'rniga o'tilgan darslar</h4>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Fan</th><th>Asl ustoz</th><th>Sabab</th></tr></thead>
                  <tbody>
                    {report.replaced_in_details.map((d, i) => (
                      <tr key={i}><td>{d.date}</td><td>{d.subject}</td><td>{d.original_teacher}</td><td>{d.reason || '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.replaced_out_count > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--danger)' }}>❌ Replace bo'lgan darslar (bu ustozdan olingan)</h4>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Fan</th><th>O'rinbosar</th><th>Sabab</th></tr></thead>
                  <tbody>
                    {report.replaced_out_details.map((d, i) => (
                      <tr key={i}><td>{d.date}</td><td>{d.subject}</td><td>{d.replacement_teacher}</td><td>{d.reason || '-'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily attendance */}
          {report.daily_details && report.daily_details.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>📋 Kunlik davomat</h4>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Holat</th><th>Kelish</th><th>Kechikish</th><th>Jarima</th><th>Kunlik</th></tr></thead>
                  <tbody>
                    {report.daily_details.map((d, i) => (
                      <tr key={i}>
                        <td>{d.date}</td>
                        <td><span className={`badge ${d.status === 'Kelgan' ? 'badge-success' : d.status === 'Kechikkan' ? 'badge-warning' : 'badge-danger'}`}>{d.status}</span></td>
                        <td>{d.check_in_time ? new Date(d.check_in_time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td style={{ color: d.late_minutes > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{d.late_minutes > 0 ? `${d.late_minutes} min` : '-'}</td>
                        <td style={{ color: parseFloat(d.penalty_amount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{parseFloat(d.penalty_amount) > 0 ? `-${fmt(d.penalty_amount)}` : '-'}</td>
                        <td style={{ color: parseFloat(d.earned) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>{parseFloat(d.earned) > 0 ? fmt(d.earned) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
