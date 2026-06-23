import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize2, RefreshCw, Shield, Layout, Radio, AlertCircle, Eye, EyeOff, Zap, Activity, Plus, X, Play, Settings, Trash2, Edit } from 'lucide-react';
import { api } from '../../api';

// --- HLS Video Player Component ---
const HlsPlayer = ({ url, isActive }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!url || !isActive) return;

        let hls;
        const loadVideo = async () => {
            // Dinamik ravishda HLS.js ni yuklash
            if (!window.Hls) {
                const script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
                document.head.appendChild(script);
                script.onload = () => initPlayer();
            } else {
                initPlayer();
            }
        };

        const initPlayer = () => {
            if (window.Hls.isSupported()) {
                hls = new window.Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);
                hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                    videoRef.current.play().catch(e => console.log("Auto-play blocked"));
                });
            } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari uchun native support
                videoRef.current.src = url;
            }
        };

        loadVideo();
        return () => {
            if (hls) hls.destroy();
        };
    }, [url, isActive]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
            <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                controls={false}
                muted
                autoPlay
            />
            {(!url || !url.startsWith('http')) && (
                <div className="absolute inset-0 flex-center flex-col gap-4 bg-black/80">
                    <Zap size={48} className="text-primary animate-pulse" />
                    <p className="font-mono text-xs text-primary">LIVE STREAM PROXY / RTSP</p>
                    <p className="text-[10px] text-muted max-w-xs text-center" style={{ padding: '0 1rem' }}>
                        URL: {url || 'Stream manzili kiritilmagan'}<br/>
                        Eslatma: RTSP kameralarni ko'rish uchun HLS streamUrl taqdim etilishi kerak.
                    </p>
                </div>
            )}
        </div>
    );
};

