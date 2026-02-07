'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalAPI } from '@/lib/api';

export default function PortalDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await portalAPI.getDashboard();
            setData(res);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-20 text-gray-500">Failed to load dashboard data.</div>;
    }

    const stats = [
        { label: 'Active Subscriptions', value: data.stats.activeSubscriptions, color: 'bg-green-50 text-green-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { label: 'Total Invoices', value: data.stats.totalInvoices, color: 'bg-blue-50 text-blue-700', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
        { label: 'Unpaid Invoices', value: data.stats.unpaidInvoices, color: 'bg-amber-50 text-amber-700', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Total Paid', value: `₹${Number(data.stats.totalPaid).toLocaleString('en-IN')}`, color: 'bg-purple-50 text-purple-700', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className={`${stat.color} rounded-xl p-5`}>
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                            </svg>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm opacity-80">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Subscriptions */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Recent Subscriptions</h2>
                    <Link href="/portal/subscriptions" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {data.recentSubscriptions?.length > 0 ? data.recentSubscriptions.map((sub: any) => (
                        <Link key={sub.id} href={`/portal/subscriptions/${sub.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="font-medium text-gray-900">{sub.subscriptionNumber}</p>
                                <p className="text-sm text-gray-500">{sub.plan?.name || 'No plan'}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    sub.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                    sub.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' :
                                    'bg-amber-100 text-amber-700'
                                }`}>{sub.status}</span>
                                <p className="text-sm text-gray-500 mt-1">₹{Number(sub.recurringTotal).toLocaleString('en-IN')}/mo</p>
                            </div>
                        </Link>
                    )) : (
                        <p className="px-5 py-8 text-center text-gray-400">No subscriptions yet</p>
                    )}
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
                    <Link href="/portal/invoices" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {data.recentInvoices?.length > 0 ? data.recentInvoices.map((inv: any) => (
                        <Link key={inv.id} href={`/portal/invoices/${inv.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                                <p className="text-sm text-gray-500">Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                    inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                    inv.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>{inv.status}</span>
                                <p className="text-sm font-medium text-gray-900 mt-1">₹{Number(inv.totalAmount).toLocaleString('en-IN')}</p>
                            </div>
                        </Link>
                    )) : (
                        <p className="px-5 py-8 text-center text-gray-400">No invoices yet</p>
                    )}
                </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Recent Payments</h2>
                    <Link href="/portal/payments" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {data.recentPayments?.length > 0 ? data.recentPayments.map((pay: any) => (
                        <div key={pay.id} className="flex items-center justify-between px-5 py-3">
                            <div>
                                <p className="font-medium text-gray-900">₹{Number(pay.amount).toLocaleString('en-IN')}</p>
                                <p className="text-sm text-gray-500">{pay.paymentMethod} • {new Date(pay.paymentDate).toLocaleDateString('en-IN')}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                pay.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                pay.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                            }`}>{pay.status}</span>
                        </div>
                    )) : (
                        <p className="px-5 py-8 text-center text-gray-400">No payments yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
