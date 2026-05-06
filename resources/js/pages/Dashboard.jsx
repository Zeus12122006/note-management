import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Routes, Route } from 'react-router-dom';
import NoteList from '../components/NoteList';
import NoteEditor from '../components/NoteEditor';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import Profile from './Profile';
import { useToast } from '../components/Toast';
import { performSync } from '../services/syncService';
import { getNotes, getLabels, saveLabelOffline, deleteLabelOffline, clearAllOfflineData } from '../services/idbService';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [labels, setLabels] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLabelId, setSelectedLabelId] = useState(null);
    const [activeTheme, setActiveTheme] = useState(localStorage.getItem('theme') || 'light');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobilePanel, setMobilePanel] = useState('list'); // 'list' | 'editor'

    // Modals
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordAction, setPasswordAction] = useState('unlock');
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

    const navigate = useNavigate();
    const toast = useToast();

    const fetchLocalData = async () => {
        const [localNotes, localLabels] = await Promise.all([getNotes(), getLabels()]);
        setNotes(localNotes);
        setLabels(localLabels);
    };

    useEffect(() => {
        const init = async () => {
            try {
                const res = await axios.get('/api/user');
                setUser(res.data);
                await performSync();
                await fetchLocalData();
            } catch (err) {
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);

    const handleLogout = async () => {
        await clearAllOfflineData();
        await axios.post('/api/logout');
        navigate('/login');
    };

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
        if (updatedUser.theme) {
            setActiveTheme(updatedUser.theme);
            localStorage.setItem('theme', updatedUser.theme);
        }
    };

    const handleToggleTheme = () => {
        const newTheme = activeTheme === 'light' ? 'dark' : 'light';
        setActiveTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleAddLabel = async () => {
        if (!newLabelName.trim()) return;
        const newLabel = { id: crypto.randomUUID(), name: newLabelName, updated_at: new Date().toISOString() };
        await saveLabelOffline(newLabel);
        setLabels([...labels, newLabel]);
        setNewLabelName('');
        toast.success(`Đã thêm nhãn "${newLabel.name}"`);
        performSync();
    };

    const handleDeleteLabel = async (id) => {
        const label = labels.find(l => l.id === id);
        setLabels(prev => prev.filter(l => l.id !== id));
        await deleteLabelOffline(id);
        axios.delete(`/api/labels/${id}`).catch(err => console.error(err));
        toast.success(`Đã xóa nhãn "${label?.name}"`);
        performSync();
    };

    const handleDeleteNote = async (noteId) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) setSelectedNote(null);
        const { deleteNoteOffline } = await import('../services/idbService');
        await deleteNoteOffline(noteId);
        axios.delete(`/api/notes/${noteId}`).catch(err => console.error('Lỗi xóa server:', err));
        toast.success('Đã xóa ghi chú');
    };

    const handlePasswordSubmit = async () => {
        try {
            if (passwordAction === 'lock') {
                await axios.post(`/api/notes/${selectedNote.id}/lock`, {
                    password: passwordForm.new,
                    password_confirmation: passwordForm.confirm
                });
            } else if (passwordAction === 'unlock') {
                const res = await axios.post(`/api/notes/${selectedNote.id}/unlock`, {
                    password: passwordForm.current
                });
                if (res.data.can_access) {
                    const updatedNote = { ...selectedNote, lock_password: null, _was_unlocked: true };
                    setSelectedNote(updatedNote);
                }
            }
            setShowPasswordModal(false);
            setPasswordForm({ current: '', new: '', confirm: '' });
            await performSync();
            await fetchLocalData();
        } catch (err) {
            alert(err.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const displayedNotes = useMemo(() => {
        let filtered = notes;
        if (selectedLabelId === 'shared') {
            filtered = notes.filter(n => n.is_shared);
        } else if (selectedLabelId) {
            filtered = notes.filter(n => n.labels?.some(l => l.id === selectedLabelId));
        }
        return filtered.sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
    }, [notes, selectedLabelId]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-[#0f172a]">
            <div className="relative">
                <div className="w-16 h-16 border-[3px] border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        </div>
    );

    return (
        <Routes>
            <Route path="/profile" element={
                <Profile user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} isDark={activeTheme === 'dark'} />
            } />
            <Route path="/*" element={
                <div className={`flex h-screen overflow-hidden transition-all duration-300 ${activeTheme === 'dark' ? 'dark' : ''}`}>
                    <Sidebar
                        labels={labels} selectedLabelId={selectedLabelId}
                        onSelectLabel={setSelectedLabelId}
                        onManageLabels={() => setShowLabelModal(true)}
                        onDeleteLabel={handleDeleteLabel}
                        activeTheme={activeTheme} onToggleTheme={handleToggleTheme}
                        user={user} onLogout={handleLogout}
                        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
                    />

                    <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white dark:bg-black">
                        {/* Mobile top bar */}
                        <div className={`flex items-center px-3 py-2 border-b md:hidden ${activeTheme === 'dark' ? 'bg-black border-zinc-800' : 'bg-white border-gray-200'}`}>
                            <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-lg mr-2 ${activeTheme === 'dark' ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-gray-800'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                            </button>
                            <span className={`font-bold text-sm flex-1 ${activeTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                {mobilePanel === 'editor' && selectedNote ? selectedNote.title || 'Ghi chú mới' : 'NoteApp'}
                            </span>
                            {mobilePanel === 'editor' && (
                                <button onClick={() => { setMobilePanel('list'); setSelectedNote(null); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeTheme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    ← Danh sách
                                </button>
                            )}
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* NoteList: hidden on mobile when viewing editor */}
                            <div className={`${mobilePanel === 'editor' ? 'hidden' : 'flex'} md:flex w-full md:w-[350px] lg:w-[420px] md:flex-shrink-0 border-r dark:border-zinc-800 shadow-2xl z-10 flex-col`}>
                                <NoteList
                                    notes={displayedNotes}
                                    onSelect={(note) => {
                                        if (note.lock_password && !note._was_unlocked) {
                                            setPasswordAction('unlock');
                                            setSelectedNote(note);
                                            setShowPasswordModal(true);
                                        } else {
                                            setSelectedNote(note);
                                            setMobilePanel('editor');
                                        }
                                    }}
                                    selectedNoteId={selectedNote?.id}
                                    onCreateNew={() => {
                                        const newId = crypto.randomUUID();
                                        setSelectedNote({ id: newId, title: '', content: '', updated_at: new Date().toISOString(), attachments: [] });
                                        setMobilePanel('editor');
                                    }}
                                    isDark={activeTheme === 'dark'}
                                    onDelete={handleDeleteNote}
                                    onRefresh={async () => { await performSync(); await fetchLocalData(); }}
                                />
                            </div>

                            {/* NoteEditor: full screen on mobile when panel = editor */}
                            <div className={`${mobilePanel === 'list' ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 flex-col relative dark:bg-[#020617]`}>
                                {selectedNote ? (
                                    <NoteEditor
                                        key={selectedNote.id}
                                        note={selectedNote}
                                        labels={labels}
                                        isDark={activeTheme === 'dark'}
                                        onUpdate={(updatedNote) => {
                                            setNotes(prev => {
                                                const exists = prev.find(n => n.id === updatedNote.id);
                                                if (exists) return prev.map(n => n.id === updatedNote.id ? updatedNote : n);
                                                return [updatedNote, ...prev];
                                            });
                                            setSelectedNote(current => current?.id === updatedNote.id ? updatedNote : current);
                                        }}
                                    />
                                ) : (
                                    <div className="flex-1 flex-col items-center justify-center p-10 text-center animate-in fade-in hidden md:flex">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                                            <svg className="w-12 h-12 text-slate-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-300 dark:text-slate-700">Hãy chọn một ghi chú để bắt đầu</h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                    <Modal isOpen={showLabelModal} onClose={() => setShowLabelModal(false)} title="Quản lý Nhãn">
                        <div className="space-y-6">
                            <div className="flex space-x-3">
                                <input type="text" value={newLabelName} onChange={e => setNewLabelName(e.target.value)} placeholder="Tên nhãn mới..."
                                    className="flex-1 px-4 py-3 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                <button onClick={handleAddLabel} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Thêm</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {labels.map(label => (
                                    <div key={label.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                        <span className="font-semibold text-sm">{label.name}</span>
                                        <button onClick={() => handleDeleteLabel(label.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all p-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Modal>

                    <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Bảo mật ghi chú">
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <p className="text-center text-sm text-slate-500">Mật khẩu để mở khóa ghi chú này.</p>
                            <input type="password" value={passwordForm.current}
                                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                placeholder="••••"
                                className="w-full px-5 py-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 text-center text-2xl font-bold tracking-[0.5em]"
                                autoFocus onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
                            <button onClick={handlePasswordSubmit} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all">
                                Mở khóa
                            </button>
                        </div>
                    </Modal>
                </div>
            } />
        </Routes>
    );
}

