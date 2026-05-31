import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Loader, RefreshCw, Eye, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../../api';

export default function ITSalaryKPI() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [reports, setReports] = useState({});
  const [calculating, setCalculating] = useState(false);

  // Detail view state
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadTeachersAndSalaries = async () => {
    setLoading(true);
    try {
      const teachRes = await api.getTeachers();
      const list = teachRes.results || teachRes || [];
      setTeachers(list);
      
      // Load salary reports for all teachers in parallel
      setCalculating(true);
      const reportsData = {};
      await Promise.all(
        list.map(async (t) => {
          try {
            const report = await api.getTeacherSalaryReport(t.id, month, year);
            reportsData[t.id] = report;
          } catch (e) {
            console.error(`Failed to load salary for teacher ${t.id}`, e);
          }
        })
      );
      setReports(reportsData);
    } catch (err) {
      console.error(err);
      alert('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
      setCalculating(false);
    }
  };

  useEffect(() => {
    loadTeachersAndSalaries();
  }, [month, year]);

  const handleOpenDetail = (teacherId) => {
    const report = reports[teacherId];
    if (!report) {
      alert('Ushbu o\'qituvchi uchun hisobot topilmadi.');
      return;
    }
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('uz-UZ') + " so'm";
  };

  const filteredTeachers = teachers.filter(t => {
    const fullName = `${t.first_name || ''} ${t.last_name || ''} ${t.username || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Maoshlar va KPI Boshqaruvi (IT Support)</h1>
          <p className="text-muted">Kunlik davomat va kechikishlar asosida oylik maoshlarni real-time hisoblash</p>
        </div>
        <button className="btn btn-outline" onClick={loadTeachersAndSalaries} disabled={calculating}>
          <RefreshCw size={15} className={calculating ? 'spinner' : ''} /> Yangilash
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
          <select className="input-field" value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ width: 'auto' }}>
            {['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'].map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select className="input-field" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: 'auto' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Salary Overview Table */}
      <div className="table-container glass" style={{ flex: 1, marginTop: '1rem' }}>
        {loading ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={36} color="var(--primary)" />
            <p className="text-muted">Maosh ma'lumotlari hisoblanmoqda...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <DollarSign size={48} color="var(--text-muted)" />
            <p className="text-muted">O'qituvchilar topilmadi.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>O'qituvchi</th>
                <th>Oylik stavka</th>
                <th>Kelgan / Kelmagan kunlar</th>
                <th>Kechikish jarimasi</th>
                <th>Yakuniy to'lov</th>
                <th style={{ textAlign: 'right' }}>Batafsil</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(t => {
                const rep = reports[t.id];
                return (
                  <tr key={t.id} className="table-row-hover">
                    <td>
                      <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.full_name || t.username)}&background=6366f1&color=fff`} alt="" style={{ width: '100%', height: '100%' }} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600 }}>{t.full_name || `${t.first_name || ''} ${t.last_name || ''}`}</span>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {t.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{t.monthly_salary ? formatMoney(t.monthly_salary) : '—'}</span>
                    </td>
                    <td>
                      {rep ? (
                        <div className="flex-col" style={{ fontSize: '0.85rem' }}>
                          <span className="text-success">{rep.days_present} kun kelgan</span>
                          <span className="text-danger">{rep.days_absent} kun kelmagan</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {rep ? (
                        <span className={rep.total_penalty > 0 ? 'text-danger' : 'text-muted'} style={{ fontWeight: 600 }}>
                          {rep.total_penalty > 0 ? `-${formatMoney(rep.total_penalty)}` : "0 so'm"}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {rep ? (
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                          {formatMoney(rep.final_salary)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--primary)' }}
                        onClick={() => handleOpenDetail(t.id)}
                        disabled={!rep}
                      >
                        <Eye size={12} /> Tafsilot
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Salary Detail Modal */}
      {showDetailModal && selectedReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '650px', maxHeight: '85vh', padding: '2rem', gap: '1.25rem', overflowY: 'auto' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0 }}>💰 Oylik hisob tafsilotlari</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px' }}>
              <h4 style={{ margin: 0 }}>{selectedReport.full_name}</h4>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>{selectedReport.employee_id} • {month}-oy / {year}-yil</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                <div className="text-muted">Kunlik stavka</div>
                <div style={{ fontWeight: 600 }}>{formatMoney(selectedReport.daily_rate)}</div>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                <div className="text-muted">Soatlik stavka</div>
                <div style={{ fontWeight: 600 }}>{formatMoney(selectedReport.hourly_rate)}</div>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                <div className="text-muted">Minutlik stavka</div>
                <div style={{ fontWeight: 600 }}>{formatMoney(selectedReport.minute_rate)}</div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span>Ishlagan kunlar hisobi:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>+{formatMoney(selectedReport.total_earned)}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span>Kechikish jarimasi ({selectedReport.total_late_minutes} daqiqa):</span>
                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-{formatMoney(selectedReport.total_penalty)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 0' }} />
              <div className="flex-between">
                <span style={{ fontWeight: 700 }}>To'lanadigan yakuniy maosh:</span>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{formatMoney(selectedReport.final_salary)}</span>
              </div>
            </div>

            {selectedReport.daily_details && selectedReport.daily_details.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>📋 Kunlik davomat va hisob tafsiloti</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--surface-border)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0 }}>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ padding: '0.5rem' }}>Sana</th>
                        <th style={{ padding: '0.5rem' }}>Holat</th>
                        <th style={{ padding: '0.5rem' }}>Kechikish</th>
                        <th style={{ padding: '0.5rem' }}>Jarima</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Ishlangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.daily_details.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.5rem' }}>{d.date}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span style={{ 
                              color: d.status === 'Kelgan' ? 'var(--success)' : d.status === 'Kechikkan' ? 'var(--warning)' : 'var(--danger)',
                              fontWeight: 600 
                            }}>{d.status}</span>
                          </td>
                          <td style={{ padding: '0.5rem', color: d.late_minutes > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {d.late_minutes > 0 ? `${d.late_minutes} min` : '—'}
                          </td>
                          <td style={{ padding: '0.5rem', color: parseFloat(d.penalty_amount) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {parseFloat(d.penalty_amount) > 0 ? `-${formatMoney(d.penalty_amount)}` : '—'}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', color: parseFloat(d.earned) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            {parseFloat(d.earned) > 0 ? formatMoney(d.earned) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
