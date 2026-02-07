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
    const { showToast } = useToast();

    const loadData = useCallback(async () => {
        try {
            const [catalogRes, subsRes] = await Promise.all([
                portalAPI.getCatalog(),
                portalAPI.getSubscriptions(),
            ]);
            setPlans(catalogRes.plans || []);
            const subs = Array.isArray(subsRes) ? subsRes : subsRes.subscriptions || [];
            setSubscriptions(subs);
            // Auto-expand subscriptions if user has any
            if (subs.length > 0) setShowSubscriptions(true);
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
        if (!razorpayLoaded) {
            showToast('Payment gateway is loading. Please try again.', 'warning');
            return;
        }
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
                theme: { color: '#714B67' },
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
                onLoad={() => setRazorpayLoaded(true)}
            />

            <h1 className="text-2xl font-bold text-gray-900">Plans</h1>

            {/* Plans Grid */}
            {plans.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-400">No plans available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                    {processingPlanId === plan.id ? 'Processing...' : 'Subscribe →'}
                                </span>
                            </div>
                            {plan.description && <p className="text-sm text-gray-500 mb-3">{plan.description}</p>}
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-2xl font-bold text-gray-900">₹{Number(plan.price).toLocaleString('en-IN')}</span>
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
                                        <p className="text-xl font-bold text-gray-900">₹{Number(sub.recurringTotal).toLocaleString('en-IN')}</p>
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
