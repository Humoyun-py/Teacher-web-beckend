import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, QrCode, Camera, Settings, LogOut, Menu, ChevronRight, Bell, BookOpen, BarChart3, AlertTriangle, GraduationCap, Library, DollarSign, ArrowRightLeft, Shield, KeyRound, UserCog } from 'lucide-react';
import { api } from '../api';

export default function DashboardLayout({ role }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const normalizeRole = (value) =>
    String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  const getSafeUserRole = () => {
    try {
      const u = localStorage.getItem('user');
      if (!u || u === 'undefined') return '';
      return JSON.parse(u).role || '';
    } catch { return ''; }
  };

  const userIsITSupport = normalizeRole(user?.role || getSafeUserRole()) === 'it_support';

  useEffect(() => {
    // Ctrl+K listener
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    // Notifications update listener
    const handleNotifUpdate = () => {
      api.getUnreadCount()
        .then(res => setUnreadCount(res.count || res.unread_count || 0))
        .catch(() => { });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('notificationsUpdated', handleNotifUpdate);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('notificationsUpdated', handleNotifUpdate);
    };
  }, []);

  useEffect(() => {
    // ── Auth Guard ──────────────────────────────────────────────────────
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr || userStr === 'undefined' || userStr === 'null') {
      localStorage.clear();
      navigate('/', { replace: true });
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(userStr);
    } catch (e) {
      console.error("User data parse error", e);
      localStorage.clear();
      navigate('/', { replace: true });
      return;
    }

    if (!parsedUser) {
      navigate('/', { replace: true });
      return;
    }

    const parsedRole = normalizeRole(parsedUser.role);
    const layoutRole = normalizeRole(role);

    // Role tekshiruvi: Qat'iy ajratish
    const userIsITSupport = parsedRole === 'it_support' || parsedRole === 'superadmin';
    const userIsAdmin = parsedRole === 'admin' || parsedUser.is_superuser || parsedUser.is_staff;

    // IT Support sahifasiga faqat IT Support kiradi
    if (layoutRole === 'it_support' && !userIsITSupport) {
      if (userIsAdmin) navigate('/admin', { replace: true });
      else navigate('/teacher', { replace: true });
      return;
    }

    // Admin sahifasiga Admin yoki IT Support kirsa bo'ladi
    if (layoutRole === 'admin' && !userIsAdmin && !userIsITSupport) {
      navigate('/teacher', { replace: true });
      return;
    }

    if (layoutRole === 'teacher' && (userIsAdmin || userIsITSupport)) {
      // O'qituvchi qismi ochiq qolishi mumkin (nazorat uchun)
    }

    setUser(parsedUser);

    // Unread notifications soni
    api.getUnreadCount()
      .then(res => setUnreadCount(res.count || res.unread_count || 0))
      .catch(() => { });

    // Profile ni yangilash
    api.getProfile()
      .then(res => {
        if (res) {
          const updated = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...res };
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
        }
      })
      .catch(() => { });
  }, [navigate, role]);

  const adminMenu = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: "O'qituvchilar", path: '/admin/teachers', icon: <Users size={20} /> },
    { name: 'Fanlar', path: '/admin/subjects', icon: <Library size={20} /> },
    { name: 'Sinflar', path: '/admin/classes', icon: <GraduationCap size={20} /> },
    { name: 'Darslar', path: '/admin/lessons', icon: <BookOpen size={20} /> },
    { name: 'Dars Jadvali', path: '/admin/schedule', icon: <Calendar size={20} /> },
    { name: 'QR Nazorat', path: '/admin/qr-checkin', icon: <QrCode size={20} /> },
    { name: 'Rasm Tekshiruv', path: '/admin/video-review', icon: <Camera size={20} /> },
    { name: 'Oylik Hisoblash', path: '/admin/salary-calc', icon: <DollarSign size={20} /> },
    { name: 'KPI & Reyting', path: '/admin/kpi', icon: <BarChart3 size={20} /> },
    { name: "O'rinbosarlar", path: '/admin/replacements', icon: <ArrowRightLeft size={20} /> },
    {
      name: 'Bildirishnomalar', path: '/admin/notifications', icon: <Bell size={20} />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: 'Sozlamalar', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const teacherMenu = [
    { name: 'Dashboard', path: '/teacher', icon: <LayoutDashboard size={20} /> },
    { name: 'Mening Darslarim', path: '/teacher/schedule', icon: <Calendar size={20} /> },
    { name: 'QR Skaner', path: '/teacher/qr-scan', icon: <QrCode size={20} /> },
    { name: 'Statistika', path: '/teacher/stats', icon: <BarChart3 size={20} /> },
    { name: "O'rinbosarlar", path: '/teacher/replacements', icon: <ArrowRightLeft size={20} /> },
    {
      name: 'Bildirishnomalar', path: '/teacher/notifications', icon: <Bell size={20} />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const itSupportMenu = [
    // ─ IT Support Maxsus ─
    { name: 'Control Center', path: '/it-support', icon: <Shield size={20} /> },
    { name: 'Teacher Controls', path: '/it-support/teacher-controls', icon: <Users size={20} /> },
    { name: 'O\'qituvchilar', path: '/it-support/teachers', icon: <Users size={20} /> },
    { name: 'Darslar Monitori', path: '/it-support/lessons', icon: <BookOpen size={20} /> },
    { name: 'Davomat Boshqaruvi', path: '/it-support/attendance', icon: <Calendar size={20} /> },
    { name: 'Xabar Markazi', path: '/it-support/notifications', icon: <Bell size={20} /> },
    { name: 'CCTV Monitoring', path: '/it-support/cctv', icon: <Camera size={20} /> },
    { name: 'Audit Loglar', path: '/it-support/audit-logs', icon: <BarChart3 size={20} /> },
    { name: 'Tizimni Tiklash', path: '/it-support/restore', icon: <AlertTriangle size={20} /> },
    { name: 'Admin Boshqaruvi', path: '/it-support/admins', icon: <Shield size={20} /> },
    // ─ Admin Modullar ─
    { name: 'Fanlar', path: '/admin/subjects', icon: <BookOpen size={20} /> },
    { name: 'Sinflar', path: '/admin/classes', icon: <GraduationCap size={20} /> },
    { name: 'Dars Jadvali', path: '/admin/schedule', icon: <Calendar size={20} /> },
    { name: 'QR Nazorat', path: '/admin/qr-checkin', icon: <QrCode size={20} /> },
    { name: 'Video Tekshiruv', path: '/admin/video-review', icon: <Camera size={20} /> },
    { name: 'Oylik & KPI', path: '/admin/salary-calc', icon: <DollarSign size={20} /> },
    { name: 'O\'rinbosarlar', path: '/admin/replacements', icon: <ArrowRightLeft size={20} /> },
    { name: 'Sozlamalar', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  // Menyuni layout roliga emas, FOYDALANUVCHINING HAQIQIY ROLIGA qarab tanlash
  // (IT Support /admin/... sahifalarida ham o'z menyusini ko'radi)
  const getSafeRole = () => {
    try {
      const u = localStorage.getItem('user');
      if (!u || u === 'undefined' || u === 'null') return normalizeRole(role);
      return normalizeRole(JSON.parse(u).role || role);
    } catch { return normalizeRole(role); }
  };
  const actualUserRole = getSafeRole();
  let menu = teacherMenu;
  if (actualUserRole === 'it_support' || actualUserRole === 'superadmin') menu = itSupportMenu;
  else if (actualUserRole === 'admin') menu = adminMenu;

  const notificationsPath = actualUserRole === 'it_support' ? '/admin/notifications' : (actualUserRole === 'admin' ? '/admin/notifications' : '/teacher/notifications');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const openProfile = () => {
    if (user) {
      setProfileForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '' });
    }
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await api.updateProfile(profileForm);
      const updated = { ...user, ...res };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      alert('✅ Profil yangilandi');
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    } finally { setProfileSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) return alert('Yangi parollar mos kelmadi');
    try {
      await api.changePassword({ old_password: passwordForm.old_password, new_password: passwordForm.new_password });
      alert('✅ Parol muvaffaqiyatli o\'zgartirildi');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert('Xatolik: ' + JSON.stringify(err.data || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>
      {/* Super Admin / IT Support Neural Overlay */}
      {userIsITSupport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)',
          zIndex: 9999, backgroundSize: '200% 100%', animation: 'gradient-move 3s linear infinite',
          pointerEvents: 'none'
        }}>
          <style>{`
             @keyframes gradient-move { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
             .commander-mode { box-shadow: inset 0 0 60px rgba(99, 102, 241, 0.15); border: 2px solid rgba(99, 102, 241, 0.2); pointer-events: none; position: fixed; inset: 0; z-index: 9998; border-radius: 0; }
           `}</style>
        </div>
      )}
      {userIsITSupport && <div className="commander-mode" />}

      {/* Command Palette (Ctrl+K) */}
      {isCommandPaletteOpen && (
        <div className="modal-overlay flex-center" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setCommandPaletteOpen(false)}>
          <div
            className="glass-panel w-full max-w-2xl overflow-hidden p-0 animate-scale-up"
            style={{ border: '1px solid var(--primary)', borderRadius: '24px', boxShadow: '0 0 40px rgba(99,102,241,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-surface flex items-center gap-4">
              <Shield className="text-primary" size={24} />
              <input
                autoFocus
                className="flex-1 bg-transparent border-none text-xl outline-none text-main"
                placeholder="Super Command kiriting... (ESC yopadi)"
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
              />
              <div className="text-xs text-muted border border-surface px-2 py-1 rounded">ESC</div>
            </div>
            <div className="p-4 flex-col gap-1 max-h-96 overflow-y-auto">
              {[
                { n: 'System Restore Center', p: '/it-support/restore', i: <AlertTriangle size={18} />, d: 'Darslar va davomatni tiklash' },
                { n: 'Neural Audit Logs', p: '/it-support/audit-logs', i: <BarChart3 size={18} />, d: 'Tizim harakatlari tarixi' },
                { n: 'Global Admin Controls', p: '/it-support/admins', i: <Shield size={18} />, d: 'Adminlarni boshqarish' },
                { n: 'Teacher Impersonation', p: '/it-support/teacher-controls', i: <Users size={18} />, d: 'O\'qituvchi nomidan ishlash' },
                { n: 'School Management Hub', p: '/it-support', i: <LayoutDashboard size={18} />, d: 'Global Dashboard' },
                { n: 'All Teachers List', p: '/admin/teachers', i: <Users size={18} />, d: 'O\'qituvchilar bazasi' },
                { n: 'Salary & KPI Calc', p: '/admin/salary-calc', i: <DollarSign size={18} />, d: 'Oylik hisoboti' }
              ].filter(it => it.n.toLowerCase().includes(commandSearch.toLowerCase())).map((it, idx) => (
                <button
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-all text-left w-full border-none cursor-pointer"
                  onClick={() => { navigate(it.p); setCommandPaletteOpen(false); }}
                >
                  <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>{it.i}</div>
                  <div className="flex-1">
                    <div className="font-bold text-main">{it.n}</div>
                    <div className="text-xs text-muted">{it.d}</div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </button>
              ))}
            </div>
            <div className="p-3 bg-white/5 text-[10px] text-muted text-center uppercase tracking-widest font-bold">Commander Interface v3.0 // Neural Intelligence Activated</div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside
        className="glass"
        style={{
          width: isSidebarOpen ? '250px' : '72px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          margin: '1rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Logo + Toggle */}
        <div
          className="flex-between"
          style={{ padding: isSidebarOpen ? '1.25rem 1.25rem' : '1.25rem 0', justifyContent: isSidebarOpen ? 'space-between' : 'center', borderBottom: '1px solid var(--surface-border)' }}
        >
          {isSidebarOpen && (
            <div className="flex-center gap-2">
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>E</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>E-Maktab</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center' }}
          >
            {isSidebarOpen ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: isSidebarOpen ? '0 0.75rem' : '0 0.5rem' }}>
            {menu.map((item, idx) => {
              const active = item.path === '/admin' || item.path === '/teacher'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <li key={idx}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: isSidebarOpen ? '0.65rem 0.85rem' : '0.65rem',
                      justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                      borderRadius: 'var(--radius-md)',
                      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-muted)',
                      transition: 'all 0.18s',
                      textDecoration: 'none',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    title={!isSidebarOpen ? item.name : ''}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    {isSidebarOpen && (
                      <span style={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem', flex: 1 }}>{item.name}</span>
                    )}
                    {item.badge && (
                      <span style={{
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '999px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        minWidth: '18px',
                        textAlign: 'center',
                        position: isSidebarOpen ? 'static' : 'absolute',
                        top: isSidebarOpen ? '' : '4px',
                        right: isSidebarOpen ? '' : '4px',
                      }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--surface-border)' }}>
          {isSidebarOpen && user && (
            <div className="flex-center gap-2" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={openProfile} title="Profil sozlamalari">
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || user.username || 'U')}&background=6366f1&color=fff`}
                  alt="avatar"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 600, fontSize: '0.83rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role || role}</p>
              </div>
            </div>
          )}
          <button
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center', color: 'var(--danger)', borderColor: 'transparent', gap: '0.75rem' }}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        marginLeft: isSidebarOpen ? 'calc(250px + 2rem)' : 'calc(72px + 2rem)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Top Header */}
        <header
          className="glass"
          style={{ margin: '1rem 1rem 0 0', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="flex-center gap-4">
            {/* Notifications bell */}
            <Link
              to={notificationsPath}
              style={{ background: 'transparent', color: 'var(--text-muted)', position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: '16px', height: '16px',
                  background: 'var(--danger)', borderRadius: '50%',
                  fontSize: '0.6rem', fontWeight: 700, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User info */}
            {user && (
              <div className="flex-center gap-2" onClick={openProfile} style={{ cursor: 'pointer' }} title="Profil sozlamalari">
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || user.username || 'U')}&background=6366f1&color=fff`}
                    alt="avatar"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                    {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {user.role || role}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '1.5rem 1rem 1.5rem 0', flex: 1 }}>
          {user ? <Outlet /> : null}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowProfileModal(false)}>
          <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '2rem', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
            <h2 className="heading-3" style={{ marginBottom: '1.5rem' }}>Profil Sozlamalari</h2>
            <div className="flex-col gap-3">
              <div className="flex-col gap-1">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ism</label>
                <input className="input-field" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} />
              </div>
              <div className="flex-col gap-1">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Familiya</label>
                <input className="input-field" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} />
              </div>
              <div className="flex-col gap-1">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Telefon</label>
                <input className="input-field" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleUpdateProfile} disabled={profileSaving}>
                <UserCog size={15} /> {profileSaving ? 'Saqlanmoqda...' : 'Profilni yangilash'}
              </button>
              <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '1rem 0' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Parolni o'zgartirish</h4>
              <input type="password" className="input-field" placeholder="Joriy parol" value={passwordForm.old_password} onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} />
              <input type="password" className="input-field" placeholder="Yangi parol" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
              <input type="password" className="input-field" placeholder="Yangi parolni tasdiqlash" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
              <button className="btn btn-warning" style={{ width: '100%' }} onClick={handleChangePassword}>
                <KeyRound size={15} /> Parolni o'zgartirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
