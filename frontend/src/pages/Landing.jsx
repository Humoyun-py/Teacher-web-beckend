import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, BarChart3, Bell, Shield, Cloud, 
  ChevronRight, ArrowRight, Star, Plus, Minus,
  Users, CheckCircle, Clock, Play
} from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    { icon: <QrCode size={24} />, title: "QR Check-in", desc: "Instant attendance tracking with secure QR technology." },
    { icon: <Calendar size={24} />, title: "Lesson Schedule", desc: "Automated timetables with real-time updates." },
    { icon: <CheckCircle size={24} />, title: "Lesson Verification", desc: "Digital confirmation of completed classes." },
    { icon: <BarChart3 size={24} />, title: "Teacher Analytics", desc: "Comprehensive performance metrics and KPI tracking." },
    { icon: <Bell size={24} />, title: "Notifications", desc: "Smart alerts for late arrivals and missed lessons." },
    { icon: <Shield size={24} />, title: "Secure Cloud", desc: "Enterprise-grade data protection for your school." }
  ];

  const stats = [
    { value: "120+", label: "Schools" },
    { value: "3,000+", label: "Teachers" },
    { value: "500K+", label: "Attendance Records" },
    { value: "99.9%", label: "System Uptime" }
  ];

  return (
    <div className="landing-body">
      {/* Navbar */}
      <nav className="glass-nav" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>
        <div className="nav-container">
          <div className="flex-center" style={{ gap: '0.75rem' }}>
            <div style={{ background: 'var(--landing-primary)', padding: '6px', borderRadius: '8px' }}>
              <Shield size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Teacher Web</span>
          </div>
          
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#about" className="nav-link">About</a>
          </div>

          <div className="flex-center" style={{ gap: '1rem' }}>
            <Link to="/login" className="btn-premium btn-outline-landing">Login</Link>
            <Link to="/login" className="btn-premium btn-primary-glow">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section-padding" style={{ paddingTop: '160px' }}>
        <div className="hero-grid">
          <div className="animate-fade-up">
            <h1 className="landing-h1">
              Teacher Management <br />
              <span className="gradient-text">Made Smarter.</span>
            </h1>
            <p className="landing-p" style={{ marginBottom: '2.5rem' }}>
              The ultimate platform for schools to automate attendance, schedules, and analytics. 
              Built for performance, designed for excellence.
            </p>
            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
              <Link to="/login" className="btn-premium btn-primary-glow" style={{ padding: '1rem 2.5rem' }}>
                Get Started Today <ArrowRight size={18} />
              </Link>
              <button className="btn-premium btn-outline-landing" style={{ padding: '1rem 2rem' }}>
                <Play size={18} fill="white" /> Watch Demo
              </button>
            </div>
          </div>

          <div className="animate-float" style={{ position: 'relative' }}>
            {/* Mockup UI Elements */}
            <div className="widget animate-glow" style={{ position: 'absolute', top: '10%', right: '5%', width: '280px', zIndex: 2 }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600 }}>Attendance</span>
                <span className="badge badge-success" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>98% Today</span>
              </div>
              <div className="flex-col" style={{ gap: '0.75rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                    <div className="flex-center" style={{ gap: '0.5rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6' }} />
                      <span style={{ fontSize: '0.8rem' }}>Teacher {i}</span>
                    </div>
                    <CheckCircle size={14} color="#22c55e" />
                  </div>
                ))}
              </div>
            </div>

            <div className="widget" style={{ position: 'absolute', bottom: '0', left: '0', width: '320px', zIndex: 3, border: '1px solid var(--landing-primary)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--landing-text-muted)', display: 'block', marginBottom: '0.5rem' }}>Monthly Performance</span>
              <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(to top, var(--landing-primary), var(--landing-secondary))', borderRadius: '4px 4px 0 0' }} />
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: '500px', background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', borderRadius: 'var(--landing-radius)', border: '1px solid var(--landing-border)' }} />
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section style={{ padding: '40px 5%', borderY: '1px solid var(--landing-border)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--landing-text-muted)', marginBottom: '2rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Trusted by forward-thinking institutions</p>
          <div className="flex-between" style={{ opacity: 0.6, filter: 'grayscale(1)', flexWrap: 'wrap', gap: '2rem' }}>
            {['Global School', 'EduCenter', 'Elite Academy', 'Bright Future', 'Horizon Prep'].map(name => (
              <span key={name} style={{ fontSize: '1.25rem', fontWeight: 700 }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="section-padding">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="landing-h1" style={{ fontSize: '3rem' }}>Everything you need to <br/> <span className="gradient-text">scale your education.</span></h2>
        </div>
        <div className="grid grid-cols-3" style={{ gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ color: 'var(--landing-primary)', marginBottom: '1.5rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--landing-text-muted)', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="section-padding" style={{ background: 'rgba(99, 102, 241, 0.03)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="landing-h1" style={{ fontSize: '2.5rem' }}>Experience the <span className="gradient-text">Future of Schooling.</span></h2>
          <p className="landing-p" style={{ margin: '0 auto' }}>A powerful interface designed for speed and clarity.</p>
        </div>
        <div className="glass-card animate-glow" style={{ maxWidth: '1100px', margin: '0 auto', overflow: 'hidden', border: '1px solid var(--landing-primary)' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--landing-border)', display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <div style={{ padding: '2rem' }}>
             <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                <div className="flex-col" style={{ gap: '1.5rem' }}>
                  <div className="widget">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--landing-text-muted)' }}>Teacher Statistics</h4>
                    <div className="flex-between">
                      <div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>2,482</span>
                        <p style={{ fontSize: '0.7rem', color: 'var(--landing-success)' }}>+12% from last month</p>
                      </div>
                      <BarChart3 size={32} color="var(--landing-primary)" />
                    </div>
                  </div>
                  <div className="widget">
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--landing-text-muted)' }}>Weekly Attendance</h4>
                    <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      {[30, 50, 40, 80, 60, 90, 70].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="widget">
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--landing-text-muted)' }}>Teacher Ranking</h4>
                  <div className="flex-col" style={{ gap: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex-between">
                        <div className="flex-center" style={{ gap: '0.75rem' }}>
                          <span style={{ color: 'var(--landing-text-muted)', width: '15px' }}>{i}</span>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${220 + i * 20}, 70%, 60%)`, border: '1px solid rgba(255,255,255,0.1)' }} />
                          <span style={{ fontSize: '0.9rem' }}>Teacher {i}</span>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{(98 - i * 2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding">
        <div className="hero-grid">
          <div>
            <h2 className="landing-h1" style={{ fontSize: '2.8rem' }}>Maximize <span className="gradient-text">Efficiency.</span></h2>
            <p className="landing-p" style={{ marginBottom: '2rem' }}>
              Eliminate manual paperwork and focus on what matters most: education. Our platform provides the insights you need to grow.
            </p>
            <div className="flex-col" style={{ gap: '1rem' }}>
              {["Automated daily reports", "Instant lesson verification", "Real-time teacher tracking", "Comprehensive KPI engine"].map(item => (
                <div key={item} className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px', borderRadius: '50%' }}>
                    <CheckCircle size={18} />
                  </div>
                  <span style={{ fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="widget animate-float" style={{ animationDelay: '1s' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--landing-text-muted)', marginBottom: '1rem' }}>Teacher KPI</h4>
              <div style={{ width: '100px', height: '100px', margin: '0 auto', border: '8px solid var(--landing-primary)', borderRadius: '50%', borderRightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 700 }}>85%</span>
              </div>
            </div>
            <div className="widget animate-float">
              <h4 style={{ fontSize: '0.8rem', color: 'var(--landing-text-muted)', marginBottom: '1rem' }}>Efficiency</h4>
              <div style={{ height: '100px', background: 'linear-gradient(45deg, var(--landing-primary), var(--landing-secondary))', opacity: 0.3, borderRadius: '8px' }} />
            </div>
            <div className="widget" style={{ gridColumn: 'span 2' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--landing-text-muted)', marginBottom: '1rem' }}>System Health</h4>
              <div className="flex-between">
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>99.98%</span>
                <div style={{ padding: '4px 12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '20px', fontSize: '0.7rem' }}>Stable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="landing-h1" style={{ fontSize: '3rem' }}>What leaders <span className="gradient-text">say.</span></h2>
        </div>
        <div className="grid grid-cols-3" style={{ gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          {[
            { name: "John Smith", role: "Principal, Global School", text: "Teacher Web has completely transformed how we manage our faculty. The QR check-in is a game changer." },
            { name: "Sarah Jenkins", role: "Director, EduCenter", text: "The analytics provided by the platform are incredibly detailed. We can now track teacher performance with ease." },
            { name: "Michael Chen", role: "Administrator, Horizon Prep", text: "User-friendly, secure, and incredibly efficient. Our teachers love it and so does our management team." }
          ].map((t, i) => (
            <div key={i} className="glass-card" style={{ padding: '2.5rem' }}>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--landing-warning)' }}>
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <p style={{ color: 'var(--landing-text)', fontStyle: 'italic', marginBottom: '2rem', lineHeight: '1.7' }}>"{t.text}"</p>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--landing-hover)' }} />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{t.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--landing-text-muted)' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Counters */}
      <section className="section-padding">
        <div className="pricing-grid" style={{ maxWidth: '1200px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <h2 className="landing-h1" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{s.value}</h2>
              <p style={{ color: 'var(--landing-text-muted)', fontSize: '1.1rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-padding" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 className="landing-h1">Simple, <span className="gradient-text">Transparent Pricing.</span></h2>
        </div>
        <div className="pricing-grid">
          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <span style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem' }}>Starter</span>
            <div style={{ margin: '1.5rem 0' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700 }}>$49</span>
              <span style={{ color: 'var(--landing-text-muted)' }}>/mo</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Up to 20 Teachers</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Basic Analytics</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> QR Attendance</li>
            </ul>
            <button className="btn-premium btn-outline-landing" style={{ width: '100%', justifyContent: 'center' }}>Get Started</button>
          </div>

          <div className="glass-card featured" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem' }}>Professional</span>
              <span style={{ background: 'var(--landing-primary)', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>MOST POPULAR</span>
            </div>
            <div style={{ margin: '1.5rem 0' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700 }}>$99</span>
              <span style={{ color: 'var(--landing-text-muted)' }}>/mo</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Unlimited Teachers</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Advanced KPI Engine</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Video Reviews</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Priority Support</li>
            </ul>
            <button className="btn-premium btn-primary-glow" style={{ width: '100%', justifyContent: 'center' }}>Get Started</button>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <span style={{ color: 'var(--landing-text-muted)', fontSize: '0.9rem' }}>Enterprise</span>
            <div style={{ margin: '1.5rem 0' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700 }}>Custom</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Multi-School Management</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Custom Integrations</li>
              <li className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}><CheckCircle size={16} color="var(--landing-success)" /> Dedicated Account Manager</li>
            </ul>
            <button className="btn-premium btn-outline-landing" style={{ width: '100%', justifyContent: 'center' }}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="landing-h1" style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem' }}>Common Questions</h2>
          <div className="flex-col">
            {[
              { q: "How does the QR check-in work?", a: "Teachers scan a unique QR code generated by the system using their mobile devices to confirm arrival and departure." },
              { q: "Is my school's data secure?", a: "Yes, we use enterprise-grade encryption and regular backups to ensure your data is always protected and available." },
              { q: "Can I try before I buy?", a: "Absolutely! Sign up for our 'Get Started' plan to explore the features or contact us for a full demo." }
            ].map((item, i) => (
              <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`} onClick={() => toggleFaq(i)}>
                <div className="faq-question">
                  {item.q}
                  {activeFaq === i ? <Minus size={20} /> : <Plus size={20} />}
                </div>
                <div className="faq-answer">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding">
        <div className="glass-card animate-glow" style={{ padding: '5rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, var(--landing-sidebar) 0%, var(--landing-bg) 100%)', border: '1px solid var(--landing-primary)' }}>
          <h2 className="landing-h1">Ready to modernize your school?</h2>
          <p className="landing-p" style={{ margin: '0 auto 3rem' }}>Join hundreds of schools already using Teacher Web to streamline their operations.</p>
          <div className="flex-center" style={{ gap: '1.5rem' }}>
            <Link to="/login" className="btn-premium btn-primary-glow" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Start Now</Link>
            <button className="btn-premium btn-outline-landing" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Book Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 5%', borderTop: '1px solid var(--landing-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4rem' }}>
          <div>
            <div className="flex-center" style={{ gap: '0.75rem', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
              <Shield size={24} color="var(--landing-primary)" />
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Teacher Web</span>
            </div>
            <p style={{ color: 'var(--landing-text-muted)', lineHeight: '1.6' }}>The next generation of school management. Built for teachers, by experts.</p>
          </div>
          <div>
            <h4 style={{ marginBottom: '1.5rem' }}>Platform</h4>
            <div className="flex-col" style={{ gap: '0.75rem', color: 'var(--landing-text-muted)', fontSize: '0.9rem' }}>
              <span>Features</span>
              <span>Pricing</span>
              <span>Security</span>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '1.5rem' }}>Support</h4>
            <div className="flex-col" style={{ gap: '0.75rem', color: 'var(--landing-text-muted)', fontSize: '0.9rem' }}>
              <span>Documentation</span>
              <span>Contact Us</span>
              <span>Status</span>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '1.5rem' }}>Legal</h4>
            <div className="flex-col" style={{ gap: '0.75rem', color: 'var(--landing-text-muted)', fontSize: '0.9rem' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '40px auto 0', paddingTop: '40px', borderTop: '1px solid var(--landing-border)', textAlign: 'center', color: 'var(--landing-text-muted)', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} Teacher Web. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
