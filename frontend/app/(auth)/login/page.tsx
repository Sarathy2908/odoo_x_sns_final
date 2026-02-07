'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { authAPI, setToken, setUser } from '@/lib/api';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (role === 'admin') {
            setFormData({ email: 'admin@sidaz.com', password: 'admin@12345' });
        } else {
            setFormData({ email: '', password: '' });
        }
    }, [role]);

    const getRoleLabel = () => {
        switch (role) {
            case 'admin': return 'Sign in as Admin';
            case 'internal': return 'Sign in as Internal User';
            case 'portal': return 'Sign in as User';
            default: return 'Sign in to SIDAZ';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authAPI.login(formData);
            setToken(response.token);
            setUser(response.user);
            if (response.user.role === 'PORTAL_USER') {
                router.push('/portal/catalog');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0EEEF]">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-sm text-gray-500 mt-1">{getRoleLabel()}</p>
                </div>
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
                        <div>
                            <label className="form-label">Email Address</label>
                            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-input" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label className="form-label">Password</label>
                            <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="form-input" placeholder="Enter your password" />
                        </div>
                        <div className="flex items-center justify-end">
                            <Link href="/reset-password" className="text-sm text-primary hover:text-primary-dark">Forgot password?</Link>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <div className="mt-4 space-y-2 text-center">
                    {role === 'portal' && (
                        <p className="text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-primary hover:text-primary-dark font-medium">Sign up</Link>
                        </p>
                    )}
                    <p>
                        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
                            &larr; Back to role selection
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F0EEEF]">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
