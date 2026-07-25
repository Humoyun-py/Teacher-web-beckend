import React, { useState, useEffect } from 'react';
import { Camera, PlayCircle, StopCircle, Clock, QrCode, CheckCircle, AlertCircle, Loader, User, BookOpen, MapPin, Building2 } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [todayLessons, setTodayLessons] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkinTime, setCheckinTime] = useState(null);
  const [checkoutTime, setCheckoutTime] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const isScanningRef = React.useRef(false);
  const [uploadingLesson, setUploadingLesson] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }
    setProfile(JSON.parse(userStr));

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dash, todayAtt, lessons] = await Promise.allSettled([
          api.getTeacherDashboard(),
          api.getAttendanceLogs(`?date=${new Date().toISOString().split('T')[0]}`),
          api.getLessonsToday(),
        ]);

        if (dash.status === 'fulfilled') setDashboard(dash.value);

        if (todayAtt.status === 'fulfilled') {
          const att = todayAtt.value?.results || todayAtt.value;
          const record = Array.isArray(att) ? att[0] : att;
          if (record && record.check_in_time) {
            setIsCheckedIn(true);
            setCheckinTime(record.check_in_time);
            if (record.check_out_time) {
              setIsCheckedOut(true);
              setCheckoutTime(record.check_out_time);
            }
          }
        }

        if (lessons.status === 'fulfilled') {
          setTodayLessons(lessons.value?.results || []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };

    loadDashboard();
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/teacher/qr-scan' && !isCheckedIn) {
      setShowScanner(true);
      // Optional: scroll slightly to make scanner visible
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300);
    }
  }, [location.pathname, isCheckedIn]);

  const handleScanCode = async (result) => {
    if (!result?.length || isScanningRef.current) return;
    if (isCheckedIn && isCheckedOut) return;
    
    isScanningRef.current = true;
    setScanning(true);
    let scannedData = result[0].rawValue;
    
    // Extract UUID if it's hidden inside a URL
    const uuidMatch = scannedData.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    if (uuidMatch) {
      scannedData = uuidMatch[0];
    }
    
    try {
      const res = await api.checkIn(scannedData);
      const att = res.attendance || res;
      
      if (att.check_out_time) {
        setIsCheckedOut(true);
        setCheckoutTime(att.check_out_time);
        setShowScanner(false);
        await alert('✅ Chiqish (Check-out) muvaffaqiyatli!\n\nXayr, salomat bo\'ling!');
      } else {
        setIsCheckedIn(true);
        setCheckinTime(att.check_in_time);
        setShowScanner(false);
        const lateMsg = res.is_late ? `\n⚠️ ${res.late_minutes} daqiqa kechikdingiz.` : '';
        const warnMsg = att.status === 'absent' ? '\n⚠️ Soat 12:00 dan kech qolganingiz sababli bugungi kunga haq yozilmaydi!' : '';
        await alert('✅ Kirish (Check-in) muvaffaqiyatli!' + lateMsg + warnMsg);
      }
      isScanningRef.current = false;
    } catch (err) {
      const msg = err?.data?.error || err?.data?.message || err?.data?.detail || JSON.stringify(err?.data || {});
      if (err?.status === 400 && (msg.toLowerCase().includes('already') || msg.includes('mavjud'))) {
        setIsCheckedIn(true);
        setShowScanner(false);
        await alert('ℹ️ Siz bugun allaqachon Check-in qilgansiz!');
      } else {
        await alert(`Xato: ${msg}\n\nQR kod: ${scannedData.slice(0, 30)}...`);
        setTimeout(() => { isScanningRef.current = false; }, 2500);
      }
    } finally { setScanning(false); }
  };

  const handleStartClick = (lessonId) => {
    if (!isCheckedIn) {
      alert("Avval Check-in qiling!");
      return;
    }
    const input = document.getElementById(`start-photo-${lessonId}`);
    if (input) {
      input.click();
    }
  };

  const handleStartWithPhoto = async (e, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;

    setActionLoading(lessonId + '-start');
    try {
      // 1. Upload photo proof (mandatory)
      const formData = new FormData();
      formData.append('lesson', lessonId);
      formData.append('photo', file);
      formData.append('description', 'Dars boshlanishi isboti');
      await api.uploadPhoto(formData);
      
      // 2. Start the lesson
      await api.startLesson(lessonId);
      
      // 3. Update UI state
      setTodayLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: 'in_progress', actual_start_time: new Date().toISOString() } : l));
      await alert('✅ Rasm yuklandi va dars muvaffaqiyatli boshlandi!');
    } catch (err) {
      await alert('Darsni boshlashda xatolik: ' + JSON.stringify(err.data || err.message));
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  const handleEnd = async (id) => {
    const notes = await prompt("Dars bo'yicha izoh (ixtiyoriy):", '');
    if (notes === null) return;
    setActionLoading(id + '-end');
    try {
      await api.endLesson(id, notes);
      setTodayLessons(prev => prev.map(l => l.id === id ? { ...l, status: 'completed' } : l));
    } catch (err) {
      await alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setActionLoading(null); }
  };

  const handlePhotoUpload = async (e, lessonId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLesson(lessonId);
    try {
      const formData = new FormData();
    formData.append('lesson', lessonId);
    formData.append('photo', file);
    formData.append('description', 'Dars jarayonida olingan rasm');
    await api.uploadPhoto(formData);
      await alert('✅ Rasm muvaffaqiyatli yuborildi!');
    } catch (err) {
      await alert('Rasm yuborishda xatolik: ' + JSON.stringify(err.data || err.message));
    } finally {
      setUploadingLesson(null);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex-center flex-col gap-4" style={{ height: '100%' }}>
        <Loader className="spinner" size={40} color="var(--primary)" />
        <p className="text-muted">Yuklanmoqda...</p>
      </div>
    );
  }

  // const activeLesson = todayLessons.find(l => l.status === 'in_progress');
  const nextLesson = dashboard?.next_lesson;

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Welcome banner */}
      <div className="glass flex-between" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="flex-col gap-1">
          <h1 className="heading-2">
            Xush kelibsiz, {profile?.first_name || profile?.username || 'Ustoz'}! 👋
          </h1>
          <p className="text-muted">
            Bugun {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' — '}
            {dashboard?.today_total_lessons
              ? `${dashboard.today_total_lessons} ta dars rejalashtirilgan`
              : "darslar yuklanmoqda..."}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isCheckedIn ? (
            <div className="badge badge-success flex-center gap-1" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
              <CheckCircle size={16} /> Maktabda
              {checkinTime && <span style={{ opacity: 0.8, fontSize: '0.82rem' }}>
                {' '}{new Date(checkinTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </span>}
            </div>
          ) : (
            <div className="badge badge-warning flex-center gap-1" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
              <AlertCircle size={16} /> Check-in kerak
            </div>
          )}
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={30} color="white" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      {dashboard && (
        <div className="grid grid-cols-3" style={{ gap: '1.25rem' }}>
          <div className="glass glass-hover" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)' }}>
              <BookOpen size={22} color="var(--primary)" />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Bugungi darslar</p>
              <p style={{ fontWeight: 700, fontSize: '1.5rem' }}>{dashboard.today_total_lessons ?? 0}</p>
            </div>
          </div>
          <div className="glass glass-hover" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle size={22} color="var(--success)" />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Yakunlangan</p>
              <p style={{ fontWeight: 700, fontSize: '1.5rem' }}>{dashboard.completed_lessons ?? 0}</p>
            </div>
          </div>
          <div className="glass glass-hover" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(234,179,8,0.1)', borderRadius: 'var(--radius-md)' }}>
              <Clock size={22} color="var(--warning)" />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Keyingi dars</p>
              <p style={{ fontWeight: 700, fontSize: nextLesson ? '1.5rem' : '0.95rem', color: nextLesson ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.2 }}>
                {nextLesson ? nextLesson.scheduled_start?.slice(0, 5) : "Bugun keyingi dars yo'q"}
              </p>
              {nextLesson && (
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>{nextLesson.subject} — {nextLesson.class}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Check-in + Today Lessons */}
      <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>

        {/* QR Check-in & Check-out */}
        <div className="glass flex-col" style={{ padding: '2rem', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{
            width: '90px', height: '90px',
            background: isCheckedOut ? 'rgba(234,179,8,0.1)' : (isCheckedIn ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)'),
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode size={44} color={isCheckedOut ? 'var(--warning)' : (isCheckedIn ? 'var(--success)' : 'var(--primary)')} />
          </div>
          <h3 className="heading-3">
            {isCheckedOut ? 'Chiqish qayd etildi 🕒' : (isCheckedIn ? 'Kirish qayd etilgan ✅' : 'QR orqali Kirish (Check-in)')}
          </h3>

          {isCheckedOut ? (
            <div style={{ padding: '1.25rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 'var(--radius-md)', width: '100%' }}>
              <Clock size={22} color="var(--warning)" style={{ marginBottom: '0.5rem', alignSelf: 'center' }} />
              <p style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>
                Kirish vaqti: <strong>{checkinTime ? new Date(checkinTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
              </p>
              <p style={{ color: 'var(--warning)', marginTop: '0.4rem', fontWeight: 500, fontSize: '0.88rem' }}>
                Chiqish vaqti: <strong>{new Date(checkoutTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</strong>
              </p>
            </div>
          ) : isCheckedIn ? (
            <div className="flex-col gap-3" style={{ width: '100%' }}>
              <div style={{ padding: '1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius-md)', width: '100%' }}>
                <CheckCircle size={22} color="var(--success)" style={{ alignSelf: 'center', marginBottom: '0.25rem' }} />
                <p style={{ color: 'var(--success)', fontWeight: 500, fontSize: '0.88rem' }}>
                  Siz maktabga soat {checkinTime ? new Date(checkinTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'} da keldingiz.
                </p>
              </div>
              
              {!showScanner ? (
                <button className="btn btn-warning" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowScanner(true)}>
                  <Camera size={17} /> Chiqish (Check-out) qilish
                </button>
              ) : (
                <div style={{ width: '100%', maxWidth: '280px', alignSelf: 'center' }}>
                  <div style={{ border: '2px solid var(--warning)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <Scanner
                      onScan={handleScanCode}
                      onError={() => {}}
                      components={{ audio: false, finder: false }}
                    />
                  </div>
                  {scanning && (
                    <div className="flex-center gap-2" style={{ marginTop: '0.75rem', color: 'var(--warning)' }}>
                      <Loader size={14} className="spinner" /> Tekshirilmoqda...
                    </div>
                  )}
                  <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => setShowScanner(false)}>
                    Bekor qilish
                  </button>
                </div>
              )}
            </div>
          ) : showScanner ? (
            <div style={{ width: '100%', maxWidth: '280px', alignSelf: 'center' }}>
              <div style={{ border: '2px solid var(--primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <Scanner
                  onScan={handleScanCode}
                  onError={() => {}}
                  components={{ audio: false, finder: false }}
                />
              </div>
              {scanning && (
                <div className="flex-center gap-2" style={{ marginTop: '0.75rem', color: 'var(--primary)' }}>
                  <Loader size={14} className="spinner" /> Tekshirilmoqda...
                </div>
              )}
              <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => setShowScanner(false)}>
                Bekor qilish
              </button>
            </div>
          ) : (
            <div className="flex-col gap-2" style={{ width: '100%' }}>
              <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                Maktabdagi QR kodni skanerlab, kelganingizni tasdiqlang.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowScanner(true)}>
                <Camera size={17} /> Skanerni ochish
              </button>
            </div>
          )}
        </div>

        {/* Today lessons */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <h3 className="heading-3" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>
            Bugungi darslar
            <span className="badge badge-primary" style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>{todayLessons.length} ta</span>
          </h3>

          {todayLessons.length === 0 ? (
            <div className="flex-center flex-col gap-3" style={{ padding: '2rem 0' }}>
              <BookOpen size={40} color="var(--text-muted)" />
              <p className="text-muted">Bugun dars yo'q</p>
            </div>
          ) : (
            <div className="flex-col gap-3">
              {todayLessons.map(lesson => (
                <div key={lesson.id} style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: lesson.status === 'in_progress' ? 'rgba(234,179,8,0.07)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${lesson.status === 'in_progress' ? 'rgba(234,179,8,0.25)' : 'var(--surface-border)'}`,
                }}>
                  <div className="flex-between">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {lesson.subject_name || lesson.subject} — {lesson.class_name || lesson.school_class}
                        {lesson.is_replaced && lesson.replacement_status === 'approved' && (
                          <span className="badge badge-warning" style={{ fontSize: '0.62rem', textTransform: 'none', padding: '0.15rem 0.4rem' }}>O'rinbosar dars</span>
                        )}
                      </p>
                      {/* Vaqt - boshlanish va tugash */}
                      <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {lesson.scheduled_start?.slice(0, 5)} – {lesson.scheduled_end?.slice(0, 5)}
                        {lesson.is_replaced && lesson.replacement_status === 'approved' && lesson.teacher_name && (
                          <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                            ({lesson.teacher_name} o'rniga)
                          </span>
                        )}
                      </p>
                      {/* Xona va Etaj */}
                      {(lesson.room || lesson.class_room) && (
                        <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--accent)' }}>
                          <MapPin size={10} style={{ display: 'inline', marginRight: '3px' }} />
                          Xona: {lesson.room || lesson.class_room}
                          {lesson.class_floor && (
                            <span style={{ marginLeft: '6px' }}>
                              <Building2 size={10} style={{ display: 'inline', marginRight: '2px' }} />
                              {lesson.class_floor}-etaj
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <span className={`badge ${lesson.status === 'in_progress' ? 'badge-warning' : lesson.status === 'completed' ? 'badge-success' : lesson.status === 'missed' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                      {lesson.status === 'in_progress' ? 'Ketmoqda' : lesson.status === 'completed' ? 'Yakunlandi' : lesson.status === 'missed' ? "O'tilmadi" : 'Kutilmoqda'}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex-center gap-2" style={{ marginTop: '0.75rem' }}>
                    {/* Photo upload for in_progress dars */}
                    {lesson.status === 'in_progress' && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id={`td-photo-${lesson.id}`}
                          onChange={e => handlePhotoUpload(e, lesson.id)}
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor={`td-photo-${lesson.id}`}
                          className="btn btn-outline"
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          {uploadingLesson === lesson.id ? <Loader size={12} className="spinner" /> : <Camera size={12} />}
                          Rasm
                        </label>
                      </>
                    )}

                    {lesson.status === 'scheduled' && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id={`start-photo-${lesson.id}`}
                          onChange={e => handleStartWithPhoto(e, lesson.id)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => handleStartClick(lesson.id)}
                          disabled={actionLoading === lesson.id + '-start' || !isCheckedIn}
                          title={!isCheckedIn ? "Avval Check-in qiling" : "Rasmga olib darsni boshlash"}
                        >
                          {actionLoading === lesson.id + '-start' ? <Loader size={12} className="spinner" /> : <PlayCircle size={12} />}
                          Boshlash (Rasm)
                        </button>
                      </>
                    )}
                    {lesson.status === 'in_progress' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleEnd(lesson.id)}
                        disabled={actionLoading === lesson.id + '-end'}
                      >
                        {actionLoading === lesson.id + '-end' ? <Loader size={12} className="spinner" /> : <StopCircle size={12} />}
                        Yakunlash
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
