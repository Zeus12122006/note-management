import React, { useState, useEffect, useRef } from 'react';
import useDebounce from '../hooks/useDebounce';
import { saveNoteOffline } from '../services/idbService';
import { performSync } from '../services/syncService';
import { useToast } from './Toast';
import axios from 'axios';

export default function NoteEditor({ note, onUpdate, isDark, labels = [] }) {
    const toast = useToast();
    const [title, setTitle] = useState(note.title || '');
    const [content, setContent] = useState(note.content || '');
    const [attachments, setAttachments] = useState(note.attachments || []);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [showLabelDropdown, setShowLabelDropdown] = useState(false);
    const fileInputRef = useRef(null);
    const [showPwdMgmtModal, setShowPwdMgmtModal] = useState(false);
    const [pwdMgmtAction, setPwdMgmtAction] = useState('set');
    const [pwdMgmtForm, setPwdMgmtForm] = useState({ current: '', new: '', confirm: '' });
    const [pwdMgmtMsg, setPwdMgmtMsg] = useState('');
    const [pwdMgmtErr, setPwdMgmtErr] = useState('');
    const [pwdMgmtLoading, setPwdMgmtLoading] = useState(false);
    const [isPinned, setIsPinned] = useState(note.is_pinned || false);
    const [pinLoading, setPinLoading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareLoading, setShareLoading] = useState(false);
    const [shareMsg, setShareMsg] = useState('');
    const [shareErr, setShareErr] = useState('');
    const [sharedWith, setSharedWith] = useState(note.shared_with || []);
    const [realtimeIndicator, setRealtimeIndicator] = useState(null); // shows when another user edits
    
    const debouncedTitle = useDebounce(title, 300);
    const debouncedContent = useDebounce(content, 300);
    const [isInitialRender, setIsInitialRender] = useState(true);

    useEffect(() => {
        setTitle(note.title || '');
        setContent(note.content || '');
        setAttachments(note.attachments || []);
        setIsInitialRender(true);
    }, [note.id]);

    // Realtime collaboration: subscribe to note channel
    useEffect(() => {
        if (!note.id || !window.Echo) return;

        const channel = window.Echo.private(`note.${note.id}`);

        channel.listen('.App\\Events\\NoteUpdated', (data) => {
            // Another user updated this note — apply their changes
            if (data.title !== undefined) setTitle(data.title);
            if (data.content !== undefined) setContent(data.content);
            setRealtimeIndicator('Cập nhật từ cộng tác viên...');
            setTimeout(() => setRealtimeIndicator(null), 3000);
            // Keep parent in sync
            onUpdate({ ...note, title: data.title ?? note.title, content: data.content ?? note.content, updated_at: data.updated_at });
        });

        return () => {
            window.Echo.leave(`note.${note.id}`);
        };
    }, [note.id]);

    useEffect(() => {
        if (isInitialRender) { setIsInitialRender(false); return; }
        const save = async () => {
            const updated = { ...note, title: debouncedTitle, content: debouncedContent, updated_at: new Date().toISOString() };
            await saveNoteOffline(updated);
            onUpdate(updated);
            performSync();
        };
        save();
    }, [debouncedTitle, debouncedContent]);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files || files.length === 0) return;

        setUploading(true);
        let newAttachments = [...attachments];

        try {
            // Đảm bảo ghi chú đã tồn tại trên server trước khi upload ảnh
            await axios.post('/api/notes', {
                id: note.id,
                title: title,
                content: content
            });

            // Upload từng ảnh một
            for (const file of files) {
                const formData = new FormData();
                formData.append('image', file);

                const res = await axios.post(`/api/notes/${note.id}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newAttachments.push(res.data.attachment);
            }

            setAttachments(newAttachments);
            const updatedNote = { ...note, attachments: newAttachments };
            onUpdate(updatedNote);
            await saveNoteOffline(updatedNote);
            
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (err) { 
            console.error(err);
            alert('Lỗi tải ảnh: ' + (err.response?.data?.message || err.message || 'Hãy thử gõ một vài chữ vào ghi chú trước.')); 
        } finally { 
            setUploading(false); 
            e.target.value = '';
        }
    };

    const handleToggleLabel = async (label) => {
        const hasLabel = note.labels?.some(l => l.id === label.id);
        let newLabels = [];
        if (hasLabel) {
            newLabels = (note.labels || []).filter(l => l.id !== label.id);
        } else {
            newLabels = [...(note.labels || []), label];
        }
        
        const updatedNote = { ...note, labels: newLabels, updated_at: new Date().toISOString() };
        onUpdate(updatedNote);
        await saveNoteOffline(updatedNote);
        
        try {
            await axios.post(`/api/notes/${note.id}/labels`, { label_id: label.id });
        } catch (err) {
            console.error('Lỗi gắn nhãn:', err);
        }
    };

    const handleNotePwdSubmit = async () => {
        setPwdMgmtErr('');
        setPwdMgmtMsg('');
        setPwdMgmtLoading(true);
        try {
            if (pwdMgmtAction === 'set') {
                if (pwdMgmtForm.new !== pwdMgmtForm.confirm) {
                    setPwdMgmtErr('Mật khẩu nhập lại không khớp');
                    setPwdMgmtLoading(false);
                    return;
                }
                await axios.post(`/api/notes/${note.id}/lock`, {
                    password: pwdMgmtForm.new,
                    password_confirmation: pwdMgmtForm.confirm
                });
                const updatedNote = { ...note, lock_password: '__locked__' };
                onUpdate(updatedNote);
                setPwdMgmtMsg('✓ Đã đặt mật khẩu thành công');
            } else if (pwdMgmtAction === 'change') {
                if (pwdMgmtForm.new !== pwdMgmtForm.confirm) {
                    setPwdMgmtErr('Mật khẩu nhập lại không khớp');
                    setPwdMgmtLoading(false);
                    return;
                }
                await axios.put(`/api/notes/${note.id}/password`, {
                    current_password: pwdMgmtForm.current,
                    new_password: pwdMgmtForm.new,
                    new_password_confirmation: pwdMgmtForm.confirm
                });
                setPwdMgmtMsg('✓ Đã đổi mật khẩu thành công');
            } else if (pwdMgmtAction === 'remove') {
                await axios.post(`/api/notes/${note.id}/unlock`, {
                    password: pwdMgmtForm.current,
                    disable: true
                });
                const updatedNote = { ...note, lock_password: null, _was_unlocked: false };
                onUpdate(updatedNote);
                setPwdMgmtMsg('✓ Đã gỡ bỏ mật khẩu');
            }
            setPwdMgmtForm({ current: '', new: '', confirm: '' });
            setTimeout(() => { setPwdMgmtMsg(''); setShowPwdMgmtModal(false); }, 1500);
        } catch (e) {
            setPwdMgmtErr(e.response?.data?.message || e.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setPwdMgmtLoading(false);
        }
    };

    const openPwdModal = (action) => {
        setPwdMgmtAction(action);
        setPwdMgmtForm({ current: '', new: '', confirm: '' });
        setPwdMgmtErr('');
        setPwdMgmtMsg('');
        setShowPwdMgmtModal(true);
    };

    const handleTogglePin = async () => {
        if (pinLoading || !note.id) return;
        setPinLoading(true);
        try {
            await axios.post(`/api/notes/${note.id}/pin`);
            const newPinned = !isPinned;
            setIsPinned(newPinned);
            onUpdate({ ...note, is_pinned: newPinned });
            toast.success(newPinned ? 'Đã ghim ghi chú lên đầu' : 'Đã bỏ ghim');
        } catch (e) {
            toast.error('Không thể ghím ghi chú');
        } finally {
            setPinLoading(false);
        }
    };

    const handleShare = async () => {
        if (!shareEmail.trim()) return;
        setShareLoading(true); setShareErr(''); setShareMsg('');
        try {
            const res = await axios.post(`/api/notes/${note.id}/share`, { email: shareEmail });
            setShareMsg(`✓ Đã chia sẻ với ${shareEmail}`);
            setSharedWith(res.data.shared_with || [...sharedWith, { email: shareEmail }]);
            setShareEmail('');
            toast.success(`Đã chia sẻ với ${shareEmail}`);
        } catch (e) {
            const errMsg = e.response?.data?.message || e.response?.data?.error || 'Không tìm thấy người dùng với email này';
            setShareErr(errMsg);
            toast.error(errMsg);
        } finally {
            setShareLoading(false);
        }
    };

    const handleRevokeShare = async (email) => {
        try {
            await axios.delete(`/api/notes/${note.id}/share`, { data: { email } });
            setSharedWith(prev => prev.filter(u => u.email !== email));
        } catch (e) {
            console.error('Revoke error:', e);
        }
    };

    return (
        <div className={`flex flex-col h-full min-w-0 ${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
            {/* Password Management Modal */}
            {showPwdMgmtModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base">
                                {pwdMgmtAction === 'set' ? '🔒 Đặt mật khẩu ghi chú'
                                 : pwdMgmtAction === 'change' ? '🔑 Đổi mật khẩu ghi chú'
                                 : '🔓 Gỡ bỏ mật khẩu'}
                            </h3>
                            <button onClick={() => setShowPwdMgmtModal(false)} className="opacity-50 hover:opacity-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        {pwdMgmtErr && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">{pwdMgmtErr}</p>}
                        {pwdMgmtMsg && <p className="text-green-400 text-xs bg-green-500/10 p-2 rounded-lg">{pwdMgmtMsg}</p>}
                        <div className="space-y-3">
                            {(pwdMgmtAction === 'change' || pwdMgmtAction === 'remove') && (
                                <input type="password" placeholder="Mật khẩu hiện tại" value={pwdMgmtForm.current}
                                    onChange={e => setPwdMgmtForm(p => ({ ...p, current: e.target.value }))}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} />
                            )}
                            {(pwdMgmtAction === 'set' || pwdMgmtAction === 'change') && (<>
                                <input type="password" placeholder="Mật khẩu mới" value={pwdMgmtForm.new}
                                    onChange={e => setPwdMgmtForm(p => ({ ...p, new: e.target.value }))}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} />
                                <input type="password" placeholder="Nhập lại mật khẩu mới" value={pwdMgmtForm.confirm}
                                    onChange={e => setPwdMgmtForm(p => ({ ...p, confirm: e.target.value }))}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-300'}`} />
                            </>)}
                        </div>
                        <button onClick={handleNotePwdSubmit} disabled={pwdMgmtLoading}
                            className={`w-full py-3 font-bold rounded-xl transition-all disabled:opacity-50 ${pwdMgmtAction === 'remove' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                            {pwdMgmtLoading ? 'Đang xử lý...' : (pwdMgmtAction === 'remove' ? 'Gỡ bỏ mật khẩu' : 'Xác nhận')}
                        </button>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base">🔗 Chia sẻ ghi chú</h3>
                            <button onClick={() => { setShowShareModal(false); setShareMsg(''); setShareErr(''); }} className="opacity-50 hover:opacity-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        {shareErr && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">{shareErr}</p>}
                        {shareMsg && <p className="text-green-400 text-xs bg-green-500/10 p-2 rounded-lg">{shareMsg}</p>}
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email người dùng..." value={shareEmail}
                                onChange={e => setShareEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleShare()}
                                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border-gray-300'}`} />
                            <button onClick={handleShare} disabled={shareLoading}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                                {shareLoading ? '...' : 'Chia sẻ'}
                            </button>
                        </div>
                        {sharedWith.length > 0 && (
                            <div className="space-y-2">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Đang chia sẻ với</p>
                                {sharedWith.map((u, i) => (
                                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                                        <span className="text-sm truncate">{u.email || u.name}</span>
                                        <button onClick={() => handleRevokeShare(u.email)} title="Thu hồi quyền truy cập"
                                            className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={`p-4 md:p-6 border-b flex justify-between items-center gap-3 ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề..."
                    className="text-xl md:text-2xl font-bold bg-transparent outline-none flex-1 min-w-0 mr-2" />
                <div className="flex items-center space-x-1 flex-shrink-0">
                    {realtimeIndicator && (
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full animate-pulse hidden sm:flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
                            {realtimeIndicator}
                        </span>
                    )}
                    {uploadSuccess && <span className="text-[10px] font-bold text-green-500 animate-pulse hidden sm:block">✓ ĐÃ LƯU</span>}

                    {/* Pin button */}
                    <button type="button" title={isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                        onClick={handleTogglePin} disabled={pinLoading}
                        className={`p-2 rounded-lg transition-all ${isPinned ? 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20' : (isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100')}`}>
                        <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                        </svg>
                    </button>

                    {/* Share button - chỉ hiện khi note đã được lưu trên server */}
                    {note.id && (
                        <button type="button" title="Chia sẻ ghi chú"
                            onClick={() => setShowShareModal(true)}
                            className={`p-2 rounded-lg transition-all ${sharedWith.length > 0 ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20' : (isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100')}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                            </svg>
                        </button>
                    )}

                    {/* Lock button */}
                    <button type="button" title="Quản lý mật khẩu"

                        onClick={() => openPwdModal(note.lock_password ? 'change' : 'set')}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${note.lock_password ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20' : (isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100')}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {note.lock_password
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>}
                        </svg>
                    </button>
                    {note.lock_password && (
                        <button type="button" title="Gỡ bỏ mật khẩu" onClick={() => openPwdModal('remove')}
                            className="p-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                        </button>
                    )}
                    
                    {/* Label Dropdown */}
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-2 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            <span>Gắn nhãn</span>
                        </button>
                        
                        {showLabelDropdown && (
                            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
                                {labels.length === 0 ? (
                                    <div className="p-4 text-xs text-center text-gray-500">Chưa có nhãn nào. Hãy tạo nhãn ở cột bên trái trước.</div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {labels.map(label => {
                                            const isSelected = note.labels?.some(l => l.id === label.id);
                                            return (
                                                <button 
                                                    key={label.id}
                                                    onClick={() => handleToggleLabel(label)}
                                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${isSelected ? 'text-blue-600 font-bold' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                                                >
                                                    <span className="truncate pr-2">{label.name}</span>
                                                    {isSelected && <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {uploading ? (
                            <div className="flex items-center space-x-2">
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Đang lưu...</span>
                            </div>
                        ) : 'Thêm ảnh'}
                    </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
            </div>

            {/* Label Tags Display */}
            {note.labels && note.labels.length > 0 && (
                <div className={`px-6 py-3 border-b flex flex-wrap gap-2 ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-gray-50 bg-gray-50/50'}`}>
                    {note.labels.map(l => (
                        <span key={l.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${isDark ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-white border border-gray-200 text-gray-700 shadow-sm'}`}>
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            <span>{l.name}</span>
                            <button onClick={() => handleToggleLabel(l)} className="ml-1 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" onClick={() => setShowLabelDropdown(false)}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Viết nội dung ghi chú tại đây..."
                    className={`w-full min-h-[300px] bg-transparent outline-none resize-none text-base leading-relaxed ${isDark ? 'placeholder-zinc-800' : 'placeholder-gray-300'}`}
                />
                
                {attachments.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-dashed border-gray-200 dark:border-zinc-800">
                        {attachments.map(att => (
                            <div key={att.id} className="relative w-40 h-40 rounded-xl overflow-hidden group border-2 border-white dark:border-zinc-700 shadow-md">
                                <img src={`/storage/${att.path}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-3 transition-all duration-300">
                                    <button 
                                        type="button"
                                        title="Tải ảnh xuống"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const link = document.createElement('a');
                                            link.href = `/storage/${att.path}`;
                                            link.download = `image-${att.id}.jpg`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }} 
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-transform hover:scale-110"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </button>

                                    <button 
                                        type="button"
                                        title="Xóa ảnh"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            axios.delete(`/api/attachments/${att.id}`).then(() => {
                                                const updated = attachments.filter(a => a.id !== att.id);
                                                setAttachments(updated);
                                                const updatedNote = { ...note, attachments: updated };
                                                onUpdate(updatedNote);
                                                saveNoteOffline(updatedNote);
                                            }).catch(err => {
                                                alert('Lỗi xóa ảnh: ' + (err.response?.data?.message || err.message));
                                            });
                                        }} 
                                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-transform hover:scale-110"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
