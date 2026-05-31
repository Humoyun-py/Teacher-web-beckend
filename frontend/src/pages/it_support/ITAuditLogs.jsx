import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, Loader, RefreshCw, X, Eye, Calendar,
  Shield, CheckCircle, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { api } from '../../api';

export default function ITAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let params = '';
      const parts = [];
      if (search) parts.push(`search=${search}`);
      if (actionFilter) parts.push(`action=${actionFilter}`);
      if (parts.length > 0) params = '?' + parts.join('&');
      
      const res = await api.getITAuditLogs(params);
      setLogs(res.results || res || []);
    } catch (e) {
      console.error(e);
      alert('Audit loglarni yuklab bo\'lmadi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  return (
    <div className="flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-2">Tizim audit loglari (Audit Trail)</h1>
          <p className="text-muted">Barcha ma'murlar va IT Support xodimlari tomonidan bajarilgan amallar tarixi</p>
        </div>
        <button className="btn btn-outline" onClick={loadLogs}>
          <RefreshCw size={15} /> Yangilash
        </button>
      </div>

      {/* Filters Form */}
      <form onSubmit={handleSearchSubmit} className="glass" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Izlash (Foydalanuvchi, IP, amal)..." 
            style={{ paddingLeft: '2.5rem' }} 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="input-field" 
          value={actionFilter} 
          onChange={e => setActionFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">Barcha amallar</option>
          <option value="create">CREATE (Yaratish)</option>
          <option value="update">UPDATE (O'zgartirish)</option>
          <option value="delete">DELETE (O'chirish)</option>
          <option value="login">LOGIN (Kirish)</option>
          <option value="logout">LOGOUT (Chiqish)</option>
          <option value="other">OTHER (Boshqa)</option>
        </select>

        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Izlash</button>
      </form>

      {/* Logs Table */}
      <div className="table-container glass" style={{ flex: 1, marginTop: '1rem' }}>
        {loading ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <Loader className="spinner" size={36} color="var(--primary)" />
            <p className="text-muted">Audit loglar yuklanmoqda...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex-center flex-col gap-3" style={{ padding: '3rem' }}>
            <Activity size={48} color="var(--text-muted)" />
            <p className="text-muted">Audit loglar topilmadi.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Foydalanuvchi</th>
                <th>Amal turi</th>
                <th>Tavsif (Description)</th>
                <th>IP Manzil</th>
                <th style={{ textAlign: 'right' }}>Batafsil</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="table-row-hover">
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('uz-UZ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex-col">
                      <span style={{ fontWeight: 600 }}>{log.user_name || 'System'}</span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>Role: {log.user_role || 'system'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      fontSize: '0.7rem', 
                      background: log.action === 'delete' ? 'rgba(239,68,68,0.12)' : log.action === 'create' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                      color: log.action === 'delete' ? 'var(--danger)' : log.action === 'create' ? 'var(--success)' : 'var(--warning)',
                      textTransform: 'uppercase'
                    }}>
                      {log.action_display || log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{log.description}</span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.ip_address || '—'}</code>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--primary)' }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye size={12} /> Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass flex-col" style={{ width: '90%', maxWidth: '560px', padding: '2rem', gap: '1.25rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex-between">
              <h3 className="heading-3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--primary)" /> Audit log tafsilotlari
              </h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div className="flex-col gap-3" style={{ fontSize: '0.9rem' }}>
              <div className="flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-muted">Foydalanuvchi:</span>
                <span style={{ fontWeight: 600 }}>{selectedLog.user_name || 'System'} (@{selectedLog.user_username || 'system'})</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-muted">Roli:</span>
                <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{selectedLog.user_role || 'system'}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-muted">Amal:</span>
                <span className="badge badge-warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>{selectedLog.action}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-muted">Tavsif:</span>
                <span style={{ fontWeight: 500 }}>{selectedLog.description}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-muted">Sana & Vaqt:</span>
                <span>{new Date(selectedLog.created_at).toLocaleString('uz-UZ')}</span>
              </div>
              <div className="flex-between" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span className="text-muted">IP & User Agent:</span>
                <span style={{ fontSize: '0.8rem', textAlign: 'right', wordBreak: 'break-all' }}>
                  {selectedLog.ip_address || '—'} <br/>
                  <small className="text-muted">{selectedLog.user_agent || '—'}</small>
                </span>
              </div>

              {/* JSON Changes */}
              {selectedLog.changes_json && Object.keys(selectedLog.changes_json).length > 0 && (
                <div className="flex-col gap-2" style={{ marginTop: '0.5rem' }}>
                  <span className="text-muted">O'zgarishlar diff (JSON):</span>
                  <pre style={{ 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    overflowX: 'auto', 
                    maxHeight: '180px',
                    border: '1px solid var(--surface-border)'
                  }}>
                    {JSON.stringify(selectedLog.changes_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedLog(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
