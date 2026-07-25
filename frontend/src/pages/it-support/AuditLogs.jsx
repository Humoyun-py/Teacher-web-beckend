import { useState, useEffect } from 'react';
import { History, Search, Download, RefreshCcw } from 'lucide-react';
import { api } from '../../api';

export default function AuditLogs() {
    const [search, setSearch] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditLogs();
            const formattedLogs = (data.results || data).map(item => ({
                id: item.id,
                user: item.user_name || 'System',
                action: item.action_display || item.action,
                target: item.description || `${item.target_model} ${item.target_name ? `(${item.target_name})` : ''}`,
                time: new Date(item.created_at).toLocaleString('uz-UZ'),
                type: item.action || 'info'
            }));
            setLogs(formattedLogs);
        } catch (err) {
            console.error("Loglarni yuklashda xato:", err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        const t = String(type).toLowerCase();
        if (t.includes('delete') || t.includes('block')) return 'var(--danger)';
        if (t.includes('create') || t.includes('restore') || t.includes('unblock') || t.includes('success')) return 'var(--success)';
        if (t.includes('update') || t.includes('fix') || t.includes('change') || t.includes('config')) return 'var(--warning)';
        return 'var(--primary)';
    };

    const filteredLogs = logs.filter(log =>
        (log.user + ' ' + log.action + ' ' + log.target).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in flex-col gap-6">
            <div className="flex-between">
                <div>
                    <h1 className="heading-1">Audit Loglar (Activity)</h1>
                    <p className="text-muted">Tizimdagi barcha o'zgarishlar va real-vaqt harakatlari</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-outline gap-2" onClick={loadLogs}>
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} /> Yangilash
                    </button>
                    <button className="btn btn-primary gap-2">
                        <Download size={18} /> Excelga yuklash
                    </button>
                </div>
            </div>

            <div className="glass-panel">
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--surface-border)' }} className="flex-between gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            className="input-field w-full pl-10"
                            placeholder="Foydalanuvchi yoki amal bo'yicha qidiruv..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-col">
                    {loading ? (
                        <div className="p-10 flex-center"><div className="loader"></div></div>
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log, i) => (
                            <div
                                key={log.id}
                                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-all text-sm"
                                style={{ borderBottom: i !== filteredLogs.length - 1 ? '1px solid var(--surface-border)' : 'none' }}
                            >
                                <div
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: `${getTypeColor(log.type)}15`, color: getTypeColor(log.type),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}
                                >
                                    <History size={16} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-2">
                                        <span style={{ fontWeight: 600 }}>{log.user}</span>
                                        <span style={{ color: 'var(--text-main)' }}>{log.action}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                            {log.target}
                                        </span>
                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>• {log.time}</span>
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm text-primary" onClick={async () => {
                                    try {
                                        const detail = await api.getAuditLogDetail(log.id);
                                        setSelectedLog(detail);
                                    } catch (_e) { alert('Xatolik'); }
                                }}>
                                    Batafsil
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 flex-center text-muted">Harakatlar topilmadi</div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedLog(null)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: 'var(--radius-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 className="heading-3" style={{ marginBottom: '1rem' }}>Audit Log Batafsil</h3>
                        <div className="flex-col gap-2" style={{ fontSize: '0.85rem' }}>
                            <div className="flex-between"><span className="text-muted">ID:</span><span>{selectedLog.id}</span></div>
                            <div className="flex-between"><span className="text-muted">Foydalanuvchi:</span><span>{selectedLog.user_name || selectedLog.user?.username || '—'}</span></div>
                            <div className="flex-between"><span className="text-muted">Amal:</span><span>{selectedLog.action_display || selectedLog.action}</span></div>
                            <div className="flex-between"><span className="text-muted">Model:</span><span>{selectedLog.target_model || '—'}</span></div>
                            <div className="flex-between"><span className="text-muted">Tavsif:</span><span>{selectedLog.description || '—'}</span></div>
                            <div className="flex-between"><span className="text-muted">IP:</span><span>{selectedLog.ip_address || '—'}</span></div>
                            <div className="flex-between"><span className="text-muted">Vaqt:</span><span>{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('uz-UZ') : '—'}</span></div>
                        </div>
                        <button className="btn btn-primary w-full" style={{ marginTop: '1.5rem' }} onClick={() => setSelectedLog(null)}>Yopish</button>
                    </div>
                </div>
            )}
        </div>
    );
}
