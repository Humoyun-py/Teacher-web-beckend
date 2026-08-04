import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Plus, RefreshCw, Clock, X, Check, Loader, BookOpen, 
  Users, MapPin, Building2, Download, ChevronLeft, ChevronRight, 
  FileText, Shield, Video, HelpCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import { api } from '../../api';
import './Schedule.css';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00'
];

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0]);

  // Date navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week'); // 'week' | 'day'

  // Filters state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Form for schedule creation
  const [form, setForm] = useState({
    teacher: '', subject: '', school_class: '',
    day_of_week: 1, start_time: '08:00', end_time: '08:45', room: '',
  });

  // Load static/initial dropdown values (only once)
  const loadDropdowns = async () => {
    try {
      const [tch, sub, cls] = await Promise.allSettled([
        api.getTeachers(),
        api.getSubjects(),
        api.getClasses(),
      ]);
      
      if (tch.status === 'fulfilled') setTeachers(tch.value.results || tch.value || []);
      if (sub.status === 'fulfilled') setSubjects(sub.value.results || sub.value || []);
      if (cls.status === 'fulfilled') setClasses(cls.value.results || cls.value || []);
    } catch (e) {
      console.error('Error loading filter dropdown data:', e);
    }
  };

  // Main API data loader with active filters
  const loadScheduleData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setFilterLoading(true);
    }
    
    try {
      let scheduleQuery = '?';
      let lessonQuery = '?limit=1000&';
      
      if (selectedClass) {
        scheduleQuery += `school_class=${selectedClass}&`;
        lessonQuery += `school_class=${selectedClass}&`;
      }
      if (selectedSubject) {
        scheduleQuery += `subject=${selectedSubject}&`;
        lessonQuery += `subject=${selectedSubject}&`;
      }
      if (selectedTeacher) {
        scheduleQuery += `teacher=${selectedTeacher}&`;
        lessonQuery += `teacher=${selectedTeacher}&`;
      }

      const [sch, les] = await Promise.allSettled([
        api.getSchedules(scheduleQuery),
        api.getLessons(lessonQuery)
      ]);
      
      if (sch.status === 'fulfilled') {
        const raw = sch.value;
        if (Array.isArray(raw)) setSchedules(raw);
        else if (Array.isArray(raw.results)) setSchedules(raw.results);
        else if (raw && typeof raw === 'object') {
          const flat = Object.values(raw).flat().filter(Array.isArray(Object.values(raw)[0]) ? Boolean : () => false);
          setSchedules(flat.length ? flat : []);
        } else setSchedules([]);
      }
      
      if (les.status === 'fulfilled') {
        const raw = les.value;
        setLessons(raw.results || raw || []);
      }
    } catch (e) { 
      console.error('Error fetching schedules & lessons:', e); 
    } finally { 
      setLoading(false); 
      setFilterLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedTeacher]);

  // Load dropdown lists on mount
  useEffect(() => {
    loadDropdowns();
  }, []);

  // Reload schedules & lessons when filter parameters change
  useEffect(() => {
    loadScheduleData(false);
  }, [loadScheduleData]);

  // Helper date functions
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5); // Saturday

  const weekDays = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Format week range Uzbek
  const formatWeekRange = (start, end) => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const startYear = start.getFullYear();

    if (start.getMonth() !== end.getMonth()) {
      return `${startDay} ${startMonth} – ${endDay} ${endMonth}, ${startYear}`;
    }
    return `${startDay}–${endDay} ${startMonth}, ${startYear}`;
  };

  // Sinf tanlanganda avtomatik xona to'ldirish
  const handleClassChange = (classId) => {
    const selectedClassObj = classes.find(c => c.id === parseInt(classId));
    setForm({ 
      ...form, 
      school_class: classId,
      room: selectedClassObj?.room || form.room,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Konflikt tekshirish
      const conflict = await api.checkScheduleConflict(form);
      if (conflict.has_conflict) {
        const ok = await window.confirm(`⚠️ Konflikt aniqlandi:\n${JSON.stringify(conflict.conflicts || {})}\n\nYaratishni davom ettirasizmi?`);
        if (!ok) return setSubmitting(false);
      }
      await api.createSchedule(form);
      setShowModal(false);
      setForm({ teacher: '', subject: '', school_class: '', day_of_week: 1, start_time: '08:00', end_time: '08:45', room: '' });
      loadScheduleData(true);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!await window.confirm("Bu jadvalni o'chirmoqchimisiz?")) return;
    try {
      await api.deleteSchedule(id);
      setSchedules(schedules.filter(s => s.id !== id));
      if (selectedLesson && selectedLesson.id === id) {
        setSelectedLesson(null);
      }
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateFromSchedule(genDate);
      alert(`✅ ${res.created_count || 0} ta dars yaratildi!`);
      setShowGenModal(false);
      loadScheduleData(true);
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { 
      setGenerating(false); 
    }
  };

  // CSV Exporter client-side
  const handleExport = () => {
    const headers = ['Kun', 'Vaqt', 'Fan', 'O\'qituvchi', 'Sinf', 'Xona'];
    const rows = schedules.map(s => [
      DAYS[s.day_of_week - 1] || s.day_of_week,
      `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
      s.subject_name || s.subject || '',
      s.teacher_name || '',
      s.class_name || s.school_class || '',
      s.room || s.class_room || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dars_jadvali_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Match lesson status helper
  const getLessonStatusInfo = (scheduleItem, dateStr) => {
    const matched = lessons.find(l => 
      l.date === dateStr && 
      (l.schedule === scheduleItem.id || 
       (l.teacher === scheduleItem.teacher && 
        l.subject === scheduleItem.subject && 
        l.school_class === scheduleItem.school_class &&
        l.scheduled_start?.slice(0, 5) === scheduleItem.start_time?.slice(0, 5)))
    );

    if (!matched) {
      return { status: 'scheduled', label: 'Rejalashtirilgan', colorClass: 'sch-status-scheduled', detail: matched };
    }

    if (matched.status === 'completed') {
      if (matched.actual_end) {
        return { status: 'video', label: 'Video yuborilgan', colorClass: 'sch-status-video', detail: matched };
      }
      return { status: 'completed', label: 'O\'tilgan', colorClass: 'sch-status-completed', detail: matched };
    }

    if (matched.status === 'missed') {
      return { status: 'missed', label: 'O\'tilmagan', colorClass: 'sch-status-missed', detail: matched };
    }

    if (matched.started_late || matched.status === 'in_progress') {
      return { status: 'late', label: 'Kechikkan / Darsda', colorClass: 'sch-status-late', detail: matched };
    }

    return { status: 'scheduled', label: 'Rejalashtirilgan', colorClass: 'sch-status-scheduled', detail: matched };
  };

  // Calculate stats based on current visible range and filters
  const getStats = () => {
    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];
    const rangeLessons = lessons.filter(l => l.date >= startStr && l.date <= endStr);
    
    const completed = rangeLessons.filter(l => l.status === 'completed').length;
    const late = rangeLessons.filter(l => l.started_late).length;
    const missed = rangeLessons.filter(l => l.status === 'missed').length;
    const video = rangeLessons.filter(l => l.status === 'completed' && l.actual_end).length;

    const total = rangeLessons.length || schedules.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      late,
      missed,
      video,
      percentage: pct
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '100%' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">Jadval yuklanmoqda...</p>
      </div>
    );
  }

  // Group by day of week helper
  const getSchedulesForCell = (dayIndex, timeSlot) => {
    return schedules.filter(s => {
      if (s.day_of_week !== dayIndex) return false;
      const startHour = s.start_time?.split(':')[0];
      const slotHour = timeSlot.split(':')[0];
      return startHour === slotHour;
    });
  };

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      {/* 1. Header & Page Header */}
      <div className="sch-page-header">
        <div>
          <h1>
            Dars Jadvali 
            {filterLoading && <Loader size={16} className="sch-spinner text-primary" style={{ display: 'inline-block', marginLeft: '10px' }} />}
          </h1>
          <p className="sch-subtitle">Haftalik dars jadvali — xona, etaj va vaqtlar bilan</p>
        </div>
        <div className="sch-header-actions">
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={16} /> Jadvalni eksport qilish
          </button>
          <button className="btn btn-outline" onClick={() => setShowGenModal(true)}>
            <Calendar size={16} /> Darslar yaratish
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> + Dars yaratish
          </button>
          <button className="btn btn-outline" onClick={() => loadScheduleData(true)} style={{ padding: '0.75rem' }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 3. Statistics Cards */}
      <div className="sch-stats-grid">
        <div className="sch-stat-card">
          <div className="sch-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>
            <BookOpen size={20} />
          </div>
          <div className="sch-stat-info">
            <div className="sch-stat-label">Jami darslar</div>
            <div className="sch-stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="sch-stat-card">
          <div className="sch-stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="sch-stat-info">
            <div className="sch-stat-label">O‘tiladigan darslar</div>
            <div className="sch-stat-value">{stats.completed}</div>
            <span className="sch-stat-pct" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>75%</span>
          </div>
        </div>

        <div className="sch-stat-card">
          <div className="sch-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
            <Clock size={20} />
          </div>
          <div className="sch-stat-info">
            <div className="sch-stat-label">Kechikishlar</div>
            <div className="sch-stat-value">{stats.late}</div>
            <span className="sch-stat-pct" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>9%</span>
          </div>
        </div>

        <div className="sch-stat-card">
          <div className="sch-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="sch-stat-info">
            <div className="sch-stat-label">O‘tilmagan darslar</div>
            <div className="sch-stat-value">{stats.missed}</div>
            <span className="sch-stat-pct" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>16%</span>
          </div>
        </div>

        <div className="sch-stat-card">
          <div className="sch-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Video size={20} />
          </div>
          <div className="sch-stat-info">
            <div className="sch-stat-label">Video yuborilgan</div>
            <div className="sch-stat-value">{stats.video}</div>
            <span className="sch-stat-pct" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>56%</span>
          </div>
        </div>
      </div>

      {/* 4. Filter Panel */}
      <div className="sch-filter-bar">
        <div className="sch-filters-left">
          <select 
            className="sch-filter-select"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">Barcha sinflar ▼</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            className="sch-filter-select"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            <option value="">Barcha fanlar ▼</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select 
            className="sch-filter-select"
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
          >
            <option value="">Barcha o‘qituvchilar ▼</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
          </select>
        </div>

        <div className="sch-nav-group">
          <button className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={navigateToday}>Bugun</button>
          <button className="sch-nav-btn" onClick={() => navigateWeek(-1)}><ChevronLeft size={16} /></button>
          <div className="sch-week-label">{formatWeekRange(startOfWeek, endOfWeek)}</div>
          <button className="sch-nav-btn" onClick={() => navigateWeek(1)}><ChevronRight size={16} /></button>
        </div>

        <div className="sch-view-toggle">
          <button 
            className={`sch-view-btn ${viewType === 'week' ? 'active' : ''}`}
            onClick={() => setViewType('week')}
          >
            Hafta
          </button>
          <button 
            className={`sch-view-btn ${viewType === 'day' ? 'active' : ''}`}
            onClick={() => setViewType('day')}
          >
            Kun
          </button>
        </div>
      </div>

      {/* 5. Weekly Calendar or Daily View */}
      {viewType === 'week' ? (
        <div className="sch-calendar-wrapper">
          <div className="sch-calendar-scroll">
            <div className="sch-calendar-grid">
              {/* Corner */}
              <div className="sch-cal-corner">
                <Clock size={14} className="text-muted" />
              </div>

              {/* Day Headers */}
              {weekDays.map((dayDate, idx) => {
                const isToday = new Date().toDateString() === dayDate.toDateString();
                return (
                  <div key={idx} className={`sch-cal-day-header ${isToday ? 'today' : ''}`}>
                    <div className="sch-cal-day-name">{DAYS[idx]}</div>
                    <div className="sch-cal-day-date">
                      {dayDate.getDate()} {dayDate.toLocaleDateString('uz-UZ', { month: 'short' })}
                    </div>
                  </div>
                );
              })}

              {/* Grid Rows */}
              {TIME_SLOTS.map((timeSlot) => (
                <div key={timeSlot} style={{ display: 'contents' }}>
                  {/* Time label */}
                  <div className="sch-cal-time">
                    <span>{timeSlot}</span>
                  </div>

                  {/* Day cells */}
                  {weekDays.map((dayDate, dayIdx) => {
                    const cellSchedules = getSchedulesForCell(dayIdx + 1, timeSlot);
                    return (
                      <div key={dayIdx} className="sch-cal-cell">
                        {cellSchedules.map(s => {
                          const dateStr = dayDate.toISOString().split('T')[0];
                          const statusInfo = getLessonStatusInfo(s, dateStr);
                          return (
                            <div 
                              key={s.id} 
                              className={`sch-lesson-card ${statusInfo.colorClass}`}
                              onClick={() => setSelectedLesson({ ...s, date: dateStr, statusInfo })}
                            >
                              <div className="sch-lesson-subject">{s.subject_name || s.subject}</div>
                              <div className="sch-lesson-meta">{s.teacher_name}</div>
                              <div className="sch-lesson-meta" style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={8} /> {s.room || s.class_room || '—'} • {s.class_name || s.school_class}
                              </div>
                              <button 
                                className="sch-lesson-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(s.id);
                                }}
                                title="O'chirish"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                        {cellSchedules.length === 0 && <div className="sch-empty-cell" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Day view
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 className="heading-3" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            {currentDate.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} darslari
          </h3>
          <div className="sch-day-list">
            {schedules.filter(s => s.day_of_week === (currentDate.getDay() === 0 ? 6 : currentDate.getDay())).length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Bugun uchun darslar mavjud emas</p>
            ) : (
              schedules
                .filter(s => s.day_of_week === (currentDate.getDay() === 0 ? 6 : currentDate.getDay()))
                .map(s => {
                  const dateStr = currentDate.toISOString().split('T')[0];
                  const statusInfo = getLessonStatusInfo(s, dateStr);
                  return (
                    <div 
                      key={s.id} 
                      className={`sch-day-lesson ${statusInfo.colorClass}`}
                      onClick={() => setSelectedLesson({ ...s, date: dateStr, statusInfo })}
                    >
                      <div className="sch-day-time">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</div>
                      <div className="sch-day-info">
                        <div className="sch-lesson-subject">{s.subject_name}</div>
                        <div className="sch-lesson-meta">{s.teacher_name} • {s.class_name} • {s.room}-xona</div>
                      </div>
                      <span className={`badge ${
                        statusInfo.status === 'completed' ? 'badge-success' :
                        statusInfo.status === 'missed' ? 'badge-danger' :
                        statusInfo.status === 'late' ? 'badge-warning' :
                        statusInfo.status === 'video' ? 'badge-primary' : 'badge-primary'
                      }`} style={{ textTransform: 'none' }}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* 8. Legend */}
      <div className="sch-legend">
        <div className="sch-legend-item">
          <div className="sch-legend-dot" style={{ background: '#22c55e' }} />
          <span>O‘tiladigan / completed dars</span>
        </div>
        <div className="sch-legend-item">
          <div className="sch-legend-dot" style={{ background: '#f59e0b' }} />
          <span>Kechikkan dars</span>
        </div>
        <div className="sch-legend-item">
          <div className="sch-legend-dot" style={{ background: '#ef4444' }} />
          <span>O‘tilmagan dars</span>
        </div>
        <div className="sch-legend-item">
          <div className="sch-legend-dot" style={{ background: '#3b82f6' }} />
          <span>Video yuborilgan dars</span>
        </div>
        <div className="sch-legend-item">
          <div className="sch-legend-dot" style={{ background: '#8b5cf6' }} />
          <span>Rejalashtirilgan dars</span>
        </div>
      </div>

      {/* 9. Progress */}
      <div className="sch-progress-bar-wrap">
        <div className="sch-progress-label">O‘tilish foizi:</div>
        <div className="sch-progress-track">
          <div className="sch-progress-fill" style={{ width: `${stats.percentage}%` }} />
        </div>
        <div className="sch-progress-pct">{stats.percentage}%</div>
        <button 
          className="btn btn-outline" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginLeft: 'auto' }}
          onClick={() => alert("Batafsil statistika tez orada faollashtiriladi.")}
        >
          Batafsil statistika
        </button>
      </div>

      {/* 7. Lesson Click Detail Modal */}
      {selectedLesson && (
        <div className="sch-modal-overlay" onClick={() => setSelectedLesson(null)}>
          <div className="sch-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sch-modal-header">
              <h2>Dars Tafsilotlari</h2>
              <button className="sch-modal-close" onClick={() => setSelectedLesson(null)}><X size={18} /></button>
            </div>
            
            <div className="sch-detail-grid">
              <div className="sch-detail-item">
                <span className="sch-detail-label">O'qituvchi</span>
                <span className="sch-detail-value">{selectedLesson.teacher_name || '—'}</span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Fan</span>
                <span className="sch-detail-value">{selectedLesson.subject_name || '—'}</span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Sinf</span>
                <span className="sch-detail-value">{selectedLesson.class_name || '—'}</span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Xona</span>
                <span className="sch-detail-value">{selectedLesson.room || selectedLesson.class_room || '—'} {selectedLesson.class_floor ? `(${selectedLesson.class_floor}-etaj)` : ''}</span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Reja Vaqti</span>
                <span className="sch-detail-value">{selectedLesson.start_time?.slice(0, 5)} - {selectedLesson.end_time?.slice(0, 5)}</span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Sana</span>
                <span className="sch-detail-value">{selectedLesson.date}</span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Status</span>
                <span className="sch-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className={`sch-legend-dot`} style={{ 
                    background: 
                      selectedLesson.statusInfo.status === 'completed' ? '#22c55e' :
                      selectedLesson.statusInfo.status === 'late' ? '#f59e0b' :
                      selectedLesson.statusInfo.status === 'missed' ? '#ef4444' :
                      selectedLesson.statusInfo.status === 'video' ? '#3b82f6' : '#8b5cf6'
                  }} />
                  {selectedLesson.statusInfo.label}
                </span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Haqiqiy boshlanish</span>
                <span className="sch-detail-value">
                  {selectedLesson.statusInfo.detail?.actual_start ? 
                    new Date(selectedLesson.statusInfo.detail.actual_start).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Haqiqiy tugash</span>
                <span className="sch-detail-value">
                  {selectedLesson.statusInfo.detail?.actual_end ? 
                    new Date(selectedLesson.statusInfo.detail.actual_end).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="sch-detail-item">
                <span className="sch-detail-label">Video holati</span>
                <span className="sch-detail-value">
                  {selectedLesson.statusInfo.status === 'video' ? 'Qabul qilingan' : 'Yuborilmagan'}
                </span>
              </div>
              
              {selectedLesson.statusInfo.detail?.notes && (
                <div className="sch-detail-item full" style={{ marginTop: '0.5rem' }}>
                  <span className="sch-detail-label">Izohlar / Notes</span>
                  <span className="sch-detail-value" style={{ fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                    {selectedLesson.statusInfo.detail.notes}
                  </span>
                </div>
              )}

              <div className="sch-detail-item full" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <button 
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleDelete(selectedLesson.id)}
                >
                  Jadval elementini o'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showModal && (
        <div className="sch-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sch-modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="sch-modal-header">
              <h2>Yangi dars jadvali qo'shish</h2>
              <button className="sch-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex-col gap-4">
              <div className="input-group">
                <label className="input-label">O'qituvchi</label>
                <select required className="input-field" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} style={{ background: 'var(--bg-darker)' }}>
                  <option value="">— Tanlang —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Fan</label>
                <select required className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ background: 'var(--bg-darker)' }}>
                  <option value="">— Tanlang —</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Sinf</label>
                <select required className="input-field" value={form.school_class} onChange={e => handleClassChange(e.target.value)} style={{ background: 'var(--bg-darker)' }}>
                  <option value="">— Tanlang —</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.room ? ` (Xona: ${c.room}, ${c.floor}-etaj)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Hafta kuni</label>
                <select className="input-field" value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: +e.target.value })} style={{ background: 'var(--bg-darker)' }}>
                  {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Boshlanish vaqti
                  </label>
                  <input type="time" required className="input-field" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Tugash vaqti
                  </label>
                  <input type="time" required className="input-field" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Xona raqami (ixtiyoriy)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Sinf tanlanganida avtomatik to'ladi"
                  value={form.room} 
                  onChange={e => setForm({ ...form, room: e.target.value })} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={submitting}>
                {submitting ? <Loader size={16} className="sch-spinner" /> : <Check size={16} />}
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generate Lessons Modal */}
      {showGenModal && (
        <div className="sch-modal-overlay" onClick={() => setShowGenModal(false)}>
          <div className="sch-modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="sch-modal-header">
              <h2>Darslarni yaratish</h2>
              <button className="sch-modal-close" onClick={() => setShowGenModal(false)}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Tanlangan sana uchun jadvaldan avtomatik darslar yaratiladi.
            </p>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Sana</label>
              <input type="date" className="input-field" value={genDate} onChange={e => setGenDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader size={16} className="sch-spinner" /> : <BookOpen size={16} />}
              {generating ? 'Yaratilmoqda...' : 'Darslarni yaratish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
