import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, QrCode, LogIn } from 'lucide-react';
import { api } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Iltimos barcha maydonlarni to'ldiring");
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('access_token', res.access_token);
      if(res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      
      // Navigate by role
      if (res.user && res.user.role === 'admin') {
         navigate('/admin');
      } else {
         navigate('/teacher');
      }
    } catch (err) {
      console.error(err);
      setError("Login yoki parol noto'g'ri (yoki server ishlamayapti)!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center flex-col animate-fade-in" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        <div className="flex-center flex-col gap-4" style={{ marginBottom: '2rem' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 className="heading-2" style={{ textAlign: 'center' }}>Tizimga kirish</h1>
          <p className="text-muted" style={{ textAlign: 'center', marginTop: '-0.5rem' }}>
            Haqiqiy backend API serveriga ulanish
          </p>
        </div>

        <form className="flex-col gap-4" onSubmit={handleLogin}>
          
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{error}</div>}

          <div className="input-group">
            <label className="input-label">Username (Login)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="admin qodirov ..." 
                style={{ paddingLeft: '2.75rem' }} 
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Parol</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                 type="password" 
                 className="input-field" 
                 placeholder="••••••••" 
                 style={{ paddingLeft: '2.75rem' }} 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              type="submit"
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              <LogIn size={18} /> {loading ? "Ulanmoqda..." : "Tizimga Kirish"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
