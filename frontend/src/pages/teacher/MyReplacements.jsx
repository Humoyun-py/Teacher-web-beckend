import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, ArrowRightLeft } from 'lucide-react';
import { api } from '../../api';

export default function MyReplacements() {
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReplacements().then(res => {
      setReplacements(Array.isArray(res) ? res : res.results || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Separate: my lessons that were replaced vs lessons I'm replacing
  const myReplacedOut = replacements.filter(r => r.teacher_name && r.teacher_name.includes(user.first_name || '___'));
  const myReplacedIn = replacements.filter(r => r.replacement_teacher_name && r.replacement_teacher_name.includes(user.first_name || '___'));

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ height: '100%' }}>
      <div>
        <h1 className="heading-2">🔄 O'rinbosarlar</h1>
        <p className="text-muted">Sizning o'rinbosar darsingiz va boshqalar o'rniga darslar</p>
      </div>

      {loading ? (
        <div className="glass flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
          <Loader className="spinner" size={32} color="var(--primary)" />
          <p className="text-muted">Yuklanmoqda...</p>
        </div>
      ) : replacements.length === 0 ? (
        <div className="glass flex-center" style={{ flex: 1, flexDirection: 'column', gap: '1rem', padding: '3rem', color: 'var(--text-muted)' }}>
          <ArrowRightLeft size={48} style={{ opacity: 0.3 }} />
          <p>Hali o'rinbosar darslar yo'q</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {/* Darslar - boshqalar o'rniga (men o'rinbosar) */}
          {myReplacedIn.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ Siz o'rinbosar bo'lgan darslar ({myReplacedIn.length})
              </h3>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Fan</th><th>Sinf</th><th>Asl ustoz</th><th>Vaqt</th><th>Holat</th></tr></thead>
                  <tbody>
                    {myReplacedIn.map(r => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 500 }}>{r.subject_name}</td>
                        <td>{r.class_name}</td>
                        <td>{r.teacher_name}</td>
                        <td className="text-muted">{r.scheduled_start} - {r.scheduled_end}</td>
                        <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status_display}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mening darslarim - replace bo'lgan */}
          {myReplacedOut.length > 0 && (
            <div className="glass" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ❌ Sizning darslaringiz — o'rinbosar yuborilgan ({myReplacedOut.length})
              </h3>
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.85rem' }}>
                  <thead><tr><th>Sana</th><th>Fan</th><th>Sinf</th><th>O'rinbosar</th><th>Sabab</th><th>Holat</th></tr></thead>
                  <tbody>
                    {myReplacedOut.map(r => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td style={{ fontWeight: 500 }}>{r.subject_name}</td>
                        <td>{r.class_name}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.replacement_teacher_name}</td>
                        <td className="text-muted">{r.replacement_reason || '-'}</td>
                        <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status_display}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Barcha replacement darslar */}
          <div className="glass" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>📋 Barcha o'rinbosar darslar</h3>
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead><tr><th>Sana</th><th>Fan</th><th>Asl ustoz</th><th>O'rinbosar</th><th>Sabab</th><th>Holat</th></tr></thead>
                <tbody>
                  {replacements.map(r => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.subject_name}</td>
                      <td>{r.teacher_name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.replacement_teacher_name}</td>
                      <td className="text-muted">{r.replacement_reason || '-'}</td>
                      <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{r.status_display}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
