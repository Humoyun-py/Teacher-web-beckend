import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download, QrCode, Search, Loader, X, Maximize,
  BarChart3, Clock, AlertTriangle, UserCheck, Users,
  MoreHorizontal, Eye, User, FileText, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw,
  Inbox
} from 'lucide-react';
import { api } from '../../api';
import './QRCheckinData.css';

/* ── helpers ── */
const fmt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const fmtDate = (d) => {
  if (!d) return '-';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
  }
  return d;
};

const statusMap = {
  present: { label: "O'z vaqtida", cls: 'qr-badge-present', color: '#4ade80' },
  late:    { label: 'Kechikkan',   cls: 'qr-badge-late',    color: '#fbbf24' },
  absent:  { label: 'Kelmagan',    cls: 'qr-badge-absent',  color: '#f87171' },
  excused: { label: 'Sababli',     cls: 'qr-badge-excused', color: '#60a5fa' },
};

export default function QRCheckinData() {
  /* ── state ── */
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // filters
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterLate, setFilterLate] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // QR modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // action menus
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // today stats
  const [todayStats, setTodayStats] = useState(null);

  /* ── close action menu on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── fetch attendance logs ── */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQ) params.append('search', searchQ);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);
      if (filterLate === 'true') params.append('is_late', 'true');
      if (filterLate === 'false') params.append('is_late', 'false');
      params.append('page', page);
      params.append('page_size', pageSize);

      const q = params.toString() ? `?${params.toString()}` : '';
      const res = await api.getAttendanceLogs(q);
      setLogs(res.results || []);
      setTotalCount(res.count || (res.results ? res.results.length : 0));
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [searchQ, filterStatus, filterDate, filterLate, page, pageSize]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* ── fetch today stats ── */
  useEffect(() => {
    api.getAttendanceToday()
      .then(res => setTodayStats(res))
      .catch(() => {});
  }, []);

  /* ── QR modal ── */
  const fetchQRCode = async () => {
    setShowQRModal(true);
    setQrLoading(true);
    try {
      const res = await api.getQRCodes();
      if (res.results && res.results.length > 0) {
        setQrData(res.results[0].code);
      } else {
        const createRes = await api.generateStaticQR();
        setQrData(createRes.code);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = err.message || JSON.stringify(err.data || err);
      alert("QR Kodni olishda yoki yaratishda xato yuz berdi: " + errorMsg);
      setQrData(null);
    } finally {
      setQrLoading(false);
    }
  };

  /* ── Excel export (existing UI-only functionality) ── */
  const handleExport = () => {
    // Build CSV from current logs
    if (!logs.length) return;
    const headers = ['Sana', 'Kirish vaqti', 'Chiqish vaqti', "O'qituvchi", 'Holati', "Qo'shimcha"];
    const rows = logs.map(l => [
      l.date,
      l.check_in_time ? fmt(l.check_in_time) : '-',
      l.check_out_time ? fmt(l.check_out_time) : '-',
      l.teacher_name || '-',
      l.status_display || l.status || '-',
      l.is_late ? `${l.late_minutes} daqiqa kechikdi` : (l.notes || '-'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Nazoratlar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── clear filters ── */
  const clearFilters = () => {
    setSearchQ('');
    setFilterStatus('');
    setFilterDate('');
    setFilterLate('');
    setPage(1);
  };

  const hasFilters = searchQ || filterStatus || filterDate || filterLate;

  /* ── stats from today API ── */
  const statsCards = (() => {
    const ts = todayStats || {};
    const total = ts.total_teachers || 0;
    const present = ts.present_count || 0;
    const late = ts.late_count || 0;
    const absent = ts.absent_count || 0;
    const totalPresent = present + late;
    return [
      {
        icon: <BarChart3 size={20} />,
        label: 'Jami skanerlar',
        value: totalPresent + absent,
        desc: 'Bugun',
        bg: 'rgba(99,102,241,0.12)',
        accent: '#818cf8',
        descBg: 'rgba(99,102,241,0.1)',
        descColor: '#818cf8',
      },
      {
        icon: <Clock size={20} />,
        label: "O'z vaqtida",
        value: present,
        desc: total ? `${Math.round((present / total) * 100)}%` : '0%',
        bg: 'rgba(34,197,94,0.12)',
        accent: '#4ade80',
        descBg: 'rgba(34,197,94,0.1)',
        descColor: '#4ade80',
      },
      {
        icon: <AlertTriangle size={20} />,
        label: 'Kechikkan',
        value: late,
        desc: total ? `${Math.round((late / total) * 100)}%` : '0%',
        bg: 'rgba(245,158,11,0.12)',
        accent: '#fbbf24',
        descBg: 'rgba(245,158,11,0.1)',
        descColor: '#fbbf24',
      },
      {
        icon: <UserCheck size={20} />,
        label: 'Kelmagan',
        value: absent,
        desc: total ? `${Math.round((absent / total) * 100)}%` : '0%',
        bg: 'rgba(239,68,68,0.12)',
        accent: '#f87171',
        descBg: 'rgba(239,68,68,0.1)',
        descColor: '#f87171',
      },
      {
        icon: <Users size={20} />,
        label: "O'qituvchilar soni",
        value: total,
        desc: 'Jami faol',
        bg: 'rgba(139,92,246,0.12)',
        accent: '#a78bfa',
        descBg: 'rgba(139,92,246,0.1)',
        descColor: '#a78bfa',
      },
    ];
  })();

  /* ── pagination helpers ── */
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  /* ── skeleton rows ── */
  const SkeletonRows = () => (
    <>
      {Array.from({ length: pageSize > 5 ? 6 : pageSize }).map((_, i) => (
        <tr key={i} className="qr-skeleton-row">
          <td><div className="qr-skeleton-bar w-20" /></td>
          <td>
            <div className="qr-skeleton-bar w-24" />
            <div className="qr-skeleton-bar w-20 h-8" />
          </td>
          <td>
            <div className="qr-skeleton-bar w-40" />
            <div className="qr-skeleton-bar w-24 h-8" />
          </td>
          <td><div className="qr-skeleton-bar w-24" /></td>
          <td><div className="qr-skeleton-bar w-32" /></td>
          <td><div className="qr-skeleton-bar w-24" /></td>
          <td><div className="qr-skeleton-bar w-24" /></td>
          <td><div className="qr-skeleton-bar w-16" /></td>
        </tr>
      ))}
    </>
  );

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>

      {/* ── 1. PAGE HEADER ── */}
      <div className="qr-page-header">
        <div className="flex-center gap-3">
          <div className="qr-stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <QrCode size={22} color="#818cf8" />
          </div>
          <div>
            <h1>Barcha QR Nazoratlar</h1>
            <p className="qr-subtitle">Turniketdan va o'qituvchilardan o'tgan barcha skaner tarixlari</p>
          </div>
        </div>
        <div className="qr-header-actions">
          <button className="btn btn-primary" onClick={fetchQRCode}>
            <Maximize size={17} /> QR Kodni Ko'rsatish
          </button>
          <button className="qr-btn-export" onClick={handleExport}>
            <Download size={17} /> Excel ga yuklash
          </button>
        </div>
      </div>

      {/* ── 2. STATISTICS CARDS ── */}
      <div className="qr-stats-grid">
        {statsCards.map((c, i) => (
          <div className="qr-stat-card" key={i}>
            <div className="qr-stat-icon" style={{ background: c.bg, color: c.accent }}>
              {c.icon}
            </div>
            <div className="qr-stat-info">
              <div className="qr-stat-label">{c.label}</div>
              <div className="qr-stat-value">{c.value}</div>
              <span className="qr-stat-desc" style={{ background: c.descBg, color: c.descColor }}>
                {c.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. SEARCH & FILTER ── */}
      <div className="qr-filter-bar">
        <div className="qr-search-wrap">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            className="qr-search-input"
            placeholder="Ism orqali izlash..."
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setPage(1); }}
          />
        </div>

        <input
          type="date"
          className="qr-filter-select"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(1); }}
          style={{ minWidth: 150 }}
        />

        <select
          className="qr-filter-select"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Holati: Barchasi</option>
          <option value="present">O'z vaqtida</option>
          <option value="late">Kechikkan</option>
          <option value="absent">Kelmagan</option>
          <option value="excused">Sababli</option>
        </select>

        <select
          className="qr-filter-select"
          value={filterLate}
          onChange={e => { setFilterLate(e.target.value); setPage(1); }}
        >
          <option value="">Qo'shimcha: Barchasi</option>
          <option value="true">Kechikkanlar</option>
          <option value="false">O'z vaqtida kelganlar</option>
        </select>

        <div className="qr-filter-spacer" />

        {hasFilters && (
          <button className="qr-btn-clear" onClick={clearFilters}>
            <RotateCcw size={14} /> Filtrni tozalash
          </button>
        )}
      </div>

      {/* ── 4. QR HISTORY TABLE ── */}
      <div className="qr-table-wrapper">
        <div className="qr-table-scroll">
          <table className="qr-table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Kirish / Chiqish vaqti</th>
                <th>O'qituvchi (F.I.O)</th>
                <th>Holati</th>
                <th>Qo'shimcha</th>
                <th>Joy</th>
                <th>Qurilma</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="qr-empty-state">
                      <div className="qr-empty-icon">
                        <Inbox size={28} color="var(--text-muted)" />
                      </div>
                      <div className="qr-empty-title">Hozircha hech qanday ma'lumot yo'q</div>
                      <div className="qr-empty-desc">
                        {hasFilters
                          ? "Filtrlaringizga mos keluvchi yozuv topilmadi. Filtrlarni tozalab qaytadan urinib ko'ring."
                          : "Hali hech qanday QR nazorat yozuvi mavjud emas."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const st = statusMap[log.status] || statusMap.absent;
                  return (
                    <tr key={log.id}>
                      {/* Sana */}
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {fmtDate(log.date)}
                      </td>

                      {/* Kirish / Chiqish vaqti */}
                      <td>
                        {log.check_in_time && (
                          <div className="qr-time-entry">
                            <span className="qr-time-value">{fmt(log.check_in_time)}</span>
                            <span className="qr-time-label in">Kirish</span>
                          </div>
                        )}
                        {log.check_out_time && (
                          <div className="qr-time-entry">
                            <span className="qr-time-value">{fmt(log.check_out_time)}</span>
                            <span className="qr-time-label out">Chiqish</span>
                          </div>
                        )}
                        {!log.check_in_time && !log.check_out_time && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>

                      {/* Teacher */}
                      <td>
                        <div className="qr-teacher-name">{log.teacher_name || '-'}</div>
                        {log.teacher_employee_id && (
                          <div className="qr-teacher-subject">ID: {log.teacher_employee_id}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`qr-badge ${st.cls}`}>
                          <span className="qr-badge-dot" style={{ background: st.color }} />
                          {st.label}
                        </span>
                      </td>

                      {/* Qo'shimcha */}
                      <td>
                        <span className="qr-notes">
                          {log.is_late ? (
                            <span className="qr-late-note">{log.late_minutes} daqiqa kechikdi</span>
                          ) : (
                            log.notes || '—'
                          )}
                        </span>
                      </td>

                      {/* Joy */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {log.qr_code ? 'QR orqali' : '—'}
                      </td>

                      {/* Qurilma */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {log.qr_code ? 'QR Skaner' : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ position: 'relative' }}>
                        <div ref={openMenuId === log.id ? menuRef : null}>
                          <button
                            className="qr-action-btn"
                            onClick={() => setOpenMenuId(openMenuId === log.id ? null : log.id)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openMenuId === log.id && (
                            <div className="qr-action-menu">
                              <button onClick={() => { setOpenMenuId(null); }}>
                                <Eye size={15} /> Batafsil ko'rish
                              </button>
                              <button onClick={() => { setOpenMenuId(null); }}>
                                <User size={15} /> Teacher profilini ko'rish
                              </button>
                              <button onClick={() => { setOpenMenuId(null); }}>
                                <FileText size={15} /> Recordni ko'rish
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. PAGINATION ── */}
      {!loading && logs.length > 0 && (
        <div className="qr-pagination">
          <div className="qr-page-info">
            Jami <strong>{totalCount}</strong> ta yozuv
          </div>

          <div className="qr-page-buttons">
            <button className="qr-page-btn" disabled={page <= 1} onClick={() => setPage(1)}>
              <ChevronsLeft size={15} />
            </button>
            <button className="qr-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={15} />
            </button>

            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} style={{ padding: '0 0.4rem', color: 'var(--text-muted)' }}>...</span>
              ) : (
                <button
                  key={p}
                  className={`qr-page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}

            <button className="qr-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={15} />
            </button>
            <button className="qr-page-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              <ChevronsRight size={15} />
            </button>
          </div>

          <div className="qr-page-size">
            <span>Sahifadagi qatorlar:</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* ── QR CODE MODAL ── */}
      {showQRModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-content">
            <div className="qr-modal-header">
              <h2>Maktab QR Kodi</h2>
              <button className="qr-modal-close" onClick={() => setShowQRModal(false)}>
                <X size={20} />
              </button>
            </div>

            {qrLoading ? (
              <div className="flex-center flex-col gap-3" style={{ padding: '2rem' }}>
                <Loader className="qr-spinner" size={32} color="var(--primary)" />
                <p className="text-muted">QR Kod generatsiya qilinmoqda...</p>
              </div>
            ) : (
              <div className="flex-col flex-center gap-4">
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
                  {qrData ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`}
                      alt="QR Code"
                      style={{ width: '250px', height: '250px' }}
                    />
                  ) : (
                    <p style={{ color: 'black', padding: '2rem' }}>QR kod topilmadi</p>
                  )}
                </div>
                <p className="text-muted" style={{ fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.5 }}>
                  Ushbu QR kodni chop etib maktab kirish qismiga ilib qo'ying.
                  O'qituvchilar o'z kabinetlari orqali skaner qilib darsga kelganlarini tasdiqlashadi.
                </p>
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${qrData}`;
                    link.download = 'Maktab_QR_Kod.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download size={18} /> Yuklab olish (Sifatli)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
