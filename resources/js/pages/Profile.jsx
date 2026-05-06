import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user, onUserUpdate, onLogout, isDark }) {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `/storage/${user.avatar}` : null);
    const [avatarFile, setAvatarFile] = useState(null);

    const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [prefForm, setPrefForm] = useState({ font_size: user?.font_size || 'medium', theme: user?.theme || 'light' });

    const [saving, setSaving] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);
    const [savingPref, setSavingPref] = useState(false);
    const [resending, setResending] = useState(false);

    const [msg, setMsg] = useState({ profile: '', pwd: '', pref: '', verify: '' });
    const [err, setErr] = useState({ profile: '', pwd: '', pref: '' });

    const showMsg = (key, text, isErr = false) => {
        if (isErr) setErr(p => ({ ...p, [key]: text }));
        else setMsg(p => ({ ...p, [key]: text }));
        setTimeout(() => {
            setMsg(p => ({ ...p, [key]: '' }));
            setErr(p => ({ ...p, [key]: '' }));
        }, 4000);
    };

    const handleAvatarChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setAvatarFile(f);
        setAvatarPreview(URL.createObjectURL(f));
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // Upload avatar first if changed
            if (avatarFile) {
                const fd = new FormData();
                fd.append('avatar', avatarFile);
                const res = await axios.post('/api/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                onUserUpdate(res.data.user);
                setAvatarFile(null);
            }
            // Update name
            const res = await axios.put('/api/profile', { display_name: displayName });
            onUserUpdate(res.data.user);
            showMsg('profile', '✓ Đã lưu thông tin');
        } catch (e) {
            showMsg('profile', e.response?.data?.message || 'Lỗi khi lưu', true);
        } finally { setSaving(false); }
    };

    const handleChangePwd = async () => {
        setSavingPwd(true);
        try {
            await axios.post('/api/profile/password', pwdForm);
            setPwdForm({ current_password: '', new_password: '', new_password_confirmation: '' });
            showMsg('pwd', '✓ Đổi mật khẩu thành công');
        } catch (e) {
            showMsg('pwd', e.response?.data?.message || 'Mật khẩu không chính xác', true);
        } finally { setSavingPwd(false); }
    };

    const handleSavePref = async () => {
        setSavingPref(true);
        try {
            const res = await axios.put('/api/user/preferences', prefForm);
            onUserUpdate(res.data.user);
            showMsg('pref', '✓ Đã lưu tùy chọn');
        } catch (e) {
            showMsg('pref', 'Lỗi khi lưu tùy chọn', true);
        } finally { setSavingPref(false); }
    };

    const handleResendVerification = async () => {
        setResending(true);
        try {
            await axios.post('/api/email/resend-verification');
            showMsg('verify', '✓ Đã gửi lại email xác thực');
        } catch (e) {
            showMsg('verify', e.response?.data?.message || 'Lỗi khi gửi email', true);
        } finally { setResending(false); }
    };

    const bg = isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900';
    const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200';
    const input = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border-gray-300 text-gray-900';
    const label = isDark ? 'text-zinc-400' : 'text-gray-500';

    const initials = (user?.display_name || 'U').charAt(0).toUpperCase();

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 px-4 py-3 border-b ${isDark ? 'bg-black/80 border-zinc-800' : 'bg-white/80 border-gray-200'} backdrop-blur-md flex items-center space-x-4`}>
                <button onClick={() => navigate('/')} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <h1 className="text-lg font-bold">Tài khoản của tôi</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">

                {/* Email Verification Banner */}
                {!user?.email_verified_at && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="font-semibold text-yellow-500 text-sm">⚠ Email chưa được xác thực</p>
                            <p className="text-xs text-yellow-500/70 mt-0.5">Xác thực email để bảo vệ tài khoản của bạn.</p>
                            {msg.verify && <p className="text-xs text-green-400 mt-1">{msg.verify}</p>}
                        </div>
                        <button onClick={handleResendVerification} disabled={resending}
                            className="px-4 py-2 bg-yellow-500 text-black text-xs font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50 flex-shrink-0">
                            {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                        </button>
                    </div>
                )}
                {user?.email_verified_at && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl">
                        <p className="text-green-400 text-sm font-medium">✓ Email đã được xác thực</p>
                    </div>
                )}

                {/* Profile Info */}
                <div className={`border rounded-2xl p-6 space-y-5 ${card}`}>
                    <h2 className="font-bold text-base">Thông tin cá nhân</h2>

                    {/* Avatar */}
                    <div className="flex items-center space-x-5">
                        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black">
                                    {initials}
                                </div>
                            )}
                            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">{user?.display_name}</p>
                            <p className={`text-sm ${label}`}>{user?.email}</p>
                            <button onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-blue-500 hover:text-blue-400 font-medium">Thay đổi ảnh đại diện</button>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${label}`}>Tên hiển thị</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`} />
                    </div>

                    {/* Email (read only) */}
                    <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${label}`}>Email</label>
                        <input type="email" value={user?.email || ''} readOnly
                            className={`w-full px-4 py-3 border rounded-xl text-sm opacity-60 cursor-not-allowed ${input}`} />
                    </div>

                    {err.profile && <p className="text-red-400 text-xs">{err.profile}</p>}
                    {msg.profile && <p className="text-green-400 text-xs">{msg.profile}</p>}

                    <button onClick={handleSaveProfile} disabled={saving}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50">
                        {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                </div>

                {/* Change Password */}
                <div className={`border rounded-2xl p-6 space-y-4 ${card}`}>
                    <h2 className="font-bold text-base">Đổi mật khẩu</h2>
                    {(['current_password', 'new_password', 'new_password_confirmation']).map((field, i) => (
                        <div key={field} className="space-y-1.5">
                            <label className={`text-[10px] font-bold uppercase tracking-widest ${label}`}>
                                {['Mật khẩu hiện tại', 'Mật khẩu mới', 'Nhập lại mật khẩu mới'][i]}
                            </label>
                            <input type="password" value={pwdForm[field]} onChange={e => setPwdForm({ ...pwdForm, [field]: e.target.value })}
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 border rounded-xl outline-none transition-all text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${input}`} />
                        </div>
                    ))}
                    {err.pwd && <p className="text-red-400 text-xs">{err.pwd}</p>}
                    {msg.pwd && <p className="text-green-400 text-xs">{msg.pwd}</p>}
                    <button onClick={handleChangePwd} disabled={savingPwd}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50">
                        {savingPwd ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                </div>

                {/* User Preferences */}
                <div className={`border rounded-2xl p-6 space-y-4 ${card}`}>
                    <h2 className="font-bold text-base">Tùy chọn giao diện</h2>
                    <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-widest ${label}`}>Cỡ chữ ghi chú</label>
                        <div className="flex gap-2">
                            {[['small', 'Nhỏ'], ['medium', 'Vừa'], ['large', 'Lớn']].map(([v, l]) => (
                                <button key={v} onClick={() => setPrefForm(p => ({ ...p, font_size: v }))}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${prefForm.font_size === v ? 'bg-blue-600 border-blue-600 text-white' : `border-current/20 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                    {err.pref && <p className="text-red-400 text-xs">{err.pref}</p>}
                    {msg.pref && <p className="text-green-400 text-xs">{msg.pref}</p>}
                    <button onClick={handleSavePref} disabled={savingPref}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50">
                        {savingPref ? 'Đang lưu...' : 'Lưu tùy chọn'}
                    </button>
                </div>

                {/* Logout */}
                <button onClick={onLogout} className="w-full py-3 text-red-500 font-bold text-sm border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all">
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}
