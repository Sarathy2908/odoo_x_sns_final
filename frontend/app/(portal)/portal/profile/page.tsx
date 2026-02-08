'use client';

import { useEffect, useState } from 'react';
import { portalAPI } from '@/lib/api';
import PhoneInput from '@/app/components/PhoneInput';

export default function PortalProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', companyName: '',
        street: '', street2: '', city: '', state: '', country: '', postalCode: '',
    });
    const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, subsRes] = await Promise.all([
                portalAPI.getProfile(),
                portalAPI.getSubscriptions(),
            ]);
            setProfile(profileRes);
            setForm({
                name: profileRes.name || '',
                email: profileRes.email || '',
                phone: profileRes.phone || '',
                companyName: profileRes.companyName || '',
                street: profileRes.street || '',
                street2: profileRes.street2 || '',
                city: profileRes.city || '',
                state: profileRes.state || '',
                country: profileRes.country || '',
                postalCode: profileRes.postalCode || '',
            });
            setSubscriptions(Array.isArray(subsRes) ? subsRes : subsRes.subscriptions || []);
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await portalAPI.updateProfile(form);
            setProfile(res);
            setEditing(false);
            setToast({ type: 'success', message: 'Profile updated successfully!' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to update profile.' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
            case 'QUOTATION': return 'bg-amber-100 text-amber-700';
            case 'DRAFT': return 'bg-gray-100 text-gray-600';
            case 'CLOSED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const hasAddress = profile?.street && profile?.city && profile?.state && profile?.country && profile?.postalCode;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Profile</h1>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`px-4 py-3 rounded-lg text-sm ${
                    toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>{toast.message}</div>
            )}

            {/* Address Missing Warning */}
            {!hasAddress && !editing && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-amber-800">Address required for subscriptions</p>
                        <p className="text-xs text-amber-600 mt-1">Please complete your address details to subscribe to plans. Click &quot;Edit Profile&quot; to add your address.</p>
                    </div>
                </div>
            )}

            {/* User Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                        {(profile?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{profile?.name}</h2>
                        <p className="text-sm text-gray-500">{profile?.role === 'PORTAL_USER' ? 'Customer' : profile?.role}</p>
                    </div>
                </div>

                {editing ? (
                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <PhoneInput
                                    value={form.phone}
                                    onChange={(val) => setForm({ ...form, phone: val })}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <input
                                    type="text"
                                    value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Enter company name"
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Address Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.street}
                                        onChange={(e) => setForm({ ...form, street: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Street address, P.O. box"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2</label>
                                    <input
                                        type="text"
                                        value={form.street2}
                                        onChange={(e) => setForm({ ...form, street2: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Apartment, suite, unit, building, floor, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="State / Province"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.postalCode}
                                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="ZIP / Postal code"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    setForm({
                                        name: profile?.name || '',
                                        email: profile?.email || '',
                                        phone: profile?.phone || '',
                                        companyName: profile?.companyName || '',
                                        street: profile?.street || '',
                                        street2: profile?.street2 || '',
                                        city: profile?.city || '',
                                        state: profile?.state || '',
                                        country: profile?.country || '',
                                        postalCode: profile?.postalCode || '',
                                    });
                                }}
                                className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase">Full Name</p>
                                <p className="text-sm text-gray-900 mt-1">{profile?.name || '\u2014'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase">Email</p>
                                <p className="text-sm text-gray-900 mt-1">{profile?.email || '\u2014'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase">Phone</p>
                                <p className="text-sm text-gray-900 mt-1">{profile?.phone || '\u2014'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase">Company</p>
                                <p className="text-sm text-gray-900 mt-1">{profile?.companyName || '\u2014'}</p>
                            </div>
                        </div>

                        {/* Address Display */}
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Address</p>
                            {hasAddress ? (
                                <div className="text-sm text-gray-900 space-y-0.5">
                                    <p>{profile.street}{profile.street2 ? `, ${profile.street2}` : ''}</p>
                                    <p>{profile.city}, {profile.state} {profile.postalCode}</p>
                                    <p>{profile.country}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No address on file</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Role</p>
                                    <p className="text-sm text-gray-900 mt-1">{profile?.role === 'PORTAL_USER' ? 'Customer' : profile?.role}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase">Member Since</p>
                                    <p className="text-sm text-gray-900 mt-1">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '\u2014'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Current Subscriptions Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Subscriptions</h2>
                {subscriptions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm text-gray-400">No active subscriptions</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subscriptions.map((sub: any) => (
                            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-medium text-gray-900 text-sm">{sub.subscriptionNumber}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{sub.plan?.name || 'Custom plan'}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                            <span>Start: {new Date(sub.startDate).toLocaleDateString('en-IN')}</span>
                                            {sub.expirationDate && <span>Exp: {new Date(sub.expirationDate).toLocaleDateString('en-IN')}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">{'\u20B9'}{Number(sub.recurringTotal).toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-gray-500">/{sub.plan?.billingPeriod?.toLowerCase() || 'month'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
