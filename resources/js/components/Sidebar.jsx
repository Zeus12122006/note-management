import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ labels, selectedLabelId, onSelectLabel, onManageLabels, onDeleteLabel, activeTheme, onToggleTheme, user, onLogout, isOpen, onClose }) {
    const isDark = activeTheme === 'dark';
    const navigate = useNavigate();

    const avatarUrl = user?.avatar ? `/storage/${user.avatar}` : null;
    const initials = (user?.display_name || 'U').charAt(0).toUpperCase();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
            )}

            <div className={`
                fixed md:relative inset-y-0 left-0 z-40 md:z-auto
                w-64 h-full border-r flex flex-col transition-all duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}
            `}>
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-xl font-bold tracking-tight">NoteApp</h1>
                        <div className="flex items-center space-x-1">
                            <button onClick={onToggleTheme}
                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-zinc-800 text-yellow-400' : 'hover:bg-gray-200 text-gray-600'}`}>
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            {/* Close button on mobile */}
                            <button onClick={onClose} className={`p-2 rounded-lg md:hidden transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    <nav className="space-y-1 flex-1 overflow-hidden flex flex-col">
                        <NavItem active={!selectedLabelId || selectedLabelId === 'all'} onClick={() => { onSelectLabel(null); onClose(); }} label="Tất cả ghi chú" isDark={isDark} />
                        <NavItem active={selectedLabelId === 'shared'} onClick={() => { onSelectLabel('shared'); onClose(); }} label="Được chia sẻ" isDark={isDark} />

                        <div className="pt-6 pb-3 px-3">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60">
                                <span>Phân loại</span>
                                <button onClick={onManageLabels} title="Thêm phân loại mới" className="hover:text-blue-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto space-y-1 custom-scrollbar flex-1">
                            {labels.map(label => (
                                <NavItem key={label.id} active={selectedLabelId === label.id}
                                    onClick={() => { onSelectLabel(label.id); onClose(); }}
                                    onDelete={(e) => { e.stopPropagation(); onDeleteLabel(label.id); }}
                                    label={label.name} isDark={isDark} isLabel />
                            ))}
                        </div>
                    </nav>
                </div>

                {/* User section */}
                <div className={`p-4 border-t ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
                    <button onClick={() => { navigate('/profile'); onClose(); }}
                        className={`w-full flex items-center space-x-3 p-2 rounded-xl transition-all mb-3 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold truncate">{user?.display_name}</p>
                            <p className="text-[10px] opacity-50 truncate">{user?.email}</p>
                        </div>
                        <svg className="w-4 h-4 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    {!user?.email_verified_at && (
                        <div className="mb-2 px-2 py-1 bg-yellow-500/10 rounded-lg">
                            <p className="text-[10px] text-yellow-500 font-medium">⚠ Email chưa xác thực</p>
                        </div>
                    )}
                    <button onClick={onLogout} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                        Đăng xuất
                    </button>
                </div>
            </div>
        </>
    );
}

function NavItem({ active, onClick, onDelete, label, isDark, isLabel }) {
    return (
        <div className="relative group w-full">
            <button onClick={onClick}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-3 ${
                    active ? 'bg-blue-600 text-white shadow-md'
                           : (isDark ? 'hover:bg-zinc-800 text-gray-300' : 'hover:bg-gray-200 text-gray-700')
                }`}>
                {isLabel && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                <span className={`truncate ${isLabel ? 'pr-8' : ''}`}>{label}</span>
            </button>
            {isLabel && onDelete && (
                <button onClick={onDelete} title="Xóa phân loại"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
                        active ? 'text-white/80 hover:text-white hover:bg-blue-700'
                               : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            )}
        </div>
    );
}
