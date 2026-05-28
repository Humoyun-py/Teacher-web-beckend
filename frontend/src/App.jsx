import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AlertTriangle, HelpCircle, Check, X, CheckCircle } from 'lucide-react';

import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import TeachersList     from './pages/admin/TeachersList';
import Lessons          from './pages/admin/Lessons';
import Schedule         from './pages/admin/Schedule';
import QRCheckinData    from './pages/admin/QRCheckinData';
import VideoReviewList  from './pages/admin/VideoReviewList';
import Notifications    from './pages/admin/Notifications';
import Settings         from './pages/admin/Settings';

import Subjects         from './pages/admin/Subjects';
import Classes          from './pages/admin/Classes';
import SalaryCalc       from './pages/admin/SalaryCalc';
import Replacements     from './pages/admin/Replacements';

// Teacher pages
import TeacherDashboard  from './pages/teacher/TeacherDashboard';
import TeacherSchedule   from './pages/teacher/TeacherSchedule';
import TeacherStats      from './pages/teacher/TeacherStats';
import MyReplacements    from './pages/teacher/MyReplacements';
import Notifications2    from './pages/admin/Notifications'; // teacher ham shu componentni ishlatadi

function App() {
  const [modal, setModal] = useState(null); // { type: 'alert'|'confirm'|'prompt', message, defaultValue, resolve }
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    window.alert = (msg) => {
      return new Promise((resolve) => {
        setModal({
          type: 'alert',
          message: String(msg),
          resolve
        });
      });
    };

    window.confirm = (msg) => {
      return new Promise((resolve) => {
        setModal({
          type: 'confirm',
          message: String(msg),
          resolve
        });
      });
    };

    window.prompt = (msg, defaultValue) => {
      return new Promise((resolve) => {
        setModal({
          type: 'prompt',
          message: String(msg),
          defaultValue: defaultValue !== undefined ? String(defaultValue) : '',
          resolve
        });
      });
    };
  }, []);

  // ── Avtomatik logout: 1 kundan keyin token o'chib ketadi ──
  useEffect(() => {
    const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 1 kun = 86400000 ms

    const checkTokenExpiry = () => {
      const loginTime = localStorage.getItem('login_time');
      const accessToken = localStorage.getItem('access_token');

      // Agar token yo'q bo'lsa — tekshirish shart emas
      if (!accessToken || !loginTime) return;

      const elapsed = Date.now() - parseInt(loginTime, 10);

      if (elapsed >= TOKEN_LIFETIME_MS) {
        // 1 kun o'tdi — avtomatik logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('login_time');
        window.location.href = '/';
      }
    };

    // Darhol tekshirish (sahifa yuklanganda)
    checkTokenExpiry();

    // Har 60 soniyada tekshirish
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (modal && modal.type === 'prompt') {
      setPromptValue(modal.defaultValue || '');
    }
  }, [modal]);

  const isSuccess = modal && (modal.message.includes('✅') || modal.message.toLowerCase().includes('muvaffaqiyat') || modal.message.toLowerCase().includes('yaratildi'));
  const title = modal ? (modal.type === 'confirm' ? 'Tasdiqlash' : (modal.type === 'prompt' ? 'Ma\'lumot kiriting' : (isSuccess ? 'Muvaffaqiyat' : 'Bildirishnoma'))) : '';

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* ── Admin Routes ── */}
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route index            element={<AdminDashboard />} />
            <Route path="teachers"      element={<TeachersList />} />
            <Route path="subjects"      element={<Subjects />} />
            <Route path="classes"       element={<Classes />} />
            <Route path="lessons"       element={<Lessons />} />
            <Route path="schedule"      element={<Schedule />} />
            <Route path="qr-checkin"    element={<QRCheckinData />} />
            <Route path="video-review"  element={<VideoReviewList />} />
            <Route path="salary-calc"   element={<SalaryCalc />} />
            <Route path="replacements"  element={<Replacements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings"      element={<Settings />} />
          </Route>

          {/* ── Teacher Routes ── */}
          <Route path="/teacher" element={<DashboardLayout role="teacher" />}>
            <Route index                element={<TeacherDashboard />} />
            <Route path="schedule"      element={<TeacherSchedule />} />
            <Route path="qr-scan"       element={<TeacherDashboard />} />
            <Route path="stats"         element={<TeacherStats />} />
            <Route path="replacements"  element={<MyReplacements />} />
            <Route path="notifications" element={<Notifications2 />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* ── Custom Glassmorphism Alert/Confirm Modal ── */}
      {modal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass flex-col animate-fade-in" style={{
            width: '90%', maxWidth: '400px', padding: '1.75rem',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', gap: '1.25rem'
          }}>
            <div className="flex-center" style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: (modal.type === 'confirm' || modal.type === 'prompt') 
                ? 'rgba(99, 102, 241, 0.15)' 
                : (isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
              color: (modal.type === 'confirm' || modal.type === 'prompt') 
                ? 'var(--primary)' 
                : (isSuccess ? 'var(--success)' : 'var(--warning)'),
              alignSelf: 'center', marginBottom: '0.25rem'
            }}>
              {(modal.type === 'confirm' || modal.type === 'prompt') ? (
                <HelpCircle size={24} />
              ) : isSuccess ? (
                <CheckCircle size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {modal.message}
              </p>
            </div>

            {modal.type === 'prompt' && (
              <div className="flex-col" style={{ width: '100%' }}>
                <input
                  type="text"
                  className="input-field"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem' }}
                  placeholder="Izoh yozing..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      modal.resolve(promptValue);
                      setModal(null);
                    }
                  }}
                />
              </div>
            )}

            <div className="flex-center gap-3" style={{ marginTop: '0.5rem' }}>
              {(modal.type === 'confirm' || modal.type === 'prompt') ? (
                <>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.6rem' }}
                    onClick={() => {
                      modal.resolve(null);
                      setModal(null);
                    }}
                  >
                    <X size={16} /> Bekor qilish
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.6rem' }}
                    onClick={() => {
                      modal.resolve(modal.type === 'prompt' ? promptValue : true);
                      setModal(null);
                    }}
                  >
                    <Check size={16} /> OK
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.6rem' }}
                  onClick={() => {
                    modal.resolve();
                    setModal(null);
                  }}
                >
                  <Check size={16} /> OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
