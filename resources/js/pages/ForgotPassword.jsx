import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setMessage(''); setLoading(true);
        try {
            const res = await axios.post('/api/forgot-password', { email });
            setSent(true);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="absolute inset-0 overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
            </div>
            <div className="w-full max-w-[400px] z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">NoteApp</h1>
                    <p className="text-zinc-400 text-sm">Đặt lại mật khẩu</p>
                </div>
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </div>
                            <h2 className="text-lg font-bold">Đã gửi email!</h2>
                            <p className="text-zinc-400 text-sm">{message}</p>
                            <p className="text-zinc-500 text-xs">Kiểm tra hộp thư (và thư mục spam) của bạn.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-zinc-400 text-sm mb-6">Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@example.com"
                                        className="w-full px-5 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 outline-none transition-all text-sm" />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50">
                                    {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                                </button>
                            </form>
                        </>
                    )}
                    <div className="mt-6 text-center text-xs text-zinc-500">
                        <Link to="/login" className="text-white font-bold hover:underline">← Quay lại đăng nhập</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
