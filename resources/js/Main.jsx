import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ToastProvider } from './components/Toast';

export default function Main() {
    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/*" element={<Dashboard />} />
                </Routes>
            </div>
        </ToastProvider>
    );
}

