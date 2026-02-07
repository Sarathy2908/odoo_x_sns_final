'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setMessage(''); setLoading(true);
        try {
            await authAPI.requestPasswordReset(email);
            setMessage('Password reset link sent to your email.');
        } catch (err: any) { setError(err.message || 'Failed to send reset link'); } finally { setLoading(false); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            await authAPI.resetPassword(token!, password);
            setMessage('Password reset successful! Redirecting...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) { setError(err.message || 'Failed to reset password'); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0EEEF]">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">{token ? 'Set New Password' : 'Reset Password'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{token ? 'Enter your new password' : 'Enter your email to receive a reset link'}</p>
                </div>
                <div className="card p-6">
                    {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-sm mb-4">{message}</div>}
                    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">{error}</div>}
                    {!token ? (
                        <form onSubmit={handleRequestReset} className="space-y-4">
                            <div>
                                <label className="form-label">Email Address</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="you@example.com" />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Sending...' : 'Send Reset Link'}</button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="form-label">New Password</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" />
                            </div>
                            <div>
                                <label className="form-label">Confirm Password</label>
                                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Resetting...' : 'Reset Password'}</button>
                        </form>
                    )}
                </div>
                <p className="mt-4 text-center text-sm text-gray-500">
                    <Link href="/login" className="text-primary hover:text-primary-dark font-medium">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F0EEEF]">Loading...</div>}><ResetPasswordForm /></Suspense>;
}
