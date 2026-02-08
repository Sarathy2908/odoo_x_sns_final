'use client';

import { useEffect, useState, useCallback } from 'react';
import { portalAPI, razorpayAPI, getUser } from '@/lib/api';
import { useToast } from '@/app/components/Toast';
import Link from 'next/link';
import Script from 'next/script';

export default function PortalPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSubscriptions, setShowSubscriptions] = useState(false);
    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [addressMissing, setAddressMissing] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const { showToast } = useToast();

    // Check if Razorpay is already available (e.g. cached by browser)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            setRazorpayLoaded(true);
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [catalogRes, subsRes, profileRes] = await Promise.all([
                portalAPI.getCatalog(),
                portalAPI.getSubscriptions(),
                portalAPI.getProfile(),
            ]);
            setPlans(catalogRes.plans || []);
            const subs = Array.isArray(subsRes) ? subsRes : subsRes.subscriptions || [];
            setSubscriptions(subs);
            if (subs.length > 0) setShowSubscriptions(true);
            setAddressMissing(!profileRes.hasAddress);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubscribe = async (plan: any) => {
        // Check address first — block if missing
        if (addressMissing) {
            setShowAddressModal(true);
            return;
        }

        // Check both state and window object directly
        const isRazorpayReady = razorpayLoaded || (typeof window !== 'undefined' && !!window.Razorpay);
        if (!isRazorpayReady) {
            showToast('Payment gateway is loading. Please try again.', 'warning');
            return;
        }
        if (!razorpayLoaded) setRazorpayLoaded(true);
        if (processingPlanId) return;

        setProcessingPlanId(plan.id);

        try {
            // Create subscription + Razorpay order
            const orderData = await portalAPI.subscribe(plan.id);
            const user = getUser();

            const options: RazorpayOptions = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'SIDAZ',
                description: `${orderData.planName} Plan`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        await razorpayAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        // Reload data to show new active subscription
                        setShowSubscriptions(true);
                        await loadData();
                        showToast('Payment successful! Your subscription is now active.', 'success');
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                        showToast('Payment verification failed. Please contact support.', 'error');
                    } finally {
                        setProcessingPlanId(null);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                theme: { color: '#663399' },
                modal: {
                    ondismiss: () => {
                        setProcessingPlanId(null);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                showToast('Payment failed. Please try again.', 'error');
                setProcessingPlanId(null);
            });
            rzp.open();
        } catch (err: any) {
            console.error('Subscribe error:', err);
            showToast(err.message || 'Failed to initiate payment. Please try again.', 'error');
            setProcessingPlanId(null);
        }
    };

    const billingLabel = (period: string) => {
        switch (period) {
            case 'DAILY': return '/day';
            case 'WEEKLY': return '/week';
            case 'MONTHLY': return '/month';
            case 'YEARLY': return '/year';
            default: return '';
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="afterInteractive"
                onLoad={() => setRazorpayLoaded(true)}
                onReady={() => setRazorpayLoaded(true)}
            />

            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Plans</h1>

            {/* Address Missing Banner */}
            {addressMissing && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-amber-800">Address required for subscriptions</p>
                        <p className="text-xs text-amber-600 mt-1">
                            Please complete your address in your{' '}
                            <Link href="/portal/profile" className="underline font-medium hover:text-amber-800">profile page</Link>
                            {' '}before subscribing to a plan.
                        </p>
                    </div>
                </div>
            )}

            {/* Address Required Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Address Required</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            You need to add your address before subscribing to a plan. Please complete your address details in your profile page and then come back to subscribe.
                        </p>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/portal/profile"
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                            >
                                Go to Profile
                            </Link>
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            {plans.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-400">No plans available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan: any) => (
                        <button
                            key={plan.id}
                            onClick={() => handleSubscribe(plan)}
                            disabled={processingPlanId === plan.id}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary/30 transition-all text-left cursor-pointer group disabled:opacity-60 disabled:cursor-wait"
                        >
                            <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    {processingPlanId === plan.id ? 'Processing...' : 'Subscribe \u2192'}
                                </span>
                            </div>
                            {plan.description && <p className="text-sm text-gray-500 mb-3">{plan.description}</p>}
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-2xl font-bold text-gray-900">{'\u20B9'}{Number(plan.price).toLocaleString('en-IN')}</span>
                                <span className="text-sm text-gray-500">{billingLabel(plan.billingPeriod)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{plan.billingPeriod}</span>
                                {plan.renewable && <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">Renewable</span>}
                                {plan.pausable && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">Pausable</span>}
                                {plan.closable && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Closable</span>}
                            </div>
                            {(plan.startDate || plan.endDate) && (
                                <div className="mt-3 text-xs text-gray-500">
                                    {plan.startDate && <span>From: {new Date(plan.startDate).toLocaleDateString('en-IN')}</span>}
                                    {plan.startDate && plan.endDate && <span className="mx-1">|</span>}
                                    {plan.endDate && <span>To: {new Date(plan.endDate).toLocaleDateString('en-IN')}</span>}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* My Subscriptions Section */}
            <div className="pt-2">
                <button
                    onClick={() => setShowSubscriptions(!showSubscriptions)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <svg className={`w-4 h-4 transition-transform ${showSubscriptions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    My Subscriptions ({subscriptions.length})
                </button>
            </div>

            {showSubscriptions && (
                subscriptions.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-400">No subscriptions yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Click on a plan above to subscribe.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subscriptions.map((sub: any) => (
                            <Link key={sub.id} href={`/portal/subscriptions/${sub.id}`}
                                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-gray-900">{sub.subscriptionNumber}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{sub.plan?.name || 'Custom plan'}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span>Start: {new Date(sub.startDate).toLocaleDateString('en-IN')}</span>
                                            {sub.expirationDate && <span>End: {new Date(sub.expirationDate).toLocaleDateString('en-IN')}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">{'\u20B9'}{Number(sub.recurringTotal).toLocaleString('en-IN')}</p>
                                        <p className="text-sm text-gray-500">/{sub.plan?.billingPeriod?.toLowerCase() || 'month'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
