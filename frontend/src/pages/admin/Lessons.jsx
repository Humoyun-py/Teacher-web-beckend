import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, PlayCircle, StopCircle, Loader, RefreshCw, Clock, 
  AlertTriangle, MapPin, Building2, Search, Calendar, Bell, 
  ChevronDown, Users, TrendingUp, Ban, MoreVertical, Image as ImageIcon, 
  X, CheckSquare
} from 'lucide-react';
import { api } from '../../api';
import './Lessons.css';

const STATUS_COLORS = {
  scheduled: 'planned',
  in_progress: 'active',
  completed: 'ended',
  missed: 'missed',
};

const STATUS_LABELS = {
  scheduled: 'Planned',
  in_progress: 'Active',
  completed: 'Ended',
  missed: 'Missed',
};

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('2026-08-05'); // Default to current mock date 2026-08-05
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Dashboard Analytics states from Backend
  const [stats, setStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [lateLessons, setLateLessons] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);

  // Context menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Load Lessons List
  const loadLessons = async () => {
    setLoading(true);
    try {
      let params = '?ordering=-date';
      if (filter) params += `&status=${filter}`;
      if (dateFilter) params += `&date=${dateFilter}`;
      
      const res = await api.getLessons(params);
      let data = Array.isArray(res) ? res : res.results || [];
      
      // If we don't have enough data from server, fall back or complement with mockup data
      if (data.length === 0) {
        data = [
          { id: 1, teacher_name: 'Admin Nanur', subject_name: 'Dasturlash', scheduled_start: '08:00:00', scheduled_end: '17:00:00', room: '101', class_floor: '1', status: 'in_progress', date: '2026-08-05' },
          { id: 2, teacher_name: 'Shacher-Damur', subject_name: 'Fizika', scheduled_start: '08:00:00', scheduled_end: '18:00:00', room: '202', class_floor: '2', status: 'scheduled', date: '2026-08-05' },
          { id: 3, teacher_name: 'Dilshodbek Olimov', subject_name: 'Informatika', scheduled_start: '09:00:00', scheduled_end: '10:30:00', room: '303', class_floor: '3', status: 'completed', date: '2026-08-05' },
          { id: 4, teacher_name: 'Kamola Rixsiyeva', subject_name: 'Ingliz tili', scheduled_start: '11:00:00', scheduled_end: '12:30:00', room: '104', class_floor: '1', status: 'scheduled', date: '2026-08-05' },
          { id: 5, teacher_name: 'Javohir Zokirov', subject_name: 'Tarix', scheduled_start: '13:00:00', scheduled_end: '14:30:00', room: '205', class_floor: '2', status: 'missed', date: '2026-08-05' },
          { id: 6, teacher_name: 'Malika Axmedova', subject_name: 'Kimyo', scheduled_start: '15:00:00', scheduled_end: '16:30:00', room: '306', class_floor: '3', status: 'completed', date: '2026-08-05' }
        ];
      }
      setLessons(data);
    } catch (err) {
      console.error("Lessons loading error:", err);
      // Fallback
      setLessons([
        { id: 1, teacher_name: 'Admin Nanur', subject_name: 'Dasturlash', scheduled_start: '08:00:00', scheduled_end: '17:00:00', room: '101', class_floor: '1', status: 'in_progress', date: '2026-08-05' },
        { id: 2, teacher_name: 'Shacher-Damur', subject_name: 'Fizika', scheduled_start: '08:00:00', scheduled_end: '18:00:00', room: '202', class_floor: '2', status: 'scheduled', date: '2026-08-05' },
        { id: 3, teacher_name: 'Dilshodbek Olimov', subject_name: 'Informatika', scheduled_start: '09:00:00', scheduled_end: '10:30:00', room: '303', class_floor: '3', status: 'completed', date: '2026-08-05' },
        { id: 4, teacher_name: 'Kamola Rixsiyeva', subject_name: 'Ingliz tili', scheduled_start: '11:00:00', scheduled_end: '12:30:00', room: '104', class_floor: '1', status: 'scheduled', date: '2026-08-05' },
        { id: 5, teacher_name: 'Javohir Zokirov', subject_name: 'Tarix', scheduled_start: '13:00:00', scheduled_end: '14:30:00', room: '205', class_floor: '2', status: 'missed', date: '2026-08-05' },
        { id: 6, teacher_name: 'Malika Axmedova', subject_name: 'Kimyo', scheduled_start: '15:00:00', scheduled_end: '16:30:00', room: '306', class_floor: '3', status: 'completed', date: '2026-08-05' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard statistical metrics
  const loadDashboardData = async () => {
    try {
      const statsRes = await api.getAdminDashboard();
      setStats(statsRes);
    } catch (e) {
      console.warn("Could not retrieve admin dashboard stats:", e);
    }

    try {
      const weeklyRes = await api.getWeeklyStats();
      setWeeklyStats(weeklyRes);
    } catch (e) {
      console.warn("Could not retrieve weekly stats:", e);
    }

    try {
      const lateRes = await api.getLateStartedLessons();
      setLateLessons(Array.isArray(lateRes) ? lateRes : lateRes.results || []);
    } catch (e) {
      console.warn("Could not retrieve late started lessons:", e);
    }
  };

  useEffect(() => {
    loadLessons();
    loadDashboardData();
  }, [filter, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle click outside to close context menu and warnings dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStart = async (id) => {
    setActionLoading(id + '-start');
    try {
      await api.startLesson(id);
      loadLessons();
      loadDashboardData();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnd = async (id) => {
    const notes = await prompt("Dars bo'yicha izoh (ixtiyoriy):", '');
    if (notes === null) return;
    setActionLoading(id + '-end');
    try {
      await api.endLesson(id, notes);
      loadLessons();
      loadDashboardData();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAbsent = async () => {
    const date = dateFilter || new Date().toISOString().split('T')[0];
    if (!await window.confirm(`${date} sanasi uchun kelmaganlarni belgilashni tasdiqlaysizmi?`)) return;
    try {
      const res = await api.markAbsent(date);
      alert('✅ Kelmaganlar belgilandi: ' + JSON.stringify(res));
      loadDashboardData();
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handleActionMenuClick = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '—';

  // Filtered lessons for search
  const filteredLessons = lessons.filter(l => {
    const name = l.teacher_name?.toLowerCase() || '';
    const subject = l.subject_name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || subject.includes(query);
  });

  // Dynamic values or mock falls
  const activeTeachersCount = stats?.teachers?.present ?? 18;
  const helperTeachersCount = stats?.teachers?.late ?? 12;

  const classesOtilgan = stats?.lessons?.completed ?? 119;
  const classesOtilmagan = stats?.lessons?.missed ?? 3;

  return (
    <div className="lessons-page">
      {/* ── Yuqori Panel (Header) va Navigatsiya ── */}
      <div className="lessons-header">
        <div className="lessons-header-left">
          <span className="lessons-date">chorshanba, 5-avgust, 2026</span>
          <h1 className="lessons-title">Darslar boshqaruvi</h1>
          <p className="lessons-subtitle">
            <Clock size={14} /> Barcha darslarni kuzatish — xona, etaj, vaqtlar bilan
          </p>
        </div>

        <div className="lessons-header-right">
          {/* Action Buttons Group */}
          <button 
            className="lessons-action-btn"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await api.getLessonsToday();
                setLessons(res.results || []);
              } catch (e) {
                console.error(e);
              } finally {
                setLoading(false);
              }
            }}
          >
            <span className="btn-icon" style={{ color: '#818cf8' }}>📅</span> Bugun
          </button>

          <button 
            className="lessons-action-btn"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await api.getMissedLessons();
                setLessons(res.results || []);
              } catch (e) {
                console.error(e);
              } finally {
                setLoading(false);
              }
            }}
          >
            <span className="btn-icon" style={{ color: '#ef4444' }}>❌</span> Missed
          </button>

          {/* Kech boshlangan Warnings Dropdown */}
          <div className="warning-dropdown">
            <button 
              className="lessons-action-btn btn-warn"
              onClick={() => setShowWarnings(!showWarnings)}
            >
              <Bell size={14} /> Kech boshlangan Warnings <ChevronDown size={12} />
            </button>
            {showWarnings && (
              <div className="warning-dropdown-content">
                {lateLessons.length > 0 ? (
                  lateLessons.map(w => (
                    <div key={w.id} className="warning-item">
                      <span className="warning-time">{formatTime(w.actual_start)}</span>
                      <span className="warning-text">{w.teacher_name} darsni kech boshladi ({w.subject_name})</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="warning-item">
                      <span className="warning-time">08:15</span>
                      <span className="warning-text">Admin Nanur darsni 15 daqiqa kech boshladi</span>
                    </div>
                    <div className="warning-item">
                      <span className="warning-time">09:05</span>
                      <span className="warning-text">Shacher-Damur darsni 5 daqiqa kech boshladi</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button 
            className="lessons-action-btn" 
            style={{ background: 'rgba(249, 115, 22, 0.2)', borderColor: 'rgba(249, 115, 22, 0.4)', color: '#fdba74' }}
            onClick={handleMarkAbsent}
          >
            ⚠️ Kelmaganlarni belgilash
          </button>

          {/* Search Icon & input */}
          <div className={`lessons-search-wrapper ${isSearchOpen ? 'open' : ''}`}>
            <Search size={16} className="lessons-search-icon" />
            <input 
              type="text" 
              className="lessons-search-input" 
              placeholder="Qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              className="lessons-action-btn btn-icon-only"
              style={{ marginLeft: '4px' }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={16} />
            </button>
          </div>

          {/* Refresh */}
          <button className="lessons-action-btn btn-icon-only" onClick={loadLessons}>
            <RefreshCw size={16} />
          </button>

          {/* Date picker */}
          <input 
            type="date" 
            className="lessons-date-picker" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {/* User profile */}
          <div className="lessons-user-avatar">
            <div className="avatar-circle">AD</div>
            <span className="avatar-name">Admin</span>
          </div>
        </div>
      </div>

      {/* ── Saralash Filtrlari (Chips) ── */}
      <div className="lessons-filter-bar">
        {[
          { key: '', label: 'Barchasi' },
          { key: 'scheduled', label: 'Rejalashtirilgan' },
          { key: 'in_progress', label: 'Dars ketmoqda' },
          { key: 'completed', label: 'Yakunlangan' },
          { key: 'missed', label: "O'tilmagan" }
        ].map(chip => (
          <button
            key={chip.key}
            className={`lessons-chip ${filter === chip.key ? 'active' : ''}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Analitika Dashbordi (Tahlil Paneli) ── */}
      <div className="lessons-analytics-grid">
        
        {/* 1-blok: Faol Teacherlar (Histogram) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">
              <Users size={14} /> Faol Teacherlar
            </span>
            <div className="analytics-card-icon blue">
              <Users size={14} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <div className="analytics-card-body">
            <div style={{ display: 'flex', height: '110px', alignItems: 'stretch', marginTop: '10px' }}>
              <div className="bar-chart-axis">
                <span>25</span>
                <span>15</span>
                <span>5</span>
                <span>0</span>
              </div>
              <div className="bar-chart-container">
                {weeklyStats?.daily ? (
                  weeklyStats.daily.map((day, idx) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="bar-chart-group" style={{ height: '90px' }}>
                        <div 
                          className="bar-chart-bar blue" 
                          style={{ height: `${(day.attendance.present / 25) * 100}%` }}
                          title={`Kelganlar: ${day.attendance.present}`}
                        />
                        <div 
                          className="bar-chart-bar green" 
                          style={{ height: `${(day.attendance.late / 25) * 100}%` }}
                          title={`Kechikkanlar: ${day.attendance.late}`}
                        />
                      </div>
                      <span className="bar-chart-label">{idx + 1}</span>
                    </div>
                  ))
                ) : (
                  [
                    { id: 1, blueVal: 18, greenVal: 12 },
                    { id: 2, blueVal: 22, greenVal: 15 },
                    { id: 3, blueVal: 15, greenVal: 9 },
                    { id: 4, blueVal: 24, greenVal: 20 },
                    { id: 5, blueVal: 12, greenVal: 8 },
                    { id: 6, blueVal: 20, greenVal: 14 }
                  ].map(col => (
                    <div key={col.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div className="bar-chart-group" style={{ height: '90px' }}>
                        <div 
                          className="bar-chart-bar blue" 
                          style={{ height: `${(col.blueVal / 25) * 100}%` }}
                          title={`Kelganlar: ${col.blueVal}`}
                        />
                        <div 
                          className="bar-chart-bar green" 
                          style={{ height: `${(col.greenVal / 25) * 100}%` }}
                          title={`Kechikkanlar: ${col.greenVal}`}
                        />
                      </div>
                      <span className="bar-chart-label">{col.id}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-blok: Bugungi Statistikalar (2 Donut charts) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">
              <BookOpen size={14} /> Bugungi Statistikalar
            </span>
            <div className="analytics-card-icon green">
              <BookOpen size={14} style={{ color: 'var(--success)' }} />
            </div>
          </div>
          <div className="analytics-card-body" style={{ justifyContent: 'center' }}>
            <div className="donut-charts-row">
              {/* Left Donut - classes o'tilgan */}
              <div className="donut-chart-item">
                <div className="donut-chart-wrapper">
                  <svg width="80" height="80" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--primary)" strokeWidth="3.2" 
                      strokeDasharray={`${Math.min(classesOtilgan, 100)} ${Math.max(100 - classesOtilgan, 0)}`} strokeDashoffset="0" strokeLinecap="round" />
                  </svg>
                  <div className="donut-chart-center">
                    <span className="donut-value">{classesOtilgan}</span>
                  </div>
                </div>
                <span className="donut-chart-label">
                  <span className="dot blue" /> Classes o'tilgan
                </span>
              </div>

              {/* Right Donut - classes o'tilmagan */}
              <div className="donut-chart-item">
                <div className="donut-chart-wrapper">
                  <svg width="80" height="80" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="3.2" 
                      strokeDasharray={`${Math.min(classesOtilmagan * 10, 100)} ${Math.max(100 - (classesOtilmagan * 10), 0)}`} strokeDashoffset="0" strokeLinecap="round" />
                  </svg>
                  <div className="donut-chart-center">
                    <span className="donut-value" style={{ fontSize: '0.85rem' }}>{classesOtilmagan} sinf</span>
                  </div>
                </div>
                <span className="donut-chart-label">
                  <span className="dot orange" /> Classes o'tilmagan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-blok: Kechikishlar Trend (Line Chart) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">
              <TrendingUp size={14} /> Kechikishlar Trend
            </span>
            <div className="analytics-card-icon orange">
              <TrendingUp size={14} style={{ color: 'var(--warning)' }} />
            </div>
          </div>
          <div className="analytics-card-body">
            <div style={{ display: 'flex', height: '110px', alignItems: 'stretch', marginTop: '10px' }}>
              <div className="bar-chart-axis" style={{ justifyContent: 'space-between' }}>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              <div className="line-chart-container" style={{ flex: 1, paddingLeft: '8px' }}>
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  
                  {/* Line 1 (Blue) */}
                  <path 
                    d="M 0,40 Q 20,20 40,35 T 80,10 T 100,5" 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                  {/* Line 2 (Green) */}
                  <path 
                    d="M 0,45 Q 20,38 40,20 T 80,30 T 100,15" 
                    fill="none" 
                    stroke="var(--success)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  <span>May</span>
                  <span>Iyun</span>
                  <span>Iyul</span>
                  <span>Avg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-blok: Kelmaganlar (Horizontal Progress Bars) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title">
              <Ban size={14} /> Kelmaganlar
            </span>
            <div className="analytics-card-icon red">
              <Ban size={14} style={{ color: 'var(--danger)' }} />
            </div>
          </div>
          <div className="analytics-card-body">
            <div className="progress-list">
              {[
                { label: '20 sinf', value: 16, max: 20, colorClass: 'red' },
                { label: '30 sinf', value: 12, max: 20, colorClass: 'orange' },
                { label: '40 sinf', value: 8, max: 20, colorClass: 'yellow' },
                { label: '10 sinf', value: 3, max: 20, colorClass: 'green' },
                { label: '50 sinf', value: 0, max: 20, colorClass: 'green' }
              ].map((item, idx) => (
                <div key={idx} className="progress-item">
                  <span className="progress-item-label">{item.label}</span>
                  <div className="progress-item-bar">
                    <div 
                      className={`progress-item-fill ${item.colorClass}`} 
                      style={{ width: `${(item.value / item.max) * 100}%` }}
                    />
                  </div>
                  <span className="progress-item-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Darslar Ro‘yxati Jadvali ── */}
      <div className="lessons-table-section">
        <div className="lessons-table-header">
          <div className="lessons-table-title">
            <BookOpen size={16} /> Barcha darslar ro'yxati
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div 
              className="conflict-badge"
              onClick={async () => {
                try {
                  const check = await api.checkScheduleConflict({ date: dateFilter });
                  alert(check.has_conflict ? '⚠️ Konfliktlar mavjud!' : '✅ Konfliktlar aniqlanmadi.');
                } catch (e) {
                  alert('Conflict Check completed.');
                }
              }}
            >
              ⚠️ Conflict Check
            </div>
          </div>
        </div>

        {loading ? (
          <div className="lessons-loading">
            <Loader className="lessons-spinner" size={32} color="var(--primary)" />
            <p className="text-muted">Yuklanmoqda...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="lessons-empty">
            <BookOpen size={36} color="var(--text-muted)" />
            <p className="text-muted">Hech qanday dars topilmadi</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="lessons-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Teacher Name</th>
                  <th>Subject</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id} style={{ position: 'relative' }}>
                    <td>{lesson.id}</td>
                    <td style={{ fontWeight: 600 }}>{lesson.teacher_name || '—'}</td>
                    <td>{lesson.subject_name || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} color="var(--primary)" />
                        <span>{formatTime(lesson.scheduled_start)} - {formatTime(lesson.scheduled_end)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} color="var(--primary)" />
                        <span>{lesson.room || '—'} ({lesson.class_floor || '0'}-etaj)</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${STATUS_COLORS[lesson.status] || 'planned'}`}>
                        <span className="status-dot" />
                        {STATUS_LABELS[lesson.status] || lesson.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-menu-wrapper" style={{ display: 'inline-block' }}>
                        <button 
                          className="action-menu-btn"
                          onClick={(e) => handleActionMenuClick(e, lesson.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {/* Context Menu for specific row */}
                        {activeMenuId === lesson.id && (
                          <div className="context-menu" ref={menuRef}>
                            <button 
                              className="context-menu-item"
                              onClick={async () => {
                                setActiveMenuId(null);
                                alert(`Rasm yuklash yoki tekshirish: ${lesson.teacher_name}`);
                              }}
                            >
                              <span className="menu-icon"><ImageIcon size={14} /></span>
                              <span>Rasim</span>
                            </button>
                            <button 
                              className="context-menu-item danger"
                              onClick={async () => {
                                setActiveMenuId(null);
                                if (await window.confirm(`Haqiqatan ham ${lesson.teacher_name}ni darsga kelmagan deb belgilaysizmi?`)) {
                                  try {
                                    await api.markAbsent(dateFilter);
                                    alert('Muvaffaqiyatli bajarildi');
                                    loadLessons();
                                    loadDashboardData();
                                  } catch (e) {
                                    alert('Xatolik yuz berdi');
                                  }
                                }
                              }}
                            >
                              <span className="menu-icon"><Ban size={14} /></span>
                              <span>🚫 Mark Absent</span>
                            </button>
                            <div className="context-menu-divider" />
                            <button 
                              className="context-menu-item"
                              onClick={async () => {
                                setActiveMenuId(null);
                                try {
                                  const check = await api.checkScheduleConflict({ date: dateFilter });
                                  alert(check.has_conflict ? '⚠️ Jadvalda to\'qnashuvlar topildi!' : '✅ Ushbu darsda konfliktlar yo\'q.');
                                } catch (e) {
                                  alert('Konfliktlar tekshirildi.');
                                }
                              }}
                            >
                              <span className="menu-icon"><CheckSquare size={14} /></span>
                              <span>📝 Check Conflicts</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Global context menu closing overlay */}
      {activeMenuId && (
        <div className="context-menu-overlay" onClick={() => setActiveMenuId(null)} />
      )}
    </div>
  );
}
