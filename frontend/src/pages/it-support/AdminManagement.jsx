import React, { useState } from 'react';
import { Shield, UserPlus, Lock, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';

export default function AdminManagement() {
    // Mock admins list
    const [admins, setAdmins] = useState([
        { id: 1, name: 'Qodir Adminov', username: 'admin1', status: 'active', last_login: '2 soat oldin' },
        { id: 2, name: 'Malika Sobirova', username: 'admin_malika', status: 'active', last_login: 'Kecha' },
        { id: 3, name: 'Eshmat Toshmatov', username: 'admin_eshmat', status: 'blocked', last_login: '3 kun oldin' }
    ]);

    return (
        <div className="animate-fade-in flex-col gap-6">
            <div className="flex-between">
                <div>
                    <h1 className="heading-1">Admin Management</h1>
                    <p className="text-muted">Tizim adminlarini boshqarish, huquqlarini belgilash va bloklash</p>
                </div>
                <button className="btn btn-primary gap-2">
                    <UserPlus size={18} /> Yangi Admin Qo'shish
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map(admin => (
                    <div key={admin.id} className="glass-panel p-6 flex-col gap-4">
                        <div className="flex-between">
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Shield size={24} />
                            </div>
                            <span className={`badge badge-${admin.status === 'active' ? 'success' : 'danger'}`}>
                                {admin.status}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{admin.name}</h3>
                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>@{admin.username}</p>
                        </div>

                        <div className="flex-col gap-2 pt-2 border-t border-surface" style={{ borderTop: '1px solid var(--surface-border)' }}>
                            <div className="flex-between text-sm">
                                <span className="text-muted">Oxirgi kirish:</span>
                                <span>{admin.last_login}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="btn btn-outline flex-1 gap-2" style={{ padding: '0.5rem' }}>
                                <Edit size={16} /> Tahrirlash
                            </button>
                            <button className="btn btn-outline flex-1 gap-2" style={{ padding: '0.5rem', color: 'var(--danger)' }}>
                                {admin.status === 'active' ? <Lock size={16} /> : <CheckCircle size={16} />}
                                {admin.status === 'active' ? 'Bloklash' : 'Ochish'}
                            </button>
                            <button className="btn btn-danger" style={{ padding: '0.5rem' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