export default function CCTVMonitoring() {
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCam, setActiveCam] = useState(null);
    const [isNightVision, setNightVision] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCam, setEditingCam] = useState(null);
    const [form, setForm] = useState({ name: '', location: '', ip_address: '', stream_url: '', status: 'online' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadCameras(); }, []);

    const loadCameras = async () => {
        setLoading(true);
        try {
            const data = await api.getCCTVCameras();
            setCameras(data.results || data || []);
        } catch (err) {
            console.error("Kameralarni yuklashda xatolik:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEditCamera = async () => {
        if (!form.name || !form.location || !form.stream_url) {
            return alert("Iltimos, nomi, o'rnatilgan joyi va stream URL manzillarini to'ldiring");
        }
        setSaving(true);
        try {
            if (editingCam) {
                await api.updateCCTVCamera(editingCam.id, form);
                alert("✅ Kamera sozlamalari yangilandi");
            } else {
                await api.createCCTVCamera(form);
                alert("✅ Yangi kamera muvaffaqiyatli qo'shildi");
            }
            setShowAddModal(false);
            setEditingCam(null);
            setForm({ name: '', location: '', ip_address: '', stream_url: '', status: 'online' });
            loadCameras();
        } catch (e) {
            alert("Xatolik: " + (e.data?.detail || JSON.stringify(e.data) || "Noma'lum xatolik"));
        } finally {
            setSaving(false);
        }
    };

    const handleHealthCheck = async (id) => {
        try {
            const res = await api.healthCheckCamera(id);
            alert(`✅ Status tekshirildi: Kamera holati - ${res.status || 'muvaffaqiyatli'}`);
            loadCameras();
        } catch (e) {
            alert("Tekshiruv amalga oshmadi: " + (e.data?.detail || "Xatolik"));
        }
    };

    const handleCheckAll = async () => {
        try {
            await api.checkAllCameras();
            alert("✅ Barcha kameralar tekshiruvdan o'tkazildi");
            loadCameras();
        } catch (e) {
            alert("Tekshiruv xatosi: " + (e.data?.detail || "Xatolik"));
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`"${name}" kamerasini o'chirishni xohlaysizmi?`)) return;
        try {
            await api.deleteCCTVCamera(id);
            alert("✅ Kamera muvaffaqiyatli o'chirildi");
            loadCameras();
        } catch (e) {
            alert("O'chirishda xatolik: " + (e.data?.detail || "Xatolik"));
        }
    };

    const openEdit = (cam) => {
        setEditingCam(cam);
        setForm({
            name: cam.name,
            location: cam.location,
            ip_address: cam.ip_address || '',
            stream_url: cam.stream_url,
            status: cam.status || 'online'
        });
        setShowAddModal(true);
    };

    const CameraCard = ({ cam }) => (
        <div
            className="glass-panel overflow-hidden group"
            style={{
                padding: 0,
                position: 'relative',
                border: cam.status === 'offline' ? '1px solid rgba(239, 68, 68, 0.3)' : '',
                filter: isNightVision && cam.status === 'online' ? 'sepia(100%) hue-rotate(90deg) brightness(1.2)' : 'none'
            }}
        >
            <div style={{ position: 'relative', height: '200px', background: '#000', overflow: 'hidden' }}>
                <HlsPlayer url={cam.stream_url} isActive={cam.status === 'online'} />

                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '6px', zIndex: 10 }}>
                    <span className={`animate-pulse h-2 w-2 rounded-full ${cam.status === 'online' ? 'bg-success' : 'bg-danger'}`}></span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'white', textTransform: 'uppercase' }}>
                        {cam.status || 'offline'}
                    </span>
                </div>

                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all flex-center gap-3" style={{ zIndex: 20 }}>
                    <button 
                        onClick={() => setActiveCam(cam)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/20 cursor-pointer"
                        title="Kattalashtirish"
                    >
                        <Maximize2 size={20} className="text-white" />
                    </button>
                    <button 
                        onClick={() => openEdit(cam)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/20 cursor-pointer"
                        title="Tahrirlash"
                    >
                        <Edit size={20} className="text-white" />
                    </button>
                    <button 
                        onClick={() => handleDelete(cam.id, cam.name)}
                        className="bg-danger/20 hover:bg-danger/40 backdrop-blur-md p-3 rounded-full border border-danger/40 cursor-pointer"
                        title="O'chirish"
                    >
                        <Trash2 size={20} className="text-white" />
                    </button>
                </div>
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--surface-border)' }} className="flex-between">
                <div>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>{cam.name}</h3>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {cam.location} {cam.ip_address ? `• IP: ${cam.ip_address}` : ''}
                    </p>
                </div>
                <button 
                    onClick={() => handleHealthCheck(cam.id)}
                    className="btn btn-outline" 
                    style={{ fontSize: '10px', padding: '0.25rem 0.5rem' }}
                >
                    Ping Test
                </button>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in flex-col gap-6" style={{ paddingBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)' }}>
                <div className="flex-between flex-wrap gap-4">
                    <div className="flex-col gap-1">
                        <h1 className="heading-2 flex items-center gap-3">
                            <Shield className="text-primary" size={32} /> Security Monitoring Station
                        </h1>
                        <p className="text-muted text-sm">Kameralarni masofaviy boshqarish va integratsiya markazi</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn btn-outline" onClick={handleCheckAll}>
                            <Activity size={18} /> Avto-Tekshirish
                        </button>
                        <button className="btn btn-primary" onClick={() => { setEditingCam(null); setForm({ name: '', location: '', ip_address: '', stream_url: '', status: 'online' }); setShowAddModal(true); }}>
                            <Plus size={18} /> Yangi Kamera
                        </button>
                        <button className="btn btn-outline" onClick={() => setNightVision(!isNightVision)}>
                            {isNightVision ? <Eye size={18} /> : <EyeOff size={18} />}
                            Night Vision
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}><div className="loader"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cameras.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', gridColumn: '1/-1' }}>
                            <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                            <p className="text-muted">Hech qanday CCTV kamera topilmadi. Tizimga yangi kameralar qo'shishingiz mumkin.</p>
                        </div>
                    ) : (
                        cameras.map(cam => <CameraCard key={cam.id} cam={cam} />)
                    )}
                </div>
            )}

            {/* Add/Edit Camera Modal */}
            {showAddModal && (
                <div className="modal-overlay flex-center" style={{ backdropFilter: 'blur(10px)' }} onClick={() => { setShowAddModal(false); setEditingCam(null); }}>
                    <div className="glass-panel p-8 w-full max-w-lg flex-col gap-6 animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="flex-between">
                            <h2 className="heading-3 m-0">{editingCam ? "Kamerani Tahrirlash" : "Yangi Kamera Sozlash"}</h2>
                            <button className="btn btn-ghost" onClick={() => { setShowAddModal(false); setEditingCam(null); }}><X size={20} /></button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Kamera Nomi</label>
                                <input className="input-field" placeholder="Masalan: Darvoza 1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">O'rnatilgan Joyi (Location)</label>
                                <input className="input-field" placeholder="Masalan: A Blok, 1-qavat" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">IP Manzil (Ixtiyoriy)</label>
                                <input className="input-field" placeholder="192.168.1.100" value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Stream URL (HLS/M3U8)</label>
                                <input className="input-field" placeholder="https://domain.com/live/stream.m3u8" value={form.stream_url} onChange={e => setForm({ ...form, stream_url: e.target.value })} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Status</label>
                                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary w-full h-14" onClick={handleAddOrEditCamera} disabled={saving}>
                            {saving ? "Saqlanmoqda..." : (editingCam ? "O'zgarishlarni Saqlash" : "Kamerani Ishga Tushirish")}
                        </button>
                    </div>
                </div>
            )}

            {/* Video Zoom Modal */}
            {activeCam && (
                <div className="modal-overlay flex-center" style={{ backdropFilter: 'blur(20px)' }} onClick={() => setActiveCam(null)}>
                    <div
                        className="glass-panel p-0 w-full max-w-6xl overflow-hidden"
                        style={{ background: '#000', border: '2px solid var(--primary)', borderRadius: '24px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 flex-between border-b border-white/5 bg-white/5">
                            <div className="flex-col">
                                <h3 className="text-white font-bold m-0" style={{ fontSize: '1.25rem' }}>{activeCam.name} — FULL STREAM</h3>
                                <span className="text-xs text-primary font-bold tracking-widest uppercase">{activeCam.location} // ONLINE MONITORING</span>
                            </div>
                            <button className="btn btn-outline text-white hover:bg-danger/20 border-white/10" onClick={() => setActiveCam(null)}>X</button>
                        </div>

                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                            <HlsPlayer url={activeCam.stream_url} isActive={true} />
                        </div>

                        <div className="p-6 grid grid-cols-4 gap-4 bg-white/5">
                            {[
                                { l: 'Joylashuvi', v: activeCam.location, i: <Maximize2 /> },
                                { l: 'IP Address', v: activeCam.ip_address || 'Noma\'lum', i: <Zap /> },
                                { l: 'Oxirgi Ping', v: activeCam.last_health_check ? new Date(activeCam.last_health_check).toLocaleTimeString() : 'Hali qilinmadi', i: <Settings /> },
                                { l: 'Status', v: activeCam.status || 'online', i: <Activity /> }
                            ].map((s, i) => (
                                <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5">
                                    <span className="text-[10px] text-muted font-bold uppercase block mb-1">{s.l}</span>
                                    <span className="text-white text-sm font-bold">{s.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
