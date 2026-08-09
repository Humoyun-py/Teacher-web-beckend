import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, Video, BarChart3, Bell, Shield, ArrowRight, Star, Plus, Check, 
  ChevronDown, Play, Sparkles, School, Users, CheckCircle2, Award, Clock, ArrowUpRight, 
  RefreshCw, X, Menu, ShieldCheck, ExternalLink, HelpCircle, Eye, CheckCircle, AlertCircle
} from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  // Navigation states
  const [activeNav, setActiveNav] = useState('bosh-sahifa');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Pricing state
  const [isAnnual, setIsAnnual] = useState(false);

  // Interactive Live Dashboard State
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    total: 148,
    present: 132,
    late: 11,
    absent: 5,
    lessons: 92,
    completed: 78
  });

  // Interactive Tab preview (Teacher Management Section)
  const [previewTab, setPreviewTab] = useState('profiles');

  // Video Verification State
  const [videoStatus, setVideoStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected'

  // QR Scanning Simulation
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'scanning' | 'scanned'
  const [scannedTeacher, setScannedTeacher] = useState(null);

  // FAQ items list
  const faqs = [
    {
      q: "Teacher Web nima?",
      a: "Teacher Web — maktablar, o'quv markazlari va ta'lim muassasalari uchun mo'ljallangan zamonaviy O'qituvchilar Boshqaruv Tizimi (SaaS). Tizim o'qituvchilar faoliyatini avtomatlashtirish, davomatni nazorat qilish (QR orqali), dars jadvallarini boshqarish va o'qituvchilar samaradorligini (KPI) tahlil qilishga yordam beradi."
    },
    {
      q: "QR Check-in qanday ishlaydi?",
      a: "Har bir o'qituvchi maktabga kelganida planshet yoki QR kodli maxsus monitor orqali o'z shaxsiy identifikatorini skanerlaydi. Tizim avtomatik ravishda dars jadvaliga asosan kelish vaqtini aniqlaydi va o'qituvchi o'z vaqtida keldi, kechikdi yoki kelmadi deb baholaydi. Ma'lumotlar real vaqtda admin paneliga uzatiladi."
    },
    {
      q: "O'qituvchilarni qanday boshqarish mumkin?",
      a: "Administratorlar o'qituvchilarning dars soatlari, fanlari, maosh stavkalari, dars jadvallari va yillik faoliyatini yagona bazadan boshqaradilar. Shuningdek, o'qituvchilarga darslarni boshqa o'qituvchiga almashtirish yoki o'rniga dars o'tish so'rovlarini yuborish imkoni beriladi."
    },
    {
      q: "Video hisobot qanday tekshiriladi?",
      a: "O'qituvchilar o'tgan darslari yakunida 1–2 daqiqalik video hisobot (dars jarayoni yoki dars taqdimotidan lavha) yuklaydilar. Administrator ushbu videoni ko'rib chiqadi, dars sifatini baholaydi va 'Tasdiqlash' yoki 'Rad etish' tugmalarini bosadi. Bu o'quv sifatini nazorat qilishning samarali usulidir."
    },
    {
      q: "Statistikalarni ko'rish mumkinmi?",
      a: "Ha, tizimda chuqur analitika mavjud. Davomat darajasi, o'tilgan darslar foizi, haftalik va oylik o'zgarishlar grafik shaklida taqdim etiladi. Har bir o'qituvchi uchun avtomatik tarzda KPI ballari hisoblanadi va reyting shakllantiriladi."
    },
    {
      q: "Ma'lumotlar xavfsizmi?",
      a: "Albatta. Teacher Web platformasidagi barcha ma'lumotlar shifrlangan holda xavfsiz bulutli serverlarda saqlanadi. Ma'lumotlar zaxiralab boriladi va faqat vakolatli administratorlargagina foydalanish huquqi beriladi."
    }
  ];

  // Simulated live stats refresher
  const handleStatsRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setDashboardStats({
        total: 148,
        present: Math.floor(Math.random() * 8) + 128,
        late: Math.floor(Math.random() * 6) + 6,
        absent: Math.floor(Math.random() * 4) + 4,
        lessons: 92,
        completed: Math.floor(Math.random() * 10) + 72
      });
      setRefreshing(false);
    }, 1200);
  };

  // Simulated QR scan handler
  const handleSimulateQRScan = () => {
    setScanStatus('scanning');
    setScannedTeacher(null);
    setTimeout(() => {
      setScanStatus('scanned');
      setScannedTeacher({
        name: "Humoyun Jo'rayev",
        subject: "Informatika fani o'qituvchisi",
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        status: Math.random() > 0.3 ? 'keldi' : 'kechikdi'
      });
    }, 2000);
  };

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const scrollToSection = (id) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="landing-page">
      <div className="lp-glow-bg-3"></div>
      <div className="lp-glow-bg-4"></div>

      {/* NAVBAR */}
      <header className="lp-header">
        <div className="lp-container lp-navbar">
          <div className="lp-logo" onClick={() => scrollToSection('bosh-sahifa')}>
            <div className="lp-logo-icon">
              <School size={20} color="#FFF" />
            </div>
            <span>Teacher Web</span>
          </div>

          <nav>
            <ul className="lp-nav-links">
              <li>
                <span 
                  className={`lp-nav-link ${activeNav === 'bosh-sahifa' ? 'active' : ''}`}
                  onClick={() => scrollToSection('bosh-sahifa')}
                >
                  Bosh sahifa
                </span>
              </li>
              <li>
                <span 
                  className={`lp-nav-link ${activeNav === 'imkoniyatlar' ? 'active' : ''}`}
                  onClick={() => scrollToSection('imkoniyatlar')}
                >
                  Imkoniyatlar
                </span>
              </li>
              <li>
                <span 
                  className={`lp-nav-link ${activeNav === 'oqituvchilar' ? 'active' : ''}`}
                  onClick={() => scrollToSection('oqituvchilar')}
                >
                  O'qituvchilar
                </span>
              </li>
              <li>
                <span 
                  className={`lp-nav-link ${activeNav === 'adminlar' ? 'active' : ''}`}
                  onClick={() => scrollToSection('adminlar')}
                >
                  Adminlar
                </span>
              </li>
              <li>
                <span 
                  className={`lp-nav-link ${activeNav === 'narxlar' ? 'active' : ''}`}
                  onClick={() => scrollToSection('narxlar')}
                >
                  Narxlar
                </span>
              </li>
              <li>
                <span 
                  className={`lp-nav-link ${activeNav === 'aloqa' ? 'active' : ''}`}
                  onClick={() => scrollToSection('aloqa')}
                >
                  Aloqa
                </span>
              </li>
            </ul>
          </nav>

          <div className="lp-actions">
            <button className="lp-btn-login" onClick={() => navigate('/login')}>Kirish</button>
            <button className="lp-btn-start" onClick={() => navigate('/login')}>
              Boshlash <ArrowRight size={16} />
            </button>
            <button className="lp-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`lp-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="lp-mobile-links">
          <li className={`lp-mobile-link ${activeNav === 'bosh-sahifa' ? 'active' : ''}`} onClick={() => scrollToSection('bosh-sahifa')}>Bosh sahifa</li>
          <li className={`lp-mobile-link ${activeNav === 'imkoniyatlar' ? 'active' : ''}`} onClick={() => scrollToSection('imkoniyatlar')}>Imkoniyatlar</li>
          <li className={`lp-mobile-link ${activeNav === 'oqituvchilar' ? 'active' : ''}`} onClick={() => scrollToSection('oqituvchilar')}>O'qituvchilar</li>
          <li className={`lp-mobile-link ${activeNav === 'adminlar' ? 'active' : ''}`} onClick={() => scrollToSection('adminlar')}>Adminlar</li>
          <li className={`lp-mobile-link ${activeNav === 'narxlar' ? 'active' : ''}`} onClick={() => scrollToSection('narxlar')}>Narxlar</li>
          <li className={`lp-mobile-link ${activeNav === 'aloqa' ? 'active' : ''}`} onClick={() => scrollToSection('aloqa')}>Aloqa</li>
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
          <button className="lp-btn-sec" style={{ justifyContent: 'center' }} onClick={() => navigate('/login')}>Kirish</button>
          <button className="lp-btn-start" style={{ justifyContent: 'center' }} onClick={() => navigate('/login')}>Boshlash →</button>
        </div>
      </div>

      {/* HERO SECTION */}
      <section id="bosh-sahifa" className="lp-section" style={{ overflow: 'visible', paddingTop: '4rem' }}>
        <div className="lp-container lp-hero-grid">
          
          {/* Hero Left Content */}
          <div className="lp-hero-content lp-animate-fade-up">
            <div className="lp-badge-wrapper">
              <span className="lp-badge">
                <span className="lp-badge-glow"></span>
                <Sparkles size={12} style={{ color: '#8B5CF6' }} /> Zamonaviy maktab boshqaruv tizimi
              </span>
            </div>
            
            <h1 className="lp-hero-title">
              O'qituvchilar boshqaruvi<br />
              va dars nazorati<br />
              <span className="lp-gradient-text">endilikda oson</span>
            </h1>
            
            <p className="lp-hero-desc">
              Teacher Web maktab va o'quv markazlari uchun yaratilgan zamonaviy platforma. O'qituvchilar kelishini nazorat qiling, darslarni boshqaring va natijalarni tahlil qiling.
            </p>
            
            <div className="lp-hero-ctas">
              <button className="lp-btn-start" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }} onClick={() => navigate('/login')}>
                Tizimni boshlash <ArrowRight size={18} />
              </button>
              <button className="lp-btn-sec" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }} onClick={() => scrollToSection('imkoniyatlar')}>
                Imkoniyatlarni ko'rish
              </button>
            </div>
            
            <div className="lp-hero-trust">
              <div className="lp-avatar-group">
                <img className="lp-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                <img className="lp-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                <img className="lp-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                <img className="lp-avatar" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="avatar" />
                <span className="lp-trust-badge">+120</span>
              </div>
              <span className="lp-trust-text">120+ ta maktab va o'quv markazlari bizga ishonadi</span>
            </div>
          </div>

          {/* Hero Right Dashboard Preview */}
          <div className="lp-hero-preview-wrapper lp-animate-fade-up lp-delay-1">
            <div className="lp-hero-preview-glow"></div>
            
            <div className="lp-dashboard-mock">
              {/* Top Window Actions */}
              <div className="lp-mock-header">
                <div className="lp-mock-title">
                  <div className="lp-logo-icon" style={{ width: '22px', height: '22px', borderRadius: '6px' }}>
                    <School size={12} color="#FFF" />
                  </div>
                  <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>Teacher Web — Admin Dashboard</span>
                </div>
                <div className="lp-mock-dots">
                  <div className="lp-mock-dot red"></div>
                  <div className="lp-mock-dot yellow"></div>
                  <div className="lp-mock-dot green"></div>
                </div>
              </div>

              {/* Refresh CTA Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="flex-col">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Bugungi Davomat</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--lp-text-muted)' }}>Real vaqtda yangilanadigan ma'lumotlar</span>
                </div>
                <button 
                  onClick={handleStatsRefresh} 
                  disabled={refreshing}
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid var(--lp-border)', 
                    color: 'var(--lp-text)', 
                    borderRadius: '8px', 
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={refreshing ? 'spinner' : ''} />
                  Yangilash
                </button>
              </div>

              {/* Stats Grid */}
              <div className="lp-mock-stats-grid">
                <div className="lp-mock-stat-card">
                  <span className="lp-mock-stat-label">Jami o'qituvchilar</span>
                  <span className="lp-mock-stat-value">{dashboardStats.total}</span>
                  <span className="lp-mock-indicator blue"><Users size={10} /> Faollar</span>
                </div>
                <div className="lp-mock-stat-card">
                  <span className="lp-mock-stat-label">Kelganlar</span>
                  <span className="lp-mock-stat-value" style={{ color: 'var(--lp-success)' }}>{dashboardStats.present}</span>
                  <span className="lp-mock-indicator green">
                    {Math.round((dashboardStats.present / dashboardStats.total) * 100)}%
                  </span>
                </div>
                <div className="lp-mock-stat-card">
                  <span className="lp-mock-stat-label">Kechikkanlar</span>
                  <span className="lp-mock-stat-value" style={{ color: 'var(--lp-warning)' }}>{dashboardStats.late}</span>
                  <span className="lp-mock-indicator yellow">Diqqat</span>
                </div>
                <div className="lp-mock-stat-card">
                  <span className="lp-mock-stat-label">Kelmaganlar</span>
                  <span className="lp-mock-stat-value" style={{ color: 'var(--lp-danger)' }}>{dashboardStats.absent}</span>
                  <span className="lp-mock-indicator red">Nazorat</span>
                </div>
              </div>

              {/* Middle Section: Chart and Recent Activity */}
              <div className="lp-mock-main-grid">
                
                {/* SVG Chart */}
                <div className="lp-mock-chart-card">
                  <div className="lp-mock-chart-header">
                    <span className="lp-mock-chart-title">Haftalik statistika</span>
                    <span className="lp-mock-chart-subtitle">91.4% davomat</span>
                  </div>
                  <div className="lp-mock-svg-container">
                    <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lp-gradient-blue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                        </linearGradient>
                        <linearGradient id="lp-gradient-indigo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Bars */}
                      <rect x="15" y="30" width="14" height="70" className="lp-mock-chart-bar" />
                      <rect x="45" y="20" width="14" height="80" className="lp-mock-chart-bar" />
                      <rect x="75" y="45" width="14" height="55" className="lp-mock-chart-bar" />
                      <rect x="105" y="15" width="14" height="85" className="lp-mock-chart-bar" />
                      <rect x="135" y="35" width="14" height="65" className="lp-mock-chart-bar" />
                      <rect x="165" y="25" width="14" height="75" className="lp-mock-chart-bar" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--lp-text-muted)' }}>
                    <span>Du</span><span>Se</span><span>Ch</span><span>Pa</span><span>Ju</span><span>Sha</span>
                  </div>
                </div>

                {/* Recent Activities list */}
                <div className="lp-mock-activity-card">
                  <span className="lp-mock-chart-title">So'nggi harakatlar</span>
                  <div className="lp-mock-activity-list">
                    <div className="lp-mock-activity-item">
                      <div className="lp-mock-teacher-info">
                        <img className="lp-mock-teacher-avatar" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&q=80" alt="" />
                        <div className="flex-col">
                          <span className="lp-mock-teacher-name">Dilnoza S.</span>
                          <span className="lp-mock-teacher-sub">Ingliz tili</span>
                        </div>
                      </div>
                      <span className="badge badge-success" style={{ padding: '0.1rem 0.35rem', fontSize: '0.55rem' }}>Keldi</span>
                    </div>

                    <div className="lp-mock-activity-item">
                      <div className="lp-mock-teacher-info">
                        <img className="lp-mock-teacher-avatar" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=60&q=80" alt="" />
                        <div className="flex-col">
                          <span className="lp-mock-teacher-name">Rustam O.</span>
                          <span className="lp-mock-teacher-sub">Matematika</span>
                        </div>
                      </div>
                      <span className="badge badge-warning" style={{ padding: '0.1rem 0.35rem', fontSize: '0.55rem' }}>Kechikdi</span>
                    </div>

                    <div className="lp-mock-activity-item">
                      <div className="lp-mock-teacher-info">
                        <img className="lp-mock-teacher-avatar" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=80" alt="" />
                        <div className="flex-col">
                          <span className="lp-mock-teacher-name">Nilufar H.</span>
                          <span className="lp-mock-teacher-sub">Biologiya</span>
                        </div>
                      </div>
                      <span className="badge badge-danger" style={{ padding: '0.1rem 0.35rem', fontSize: '0.55rem' }}>Kelmadi</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom indicators */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span>Dars yakunlanishi: <strong style={{ color: 'var(--lp-primary)' }}>84.7%</strong></span>
                  <span>O'rtacha KPI: <strong style={{ color: 'var(--lp-warning)' }}>9.2 / 10</strong></span>
                </div>
                <span style={{ color: 'var(--lp-success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle size={10} /> Tizim faol
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="imkoniyatlar" className="lp-section" style={{ background: '#090D1A' }}>
        <div className="lp-container">
          
          <div className="lp-section-header">
            <span className="lp-badge">
              <Sparkles size={12} color="#8B5CF6" /> Tizim imkoniyatlari
            </span>
            <h2 className="lp-section-title">
              Maktab boshqaruvini mukammal qiluvchi imkoniyatlar
            </h2>
            <p className="lp-section-desc">
              Teacher Web o'quv jarayonlarining shaffofligi, xavfsizligi va yuqori darajada nazorat qilinishini ta'minlovchi asboblarni taqdim etadi.
            </p>
          </div>

          <div className="lp-features-grid">
            {/* Card 1 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <QrCode size={22} />
              </div>
              <h3 className="lp-feature-title">QR Check-in</h3>
              <p className="lp-feature-desc">
                O'qituvchilarning kelish vaqti QR orqali qayd etiladi va dars jadvaliga muvofiq kechikishlar avtomatik hisoblanadi.
              </p>
            </div>

            {/* Card 2 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Calendar size={22} />
              </div>
              <h3 className="lp-feature-title">Dars Jadvali</h3>
              <p className="lp-feature-desc">
                Darslarni rejalashtirish, vaqtlarni to'g'rilash va o'qituvchilarning o'rinlarini almashtirishni boshqarish nihoyatda oson.
              </p>
            </div>

            {/* Card 3 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Video size={22} />
              </div>
              <h3 className="lp-feature-title">Video Hisobot</h3>
              <p className="lp-feature-desc">
                Har bir o'tilgan dars uchun o'qituvchi 1–2 daqiqalik video hisobot yuklaydi, admin dars sifatini doimiy nazorat qiladi.
              </p>
            </div>

            {/* Card 4 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <BarChart3 size={22} />
              </div>
              <h3 className="lp-feature-title">Real-time Statistika</h3>
              <p className="lp-feature-desc">
                Oylik va haftalik davomat darajasi, KPI ballari va maktab faoliyati bo'yicha to'liq tahliliy grafiklar va hisobotlar.
              </p>
            </div>

            {/* Card 5 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Bell size={22} />
              </div>
              <h3 className="lp-feature-title">Bildirishnomalar</h3>
              <p className="lp-feature-desc">
                Muhim dars almashtirishlar, yangiliklar va bildirishnomalarni ham o'qituvchilar, ham adminlar o'z vaqtida oladilar.
              </p>
            </div>

            {/* Card 6 */}
            <div className="lp-feature-card">
              <div className="lp-feature-icon-wrapper">
                <Shield size={22} />
              </div>
              <h3 className="lp-feature-title">Xavfsiz va Ishonchli</h3>
              <p className="lp-feature-desc">
                Hujjatlar va o'qituvchi ma'lumotlari SSL shifrlash orqali to'liq himoyalangan va har kuni zaxiralanadi.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* WHY TEACHER WEB SECTION */}
      <section id="oqituvchilar" className="lp-section">
        <div className="lp-container lp-why-grid">
          
          {/* Left info */}
          <div className="lp-animate-fade-up">
            <div className="lp-badge-wrapper">
              <span className="lp-badge">
                Nima uchun Teacher Web?
              </span>
            </div>
            <h2 className="lp-section-title" style={{ marginTop: '0.5rem', textAlign: 'left' }}>
              Barcha kerakli imkoniyatlar<br />
              bitta platformada
            </h2>
            <p className="lp-section-desc" style={{ maxWidth: '500px' }}>
              O'qituvchilar boshqaruvi, dars nazorati, statistika va tahlil — hammasi bir joyda. Maktabingiz yoki ta'lim markazingizning samaradorligini kafolatlaymiz.
            </p>

            <div className="lp-why-checklist">
              <div className="lp-checklist-item">
                <CheckCircle2 size={16} className="lp-checklist-icon" />
                <span>O'qituvchilarni boshqarish</span>
              </div>
              <div className="lp-checklist-item">
                <CheckCircle2 size={16} className="lp-checklist-icon" />
                <span>Avtomatik davomat</span>
              </div>
              <div className="lp-checklist-item">
                <CheckCircle2 size={16} className="lp-checklist-icon" />
                <span>Dars nazorati</span>
              </div>
              <div className="lp-checklist-item">
                <CheckCircle2 size={16} className="lp-checklist-icon" />
                <span>Video nazorati</span>
              </div>
              <div className="lp-checklist-item">
                <CheckCircle2 size={16} className="lp-checklist-icon" />
                <span>KPI va Reyting tizimi</span>
              </div>
              <div className="lp-checklist-item">
                <CheckCircle2 size={16} className="lp-checklist-icon" />
                <span>Hisobotlar tahlili</span>
              </div>
            </div>

            <button className="lp-btn-start" onClick={() => scrollToSection('narxlar')}>
              Batafsil ma'lumot <ArrowRight size={16} />
            </button>
          </div>

          {/* Right graphics dashboard cards */}
          <div className="lp-why-preview-cards lp-animate-fade-up lp-delay-1">
            <div className="lp-glow-why"></div>
            
            {/* Interactive Cards inside preview */}
            <div className="lp-preview-box flex-col gap-4">
              <div className="flex-between">
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>O'qituvchilar KPI ko'rsatkichlari</span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Top 3 reyting</span>
              </div>

              <div className="flex-col gap-3">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex-center gap-3">
                    <span style={{ fontWeight: 800, color: 'var(--lp-warning)' }}>#1</span>
                    <img style={{ width: '28px', height: '28px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&q=80" alt="" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dilnoza Saydullayeva</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--lp-success)', fontWeight: 700 }}>9.8 ball</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex-center gap-3">
                    <span style={{ fontWeight: 800, color: 'var(--lp-text-muted)' }}>#2</span>
                    <img style={{ width: '28px', height: '28px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=60&q=80" alt="" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sardor To'rayev</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--lp-success)', fontWeight: 700 }}>9.4 ball</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex-center gap-3">
                    <span style={{ fontWeight: 800, color: '#CD7F32' }}>#3</span>
                    <img style={{ width: '28px', height: '28px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&q=80" alt="" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ulug'bek Alimov</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--lp-success)', fontWeight: 700 }}>9.1 ball</span>
                </div>
              </div>

              {/* Attendance percentage indicator */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-muted" style={{ fontSize: '0.68rem', marginBottom: '0.2rem' }}>Oylik o'rtacha davomat</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>96.8%</span>
                    <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>+1.2%</span>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-muted" style={{ fontSize: '0.68rem', marginBottom: '0.2rem' }}>Dars o'tish ko'rsatkichi</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>98.4%</span>
                    <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>Yaxshi</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="lp-section" style={{ background: '#090D1A' }}>
        <div className="lp-container">
          <div className="lp-stats-container">
            <div>
              <div className="lp-stat-number">120+</div>
              <div className="lp-stat-label">Maktablar</div>
            </div>
            <div>
              <div className="lp-stat-number">3,000+</div>
              <div className="lp-stat-label">O'qituvchilar</div>
            </div>
            <div>
              <div className="lp-stat-number">500K+</div>
              <div className="lp-stat-label">Davomat yozuvlari</div>
            </div>
            <div>
              <div className="lp-stat-number">99.9%</div>
              <div className="lp-stat-label">Tizim barqarorligi</div>
            </div>
          </div>
        </div>
      </section>

      {/* TEACHER MANAGEMENT SECTION */}
      <section id="adminlar" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-badge">
              O'qituvchilar monitoringi
            </span>
            <h2 className="lp-section-title">
              O'qituvchilarni to'liq nazorat qilish tizimi
            </h2>
            <p className="lp-section-desc">
              Maktab ma'muriyati barcha o'qituvchilarning profillarini ko'rish, dars jadvalini rejalashtirish, darslarga daxldor yangiliklarni real vaqtda nazorat qilish imkoniyatiga ega.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8" style={{ alignItems: 'center' }}>
            
            {/* Interactive Screen Preview */}
            <div className="lp-preview-box flex-col gap-4">
              <div className="flex-between">
                {/* Simulated Tabs inside UI Preview */}
                <div className="lp-mock-tabs">
                  <button 
                    className={`lp-mock-tab ${previewTab === 'profiles' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('profiles')}
                  >
                    O'qituvchilar
                  </button>
                  <button 
                    className={`lp-mock-tab ${previewTab === 'schedules' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('schedules')}
                  >
                    Jadval
                  </button>
                  <button 
                    className={`lp-mock-tab ${previewTab === 'history' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('history')}
                  >
                    KPI Tahlil
                  </button>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Admin panel</span>
              </div>

              {/* Render dynamic tab content */}
              {previewTab === 'profiles' && (
                <div className="flex-col gap-3 animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img style={{ width: '38px', height: '38px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80" alt="" />
                      <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nilufar Hotamova</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>Biologiya o'qituvchisi • 11-A, 11-B</span>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Faol</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img style={{ width: '38px', height: '38px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" alt="" />
                      <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Sardor To'rayev</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>Matematika o'qituvchisi • 9-A, 10-B</span>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Faol</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img style={{ width: '38px', height: '38px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80" alt="" />
                      <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Dilnoza Saydullayeva</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>Ingliz tili o'qituvchisi • All Classes</span>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Faol</span>
                  </div>
                </div>
              )}

              {previewTab === 'schedules' && (
                <div className="flex-col gap-2 animate-fade-in" style={{ fontSize: '0.78rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, color: 'var(--lp-text-muted)' }}>
                    <span>Vaqt</span><span>Sinf</span><span>O'qituvchi / Fan</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontWeight: 600 }}>08:30-09:15</span><span>9-A sinf</span><span style={{ color: 'var(--lp-primary)' }}>S. To'rayev (Matematika)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontWeight: 600 }}>09:25-10:10</span><span>10-B sinf</span><span style={{ color: 'var(--lp-secondary)' }}>N. Hotamova (Biologiya)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontWeight: 600 }}>10:20-11:05</span><span>11-A sinf</span><span style={{ color: 'var(--lp-accent)' }}>D. Saydullayeva (Ingliz)</span>
                  </div>
                </div>
              )}

              {previewTab === 'history' && (
                <div className="flex-col gap-3 animate-fade-in">
                  <div className="flex-between">
                    <span style={{ fontSize: '0.78rem', color: 'var(--lp-text-muted)' }}>Haftalik o'rtacha KPI tahlili</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--lp-success)' }}>+4.2% Samaradorlik</span>
                  </div>
                  
                  {/* Skill Progress Bars */}
                  <div className="flex-col gap-2">
                    <div>
                      <div className="flex-between" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                        <span>Dars jadvaliga rioya qilish</span>
                        <span>98%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                        <div style={{ width: '98%', height: '100%', background: 'var(--lp-success)', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex-between" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                        <span>Dars hisobotlari sifati</span>
                        <span>89%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                        <div style={{ width: '89%', height: '100%', background: 'var(--lp-primary)', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex-between" style={{ fontSize: '0.7rem', marginBottom: '0.15rem' }}>
                        <span>Davomat ko'rsatkichi</span>
                        <span>92%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                        <div style={{ width: '92%', height: '100%', background: 'var(--lp-secondary)', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation List */}
            <div className="flex-col gap-4">
              <h3 className="heading-3" style={{ fontSize: '1.6rem', color: '#FFF' }}>O'qituvchilar jildlari, darslar jadvali, KPI va statistika bir joyda</h3>
              <p className="text-muted" style={{ lineHeight: '1.6' }}>
                Administratorlar tizim orqali o'qituvchilarning dars jadvali kesishmasligi, maoshlarni to'g'ri hisoblash va dars jadvali yuklamalarini kuzatish imkoniyatiga ega.
              </p>
              
              <div className="flex-col gap-3" style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--lp-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={16} />
                  </div>
                  <div className="flex-col">
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Mukammal profillar</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Telefon raqam, ulanishlar, dars soatlari, va KPI reyting tarixi.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', color: 'var(--lp-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={16} />
                  </div>
                  <div className="flex-col">
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Haftalik aqlli dars jadvallari</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Sinf xonalari, sinflar va o'qituvchi bo'sh vaqtlari bo'yicha to'liq taqsimot.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dedicated QR CHECK-IN SECTION */}
      <section className="lp-section" style={{ background: '#090D1A' }}>
        <div className="lp-container grid grid-cols-2 gap-8" style={{ alignItems: 'center' }}>
          
          {/* Info */}
          <div className="lp-animate-fade-up">
            <div className="lp-badge-wrapper">
              <span className="lp-badge">
                Kelish va davomat nazorati
              </span>
            </div>
            <h2 className="lp-section-title" style={{ marginTop: '0.5rem', textAlign: 'left' }}>
              Avtomatlashtirilgan aqlli QR Check-in tizimi
            </h2>
            <p className="lp-section-desc" style={{ marginBottom: '2rem' }}>
              O'qituvchilarning darsga kelgan-ketganlik vaqti planshetdan skaner qilinuvchi QR kod orqali qayd qilinadi. Kechikkan darslar, sababsiz kelmagan kunlar avtomatik tarzda tizimga yozib boriladi.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>Interaktiv</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tizim ishlashini sinab ko'ring:</span>
              </div>
              <button className="lp-btn-start" onClick={handleSimulateQRScan} disabled={scanStatus === 'scanning'}>
                {scanStatus === 'scanning' ? "Skanerlanmoqda..." : "QR Skanerlashni simulyatsiya qilish"}
              </button>
            </div>
          </div>

          {/* Glowing QR Box Preview */}
          <div className="lp-animate-fade-up lp-delay-1" style={{ position: 'relative' }}>
            <div className="lp-qr-box">
              <div className="lp-qr-glow"></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.72rem', color: 'var(--lp-text-muted)' }}>
                <span>Davomat terminali</span>
                <span style={{ color: 'var(--lp-success)' }}>● ONLINE</span>
              </div>

              {/* QR Image Holder */}
              <div className="lp-qr-img" style={{ position: 'relative' }}>
                <div className="lp-qr-scanner-line" style={{ display: scanStatus === 'scanning' ? 'block' : 'none' }}></div>
                <QrCode size={110} color="#0B1020" style={{ opacity: scanStatus === 'scanning' ? 0.3 : 1 }} />
                {scanStatus === 'scanning' && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--lp-primary)' }}>
                    SCANNING...
                  </div>
                )}
              </div>

              {/* Scanned result card */}
              {scanStatus === 'scanned' && scannedTeacher && (
                <div className="lp-qr-teacher-card animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img style={{ width: '28px', height: '28px', borderRadius: '50%' }} src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=60&q=80" alt="" />
                    <div className="flex-col" style={{ gap: '0.1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{scannedTeacher.name}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--lp-text-muted)' }}>{scannedTeacher.subject}</span>
                    </div>
                  </div>
                  <div className="flex-col" style={{ alignItems: 'flex-end', gap: '0.1rem' }}>
                    <span className={`badge ${scannedTeacher.status === 'keldi' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.55rem', padding: '0.05rem 0.35rem' }}>
                      {scannedTeacher.status === 'keldi' ? 'Keldi' : 'Kechikdi'}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--lp-text-muted)' }}>{scannedTeacher.time}</span>
                  </div>
                </div>
              )}

              {scanStatus === 'idle' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--lp-text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                  Simulyatorni faollashtirish uchun tugmani bosing.
                </div>
              )}

              {scanStatus === 'scanning' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--lp-primary)', textAlign: 'center', padding: '0.5rem', fontWeight: 600 }}>
                  O'qituvchining QR kodi o'qilmoqda...
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* VIDEO VERIFICATION SECTION */}
      <section className="lp-section">
        <div className="lp-container grid grid-cols-2 gap-8" style={{ alignItems: 'center' }}>
          
          {/* Visual card */}
          <div className="lp-animate-fade-up">
            <div className="lp-preview-box">
              <div className="lp-video-mock-card">
                <div className="flex-between">
                  <div className="flex-col">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>11-B sinf. Biologiya darsi video hisoboti</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--lp-text-muted)' }}>O'qituvchi: Nilufar Hotamova • Bugun 11:20</span>
                  </div>
                  
                  {videoStatus === 'pending' && <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Kutilmoqda</span>}
                  {videoStatus === 'approved' && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Tasdiqlandi</span>}
                  {videoStatus === 'rejected' && <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>Rad etildi</span>}
                </div>

                <div className="lp-video-placeholder">
                  <div className="lp-video-badge">
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF' }}></span> REC 01:24
                  </div>
                  <div className="lp-video-play-btn">
                    <Play size={20} fill="#FFF" />
                  </div>
                  <div className="lp-video-overlay">
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Nilufar_Hotamova_Biologiya_11B.mp4</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--lp-text-muted)' }}>14.2 MB • H.264 format</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button 
                    onClick={() => setVideoStatus('approved')}
                    className="btn btn-success" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', justifyContent: 'center' }}
                    disabled={videoStatus === 'approved'}
                  >
                    {videoStatus === 'approved' ? "Tasdiqlandi ✅" : "Tasdiqlash"}
                  </button>
                  <button 
                    onClick={() => setVideoStatus('rejected')}
                    className="btn btn-danger" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem', justifyContent: 'center' }}
                    disabled={videoStatus === 'rejected'}
                  >
                    {videoStatus === 'rejected' ? "Rad etildi ✗" : "Rad etish"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lp-animate-fade-up lp-delay-1">
            <div className="lp-badge-wrapper">
              <span className="lp-badge">
                Dars sifati nazorati
              </span>
            </div>
            <h2 className="lp-section-title" style={{ marginTop: '0.5rem', textAlign: 'left' }}>
              Dars sifatini video hisobot orqali tekshirish
            </h2>
            <p className="lp-section-desc">
              Har bir dars yakunida o'qituvchilar 1–2 daqiqalik video hisobot (darsning eng qiziqarli lahzalari yoki dars xulosasi) yuklaydilar. Ma'muriyat buni tekshirib dars o'tilganini tasdiqlaydi. Bu orqali dars o'tilmaganlik holatining butunlay oldi olinadi.
            </p>
            
            <div className="flex-col gap-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Check size={16} style={{ color: 'var(--lp-success)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Sohani to'liq nazorat qilish</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Check size={16} style={{ color: 'var(--lp-success)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Fribgarlik va soxta darslarga chek qo'yish</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Check size={16} style={{ color: 'var(--lp-success)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Ota-onalarga dars sifatini isbotlash imkoniyati</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ANALYTICS SECTION */}
      <section className="lp-section" style={{ background: '#090D1A' }}>
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-badge">
              Chuqur Analitika & Tahlillar
            </span>
            <h2 className="lp-section-title">
              Ma'lumotlarga asoslangan maktab boshqaruvi
            </h2>
            <p className="lp-section-desc">
              Har bir o'qituvchi faoliyati, kelib-ketishi, dars o'tishi va video hisobotlari tahlil qilinib, avtomatik KPI grafiklari tuziladi.
            </p>
          </div>

          {/* Analytics Dashboard Mock */}
          <div className="lp-preview-box flex-col gap-6" style={{ padding: '2.5rem' }}>
            <div className="flex-between">
              <div className="flex-col">
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platforma statistik tahlil markazi</span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>2026-yil, Avgust oyi holatiga ko'ra</span>
              </div>
              <span className="badge badge-primary">Avtomatlashtirilgan</span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              
              {/* Analytics Box 1 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex-between">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dars yakunlanishi</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--lp-success)', fontWeight: 600 }}>98.2%</span>
                </div>
                {/* SVG Area Chart */}
                <div style={{ width: '100%', height: '80px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path d="M0,40 L10,35 L20,38 L30,28 L40,30 L50,15 L60,18 L70,8 L80,12 L90,2 L100,5 L100,40 Z" fill="rgba(34, 197, 94, 0.15)" stroke="var(--lp-success)" strokeWidth="1.5" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--lp-text-muted)' }}>Belgilangan jami 2,400 darsdan 2,357 tasi muvaffaqiyatli yakunlandi.</span>
              </div>

              {/* Analytics Box 2 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex-between">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Haftalik davomat o'zgarishi</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--lp-accent)', fontWeight: 600 }}>94.6%</span>
                </div>
                {/* SVG Line Chart */}
                <div style={{ width: '100%', height: '80px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path d="M0,35 Q15,30 30,20 T60,25 T90,5 T100,8" fill="none" stroke="var(--lp-accent)" strokeWidth="2" />
                    <circle cx="90" cy="5" r="2.5" fill="var(--lp-accent)" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--lp-text-muted)' }}>O'qituvchilarning darsga kelishi o'tgan haftaga nisbatan 1.4% ga oshgan.</span>
              </div>

              {/* Analytics Box 3 */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex-between">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>O'qituvchi KPI balli</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--lp-primary)', fontWeight: 600 }}>Avg: 9.1</span>
                </div>
                {/* SVG Bar Chart */}
                <div style={{ width: '100%', height: '80px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <rect x="5" y="15" width="8" height="25" fill="var(--lp-primary)" rx="2" />
                    <rect x="20" y="8" width="8" height="32" fill="var(--lp-primary)" rx="2" />
                    <rect x="35" y="22" width="8" height="18" fill="var(--lp-primary)" rx="2" />
                    <rect x="50" y="5" width="8" height="35" fill="var(--lp-secondary)" rx="2" />
                    <rect x="65" y="12" width="8" height="28" fill="var(--lp-primary)" rx="2" />
                    <rect x="80" y="10" width="8" height="30" fill="var(--lp-primary)" rx="2" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--lp-text-muted)' }}>Reyting ballari dars hisoboti, davomat va faollikka qarab hisoblanadi.</span>
              </div>

            </div>

            {/* Overall bottom summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <span>Jami maktablar: <strong style={{ color: '#FFF' }}>120+ ta</strong></span>
                <span>O'rtacha oylik darslar soni: <strong style={{ color: '#FFF' }}>48,500+ ta</strong></span>
              </div>
              <span style={{ color: 'var(--lp-success)' }}>Barcha analitik hisobotlarni yuklab olish (.pdf/.xlsx) →</span>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="lp-section">
        <div className="lp-container">
          
          <div className="lp-section-header">
            <span className="lp-badge">
              Foydalanuvchilar fikri
            </span>
            <h2 className="lp-section-title">
              Mijozlarimiz Teacher Web haqida nima deyishadi?
            </h2>
            <p className="lp-section-desc">
              Platformamizdan foydalanayotgan maktab direktorlari va adminlari tomonidan bildirilgan samimiy fikrlar.
            </p>
          </div>

          <div className="lp-testimonials-grid">
            
            {/* Testimonial 1 */}
            <div className="lp-testimonial-card">
              <span className="lp-quote-icon">“</span>
              <div className="lp-stars">
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
              </div>
              <p className="lp-testi-text">
                "Teacher Web tizimini joriy qilganimizdan so'ng, o'qituvchilar davomati muammosi butunlay barham topdi. QR Check-in orqali kechikishlar soni 80% ga kamaydi."
              </p>
              <div className="lp-testi-user">
                <img className="lp-testi-avatar" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80" alt="" />
                <div className="flex-col">
                  <span className="lp-testi-name">Umida Qodirova</span>
                  <span className="lp-testi-pos">Maktab direktori, 12-IDUM</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="lp-testimonial-card">
              <span className="lp-quote-icon">“</span>
              <div className="lp-stars">
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
              </div>
              <p className="lp-testi-text">
                "Video hisobot tizimi bizga darslarning qanday o'tilayotganini real vaqtda kuzatishga imkon beradi. Adminlar har kuni dars videolarini tasdiqlab, nazorat qiladi."
              </p>
              <div className="lp-testi-user">
                <img className="lp-testi-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="" />
                <div className="flex-col">
                  <span className="lp-testi-name">Shuhrat Karimov</span>
                  <span className="lp-testi-pos">O'quv markazi rahbari, 'Level Up'</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="lp-testimonial-card">
              <span className="lp-quote-icon">“</span>
              <div className="lp-stars">
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
                <Star size={16} fill="#FBBF24" />
              </div>
              <p className="lp-testi-text">
                "KPI va avtomatik reyting tizimi o'qituvchilarimiz o'rtasida sog'lom raqobatni yuzaga keltirdi. Platforma orqali hisobot olish nihoyatda oson va qulay."
              </p>
              <div className="lp-testi-user">
                <img className="lp-testi-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="" />
                <div className="flex-col">
                  <span className="lp-testi-name">Nargiza Alimova</span>
                  <span className="lp-testi-pos">Bosh administrator, 'Smart Academy'</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="narxlar" className="lp-section" style={{ background: '#090D1A' }}>
        <div className="lp-container">
          
          <div className="lp-section-header">
            <span className="lp-badge">
              Tarif Rejalari
            </span>
            <h2 className="lp-section-title">
              Sizga mos keladigan tarifni tanlang
            </h2>
            <p className="lp-section-desc">
              Hech qanday yashirin to'lovlarsiz, maktabingiz yoki o'quv markazingiz hajmiga qarab tariflar.
            </p>

            {/* Period selector switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: !isAnnual ? 'var(--lp-text)' : 'var(--lp-text-muted)' }}>Oylik</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                style={{ 
                  width: '44px', height: '24px', borderRadius: '999px', background: 'var(--lp-primary)', 
                  position: 'relative', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer' 
                }}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '50%', background: '#FFF', 
                  transition: 'all 0.3s ease', transform: isAnnual ? 'translateX(20px)' : 'translateX(0)' 
                }}></div>
              </button>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isAnnual ? 'var(--lp-text)' : 'var(--lp-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Yillik <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>-20%</span>
              </span>
            </div>
          </div>

          <div className="lp-pricing-grid">
            
            {/* Starter Plan */}
            <div className="lp-pricing-card">
              <div className="lp-price-header">
                <h3 className="lp-plan-name">Starter</h3>
                <p className="lp-plan-desc">Kichik hajmdagi ta'lim markazlari uchun</p>
                <div className="lp-price-wrapper">
                  <span className="lp-price-amount">{isAnnual ? '390k' : '490k'}</span>
                  <span className="lp-price-period">so'm / {isAnnual ? 'yil' : 'oy'}</span>
                </div>
              </div>
              <ul className="lp-pricing-features">
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>25 tagacha o'qituvchi</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>QR Check-in davomat</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Dars jadvallarini boshqarish</span>
                </li>
                <li className="lp-pricing-feature disabled">
                  <X size={16} style={{ color: 'var(--lp-danger)' }} />
                  <span>Video hisobotlar (Cheklangan)</span>
                </li>
                <li className="lp-pricing-feature disabled">
                  <X size={16} style={{ color: 'var(--lp-danger)' }} />
                  <span>KPI va Reyting tahlili</span>
                </li>
              </ul>
              <button className="lp-price-btn outline" onClick={() => navigate('/login')}>Boshlash</button>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="lp-pricing-card premium">
              <span className="lp-pricing-badge">Ommabop</span>
              <div className="lp-price-header">
                <h3 className="lp-plan-name">Professional</h3>
                <p className="lp-plan-desc">O'rta va yirik maktablar uchun</p>
                <div className="lp-price-wrapper">
                  <span className="lp-price-amount">{isAnnual ? '790k' : '990k'}</span>
                  <span className="lp-price-period">so'm / {isAnnual ? 'yil' : 'oy'}</span>
                </div>
              </div>
              <ul className="lp-pricing-features">
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>100 tagacha o'qituvchi</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>QR Check-in davomat</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Dars jadvallarini boshqarish</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Video hisobotlar yuklash (Cheksiz)</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>KPI va Reyting tahlili</span>
                </li>
              </ul>
              <button className="lp-price-btn primary" onClick={() => navigate('/login')}>Tizimni Boshlash →</button>
            </div>

            {/* Enterprise Plan */}
            <div className="lp-pricing-card">
              <div className="lp-price-header">
                <h3 className="lp-plan-name">Enterprise</h3>
                <p className="lp-plan-desc">Yirik davlat va xususiy maktablar zanjiri uchun</p>
                <div className="lp-price-wrapper">
                  <span className="lp-price-amount" style={{ fontSize: '2.4rem' }}>Kelishilgan</span>
                </div>
              </div>
              <ul className="lp-pricing-features">
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Cheksiz o'qituvchilar</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>QR Check-in davomat</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Dars jadvallarini boshqarish</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Video hisobotlar & Monitoring</span>
                </li>
                <li className="lp-pricing-feature">
                  <Check size={16} style={{ color: 'var(--lp-success)' }} />
                  <span>Maxsus server & API integratsiyalar</span>
                </li>
              </ul>
              <button className="lp-price-btn outline" onClick={() => navigate('/login')}>Aloqaga Chiqish</button>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="lp-section">
        <div className="lp-container">
          
          <div className="lp-section-header">
            <span className="lp-badge">
              Savollar & Javoblar
            </span>
            <h2 className="lp-section-title">
              Ko'p beriladigan savollar
            </h2>
            <p className="lp-section-desc">
              Teacher Web platformasining ishlashi haqida tez-tez beriladigan savollarga ushbu bo'limda javob olishingiz mumkin.
            </p>
          </div>

          <div className="lp-faq-wrapper">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`lp-faq-item ${openFaq === index ? 'open' : ''}`}
              >
                <button 
                  className="lp-faq-question" 
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className="lp-faq-icon" />
                </button>
                <div 
                  className="lp-faq-answer-wrapper"
                  style={{ 
                    maxHeight: openFaq === index ? '200px' : '0px'
                  }}
                >
                  <div className="lp-faq-answer">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="lp-section" style={{ paddingBottom: '10rem' }}>
        <div className="lp-container">
          <div className="lp-cta-box">
            <div className="lp-cta-glow"></div>
            
            <h2 className="lp-cta-title">
              Teacher Web bilan maktabingizni raqamli kelajakka tayyorlang!
            </h2>
            
            <p className="lp-cta-desc">
              Bugun boshlang va o'qituvchilar boshqaruvi hamda dars nazoratini yangi bosqichga olib chiqing.
            </p>

            <div className="lp-cta-buttons">
              <button className="lp-btn-start" style={{ padding: '0.9rem 2.25rem', fontSize: '1.05rem' }} onClick={() => navigate('/login')}>
                Tizimni boshlash <ArrowRight size={18} />
              </button>
              <button className="lp-btn-sec" style={{ padding: '0.9rem 2.25rem', fontSize: '1.05rem' }} onClick={() => navigate('/login')}>
                Demo ko'rish
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="aloqa" className="lp-footer">
        <div className="lp-container">
          
          <div className="lp-footer-grid">
            
            {/* Logo and Brand desc */}
            <div className="lp-footer-brand">
              <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="lp-logo-icon">
                  <School size={20} color="#FFF" />
                </div>
                <span>Teacher Web</span>
              </div>
              <p className="lp-footer-desc">
                Maktab va o'quv markazlari uchun zamonaviy boshqaruv platformasi.
              </p>
              <div className="lp-footer-socials">
                <div className="lp-footer-social" title="Telegram">
                  <span>TG</span>
                </div>
                <div className="lp-footer-social" title="Facebook">
                  <span>FB</span>
                </div>
                <div className="lp-footer-social" title="Instagram">
                  <span>IN</span>
                </div>
                <div className="lp-footer-social" title="YouTube">
                  <span>YT</span>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Platforma</h4>
              <ul className="lp-footer-links">
                <li className="lp-footer-link" onClick={() => scrollToSection('imkoniyatlar')}>Imkoniyatlar</li>
                <li className="lp-footer-link" onClick={() => scrollToSection('narxlar')}>Narxlar</li>
                <li className="lp-footer-link">Yangiliklar</li>
                <li className="lp-footer-link">Yo'riqnoma</li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Foydali</h4>
              <ul className="lp-footer-links">
                <li className="lp-footer-link">Qo'llanma</li>
                <li className="lp-footer-link">Savol & Javob</li>
                <li className="lp-footer-link">Blog</li>
                <li className="lp-footer-link" onClick={() => scrollToSection('aloqa')}>Aloqa</li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Qo'llab-quvvatlash</h4>
              <ul className="lp-footer-links">
                <li className="lp-footer-link">Texnik yordam</li>
                <li className="lp-footer-link">Maxfiylik siyosati</li>
                <li className="lp-footer-link">Foydalanish shartlari</li>
              </ul>
            </div>

            {/* Contact details */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Aloqa ma'lumotlari</h4>
              <ul className="lp-footer-links" style={{ gap: '1rem' }}>
                <li className="lp-footer-contact-item">
                  <span>+998 90 123 45 67</span>
                </li>
                <li className="lp-footer-contact-item">
                  <span>support@teacherweb.uz</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Creator Credit */}
          <div className="lp-footer-bottom">
            <div className="lp-creator-credit">
              Yaratuvchi: <span className="lp-creator-name">Humoyun Jo'rayev</span>
            </div>
            <div className="lp-copyright">
              © 2026 Teacher Web. Barcha huquqlar himoyalangan.
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
