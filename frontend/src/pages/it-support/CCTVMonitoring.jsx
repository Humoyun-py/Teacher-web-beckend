import React, { useState, useEffect, useRef } from 'react';
import { Camera, Maximize2, RefreshCw, Shield, Layout, Radio, AlertCircle, Eye, EyeOff, Zap, Activity, Plus, X, Play, Settings } from 'lucide-react';

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
            {(!url || url.includes('rtsp')) && (
                <div className="absolute inset-0 flex-center flex-col gap-4 bg-black/80">
                    <Zap size={48} className="text-primary animate-pulse" />
                    <p className="font-mono text-xs text-primary">RTSP STREAM PROXY REQUIRED</p>
                    <p className="text-[10px] text-muted max-w-xs text-center">
                        Eslatma: RTSP kameralarni brauzerda ko'rish uchun ularni HLS ga o'girish kerak.
                        (Masalan: MediaMTX orqali)
                    </p>
                </div>
            )}
        </div>
    );
};

export default function CCTVMonitoring() {
    const [activeCam, setActiveCam] = useState(null);
    const [isNightVision, setNightVision] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCam, setNewCam] = useState({ name: '', rtsp: '', zone: 'A Blok' });

    const [cameras, setCameras] = useState([
        { id: 1, name: 'Asosiy Kirish (Lorex)', zone: 'A Blok', status: 'Online', resolution: '4K', type: 'Lorex Intelligence', features: ['AI Motion', 'Night Vision'], streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
        { id: 2, name: 'Koridor 2-qavat', zone: 'B Blok', status: 'Online', resolution: '1080p', type: 'IP Dome', features: ['Standard'], streamUrl: 'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-91d5-4af3-91c9-065a0287ee65.m3u8' },
        { id: 3, name: '9-A Informatika (Lorex)', zone: 'Darslik', status: 'Online', resolution: '1080p', type: 'Lorex Smart', features: ['Face Track'], streamUrl: '' },
        { id: 4, name: 'Oshxona', zone: 'A Blok', status: 'Offline', resolution: '1080p', type: 'Standard', features: [], streamUrl: '' },
        { id: 5, name: 'Sport Zal', zone: 'C Blok', status: 'Online', resolution: '720p', type: 'Generic', features: ['Wide View'], streamUrl: '' },
    ]);

    const handleAddCamera = () => {
        if (!newCam.name || !newCam.rtsp) return alert("Barcha maydonlarni to'ldiring");
        const cam = {
            id: cameras.length + 1,
            name: newCam.name,
            zone: newCam.zone,
            status: 'Online',
            resolution: '1080p',
            type: 'Custom IP',
            features: ['Live View'],
            streamUrl: newCam.rtsp // Hozircha RTSP ni streamUrl ga quyib boramiz
        };
        setCameras([...cameras, cam]);
        setShowAddModal(false);
        setNewCam({ name: '', rtsp: '', zone: 'A Blok' });
    };

    const CameraCard = ({ cam }) => (
        <div
            className="glass-panel overflow-hidden group cursor-pointer"
            style={{
                padding: 0,
                position: 'relative',
                border: cam.status === 'Offline' ? '1px solid rgba(239, 68, 68, 0.3)' : (cam.type.includes('Lorex') ? '1px solid rgba(99, 102, 241, 0.3)' : ''),
                filter: isNightVision && cam.status === 'Online' ? 'sepia(100%) hue-rotate(90deg) brightness(1.2)' : 'none'
            }}
            onClick={() => setActiveCam(cam)}
        >
            <div style={{ position: 'relative', height: '200px', background: '#000', overflow: 'hidden' }}>
                <HlsPlayer url={cam.streamUrl} isActive={cam.status === 'Online'} />

                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '6px', zIndex: 10 }}>
                    <span className="animate-pulse h-2 w-2 rounded-full bg-danger"></span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'white' }}>{cam.status === 'Online' ? 'LIVE' : 'LOST'}</span>
                </div>

                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all flex-center" style={{ zIndex: 20 }}>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
                        <Maximize2 size={24} className="text-white" />
                    </div>
                </div>
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--surface-border)' }} className="flex-between">
                <div>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>{cam.name}</h3>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>{cam.zone} • {cam.resolution}</p>
                </div>
                <div className={`badge ${cam.status === 'Online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                    {cam.status}
                </div>
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
                        <p className="text-muted text-sm">Haqiqiy kameralarni boshqarish va kuzatish markazi</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} /> Yangi Kamera
                        </button>
                        <button className="btn btn-outline" onClick={() => setNightVision(!isNightVision)}>
                            {isNightVision ? <Eye size={18} /> : <EyeOff size={18} />}
                            Night Vision
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map(cam => <CameraCard key={cam.id} cam={cam} />)}
            </div>

            {/* Add Camera Modal */}
            {showAddModal && (
                <div className="modal-overlay flex-center" style={{ backdropFilter: 'blur(10px)' }} onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel p-8 w-full max-w-lg flex-col gap-6 animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="flex-between">
                            <h2 className="heading-3 m-0">Kamerani Sozlash</h2>
                            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Kamera Nomi</label>
                                <input className="input-field" placeholder="Masalan: Darvoza 1" value={newCam.name} onChange={e => setNewCam({ ...newCam, name: e.target.value })} />
                            </div>
                            <div className="flex-col gap-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-widest">Stream URL (HLS/M3U8)</label>
                                <input className="input-field" placeholder="http://ip:port/stream.m3u8" value={newCam.rtsp} onChange={e => setNewCam({ ...newCam, rtsp: e.target.value })} />
                                <p style={{ fontSize: '10px', color: 'var(--primary)' }}>Real ulanish uchun HLS manzilidan foydalaning.</p>
                            </div>
                        </div>
                        <button className="btn btn-primary w-full h-14" onClick={handleAddCamera}>Kamerani Ishga Tushirish</button>
                    </div>
                </div>
            )}

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
                                <span className="text-xs text-primary font-bold tracking-widest uppercase">{activeCam.zone} // ONLINE MONITORING</span>
                            </div>
                            <button className="btn btn-outline text-white hover:bg-danger/20 border-white/10" onClick={() => setActiveCam(null)}>X</button>
                        </div>

                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                            <HlsPlayer url={activeCam.streamUrl} isActive={true} />
                        </div>

                        <div className="p-6 grid grid-cols-4 gap-4 bg-white/5">
                            {[
                                { l: 'Resolution', v: activeCam.resolution, i: <Maximize2 /> },
                                { l: 'Latency', v: 'Low (124ms)', i: <Zap /> },
                                { l: 'Format', v: 'H.264 / HLS', i: <Settings /> },
                                { l: 'Status', v: 'Operational', i: <Activity /> }
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
