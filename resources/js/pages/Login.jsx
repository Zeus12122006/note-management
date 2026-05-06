import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await axios.get('/sanctum/csrf-cookie');
            await axios.post('/api/login', { email, password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message === 'These credentials do not match our records.' ? 'Mật khẩu chưa chính xác' : (err.response?.data?.message || 'Mật khẩu chưa chính xác'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[400px] z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">NoteApp</h1>
                    <p className="text-zinc-400 text-sm">Chào mừng bạn quay trở lại</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-400">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-xs font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                placeholder="name@example.com"
                                className="w-full px-5 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mật khẩu</label>
                                <Link to="/forgot-password" className="text-[10px] text-blue-400 hover:text-blue-300 transition-all">Quên mật khẩu?</Link>
                            </div>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                className="w-full px-5 py-3.5 bg-zinc-950/50 border border-zinc-800 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 mt-2 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <span>Đăng nhập</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-zinc-500">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-white font-bold hover:underline transition-all">
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
