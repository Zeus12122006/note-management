import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await axios.get('/sanctum/csrf-cookie');
            await axios.post('/api/register', formData);
            setSuccess(true);
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
                <div className="w-full max-w-[400px] text-center bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-10 rounded-3xl shadow-2xl">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-3">Đăng ký thành công!</h2>
                    <p className="text-zinc-400 text-sm mb-6">Tài khoản của bạn đã được tạo thành công.</p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Đang chuyển hướng...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[400px] z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">NoteApp</h1>
                    <p className="text-zinc-400 text-sm">Tạo tài khoản mới</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-400">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-xs font-medium leading-relaxed">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Tên hiển thị</label>
                            <input 
                                type="text" 
                                name="display_name" 
                                onChange={handleChange} 
                                required 
                                placeholder="VD: Admin"
                                className="w-full px-5 py-3 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Email</label>
                            <input 
                                type="email" 
                                name="email" 
                                onChange={handleChange} 
                                required 
                                placeholder="name@example.com"
                                className="w-full px-5 py-3 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Mật khẩu</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="••••••••"
                                    className="w-full px-5 py-3 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Nhập lại</label>
                                <input 
                                    type="password" 
                                    name="password_confirmation" 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="••••••••"
                                    className="w-full px-5 py-3 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <span>Đăng ký</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-zinc-500">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-white font-bold hover:underline transition-all">
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
