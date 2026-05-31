import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, QrCode, Camera,
  Settings, LogOut, Menu, ChevronRight, Bell, BookOpen, BarChart3, AlertTriangle, GraduationCap, Library,
  DollarSign, ArrowRightLeft
} from 'lucide-react';
import { api } from '../api';

export default function DashboardLayout({ role }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // ── Auth Guard ──────────────────────────────────────────────────────
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/', { replace: true });
      return;
    }

    const parsedUser = JSON.parse(userStr);

    // Role tekshiruvi: admin/it_support/teacher sahifalari himoyasi
    const isITSupport = parsedUser.role === 'it_support';
    const userIsAdmin = parsedUser.role === 'admin' || parsedUser.is_superuser || parsedUser.is_staff;

    if (role === 'it_support' && !isITSupport) {
      if (userIsAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/teacher', { replace: true });
      }
      return;
    }
    if (role === 'admin' && !userIsAdmin && !isITSupport) {
      navigate('/teacher', { replace: true });
      return;
    }
    if (role === 'teacher' && (userIsAdmin || isITSupport)) {
      if (isITSupport) {
        navigate('/it-support', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
      return;
    }

    setUser(parsedUser);

    // Unread notifications soni
    api.getUnreadCount()
      .then(res => setUnreadCount(res.count || res.unread_count || 0))
      .catch(() => {});

    // Profile ni yangilash
    api.getProfile()
      .then(res => {
        if (res) {
          const updated = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...res };
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
        }
      })
      .catch(() => {});
  }, []);

  const itSupportMenu = [
    { name: 'Dashboard',         path: '/it-support',                icon: <LayoutDashboard size={20} /> },
    { name: "O'qituvchilar",     path: '/it-support/teachers',       icon: <Users size={20} /> },
    { name: 'Adminlar Boshqaruvi',path: '/it-support/admins',         icon: <Users size={20} /> },
    { name: 'Darslar & Jadval',  path: '/it-support/lessons',        icon: <BookOpen size={20} /> },
    { name: 'Davomat & QR',      path: '/it-support/attendance',     icon: <QrCode size={20} /> },
    { name: 'Rasm Proofs',       path: '/it-support/photos',         icon: <Camera size={20} /> },
    { name: 'Audit Loglar',      path: '/it-support/audit-logs',     icon: <AlertTriangle size={20} /> },
    { name: 'Jarima & KPI',      path: '/it-support/salary-kpi',     icon: <DollarSign size={20} /> },
    { name: 'Tizim Sozlamalari', path: '/it-support/settings',       icon: <Settings size={20} /> },
  ];

  const adminMenu = [
    { name: 'Dashboard',       path: '/admin',              icon: <LayoutDashboard size={20} /> },
    { name: "O'qituvchilar",   path: '/admin/teachers',     icon: <Users size={20} /> },
    { name: 'Fanlar',          path: '/admin/subjects',     icon: <Library size={20} /> },
    { name: 'Sinflar',         path: '/admin/classes',      icon: <GraduationCap size={20} /> },
    { name: 'Darslar',         path: '/admin/lessons',      icon: <BookOpen size={20} /> },
    { name: 'Dars Jadvali',    path: '/admin/schedule',     icon: <Calendar size={20} /> },
    { name: 'QR Nazorat',      path: '/admin/qr-checkin',   icon: <QrCode size={20} /> },
    { name: 'Rasm Tekshiruv',  path: '/admin/video-review', icon: <Camera size={20} /> },
    { name: 'Oylik Hisoblash',  path: '/admin/salary-calc',  icon: <DollarSign size={20} /> },
    { name: "O'rinbosarlar",   path: '/admin/replacements', icon: <ArrowRightLeft size={20} /> },
    {
      name: 'Bildirishnomalar', path: '/admin/notifications', icon: <Bell size={20} />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { name: 'Sozlamalar',      path: '/admin/settings',     icon: <Settings size={20} /> },
  ];

  const teacherMenu = [
    { name: 'Dashboard',       path: '/teacher',            icon: <LayoutDashboard size={20} /> },
    { name: 'Mening Darslarim',path: '/teacher/schedule',   icon: <Calendar size={20} /> },
    { name: 'QR Skaner',       path: '/teacher/qr-scan',    icon: <QrCode size={20} /> },
    { name: 'Statistika',      path: '/teacher/stats',      icon: <BarChart3 size={20} /> },
    { name: "O'rinbosarlar",   path: '/teacher/replacements', icon: <ArrowRightLeft size={20} /> },
    {
      name: 'Bildirishnomalar', path: '/teacher/notifications', icon: <Bell size={20} />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const menu = role === 'it_support' ? itSupportMenu : (role === 'admin' ? adminMenu : teacherMenu);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>

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
            <div className="flex-center gap-2" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
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
              to={role === 'admin' ? '/admin/notifications' : '/teacher/notifications'}
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
              <div className="flex-center gap-2">
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
    </div>
  );
}
