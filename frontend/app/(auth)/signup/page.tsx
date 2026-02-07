'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { authAPI, setToken, setUser } from '@/lib/api';
import PhoneInput from '@/app/components/PhoneInput';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordChecks = useMemo(() => {
        const p = formData.password;
        return {
            length: p.length >= 8,
            uppercase: /[A-Z]/.test(p),
            lowercase: /[a-z]/.test(p),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
        };
    }, [formData.password]);

    const allValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.special;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!allValid) { setError('Password does not meet all requirements'); return; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const { confirmPassword, ...data } = formData;
            const response = await authAPI.signup(data);
            setToken(response.token);
            setUser(response.user);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const CheckIcon = ({ valid }: { valid: boolean }) => (
        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${valid ? 'text-emerald-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            {valid ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
        </svg>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0EEEF] py-8">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-sm text-gray-500 mt-1">Get started with SIDAZ</p>
                </div>
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>}
                        <div>
                            <label className="form-label">Full Name</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="form-label">Email Address</label>
                            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-input" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label className="form-label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                            <PhoneInput value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} placeholder="234 567 890" />
                        </div>
                        <div>
                            <label className="form-label">Password</label>
                            <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="form-input" placeholder="Enter a strong password" />
                            {formData.password.length > 0 && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-1.5">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Password requirements:</p>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon valid={passwordChecks.length} />
                                        <span className={`text-xs ${passwordChecks.length ? 'text-emerald-600' : 'text-gray-500'}`}>At least 8 characters</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon valid={passwordChecks.uppercase} />
                                        <span className={`text-xs ${passwordChecks.uppercase ? 'text-emerald-600' : 'text-gray-500'}`}>Contains uppercase letter (A-Z)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon valid={passwordChecks.lowercase} />
                                        <span className={`text-xs ${passwordChecks.lowercase ? 'text-emerald-600' : 'text-gray-500'}`}>Contains lowercase letter (a-z)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon valid={passwordChecks.special} />
                                        <span className={`text-xs ${passwordChecks.special ? 'text-emerald-600' : 'text-gray-500'}`}>Contains special character (!@#$...)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="form-label">Confirm Password</label>
                            <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="form-input" placeholder="Re-enter password" />
                            {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                            )}
                        </div>
                        <button type="submit" disabled={loading || !allValid} className="btn-primary w-full justify-center">
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                </div>
                <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:text-primary-dark font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
