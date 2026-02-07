'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { portalAPI } from '@/lib/api';

export default function PortalSubscriptionDetail() {
    const { id } = useParams();
    const [sub, setSub] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadSubscription();
    }, [id]);

    const loadSubscription = async () => {
        try {
            const res = await portalAPI.getSubscription(id as string);
            setSub(res);
        } catch (err) {
            console.error('Failed to load subscription:', err);
        } finally {
            setLoading(false);
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

    if (!sub) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Subscription not found</p>
                <Link href="/portal/subscriptions" className="text-sm text-blue-600 mt-2 inline-block">← Back to subscriptions</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/portal/subscriptions" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">← Back to subscriptions</Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{sub.subscriptionNumber}</h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(sub.status)}`}>{sub.status}</span>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-3">Subscription Details</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium text-gray-900">{sub.plan?.name || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium text-gray-900">{new Date(sub.startDate).toLocaleDateString('en-IN')}</span></div>
                        {sub.expirationDate && <div className="flex justify-between"><span className="text-gray-500">End Date</span><span className="font-medium text-gray-900">{new Date(sub.expirationDate).toLocaleDateString('en-IN')}</span></div>}
                        {sub.nextInvoiceDate && <div className="flex justify-between"><span className="text-gray-500">Next Invoice</span><span className="font-medium text-gray-900">{new Date(sub.nextInvoiceDate).toLocaleDateString('en-IN')}</span></div>}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-3">Billing</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Recurring Total</span><span className="text-xl font-bold text-gray-900">₹{Number(sub.recurringTotal).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Billing Period</span><span className="font-medium text-gray-900">{sub.plan?.billingPeriod || 'Monthly'}</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-3">Quick Links</p>
                    <div className="space-y-2">
                        {sub.invoices?.length > 0 && (
                            <Link href="/portal/invoices" className="block text-sm text-blue-600 hover:text-blue-700">
                                View Invoices ({sub.invoices.length}) →
                            </Link>
                        )}
                        <Link href="/portal/payments" className="block text-sm text-blue-600 hover:text-blue-700">
                            View Payments →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            {sub.lines?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Line Items</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                                <th className="text-left px-5 py-3">Product</th>
                                <th className="text-right px-5 py-3">Qty</th>
                                <th className="text-right px-5 py-3">Unit Price</th>
                                <th className="text-right px-5 py-3">Discount</th>
                                <th className="text-right px-5 py-3">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sub.lines.map((line: any) => (
                                <tr key={line.id}>
                                    <td className="px-5 py-3 text-gray-900">{line.product?.name || line.description || '—'}</td>
                                    <td className="px-5 py-3 text-right text-gray-600">{line.quantity}</td>
                                    <td className="px-5 py-3 text-right text-gray-600">₹{Number(line.unitPrice).toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-3 text-right text-gray-600">{line.discount || 0}%</td>
                                    <td className="px-5 py-3 text-right font-medium text-gray-900">₹{Number(line.subtotal).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invoices */}
            {sub.invoices?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Invoices</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {sub.invoices.map((inv: any) => (
                            <Link key={inv.id} href={`/portal/invoices/${inv.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                                    <p className="text-xs text-gray-500">Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>{inv.status}</span>
                                    <p className="text-sm font-medium text-gray-900 mt-1">₹{Number(inv.totalAmount).toLocaleString('en-IN')}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* History */}
            {sub.history?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">History</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {sub.history.map((entry: any) => (
                            <div key={entry.id} className="px-5 py-3 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">{entry.action}</p>
                                    {entry.description && <p className="text-xs text-gray-500">{entry.description}</p>}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
