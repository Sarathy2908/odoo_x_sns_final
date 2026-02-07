'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalAPI } from '@/lib/api';

export default function PortalInvoices() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const res = await portalAPI.getInvoices();
            setInvoices(Array.isArray(res) ? res : res.invoices || []);
        } catch (err) {
            console.error('Failed to load invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700';
            case 'SENT': return 'bg-blue-100 text-blue-700';
            case 'OVERDUE': return 'bg-red-100 text-red-700';
            case 'DRAFT': return 'bg-gray-100 text-gray-600';
            case 'CANCELLED': return 'bg-gray-100 text-gray-400';
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

    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const unpaidAmount = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
        .reduce((sum, inv) => sum + Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0), 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Invoices</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Outstanding</p>
                    <p className={`text-2xl font-bold mt-1 ${unpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{unpaidAmount.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {invoices.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                    <p className="text-gray-400">No invoices found</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                                <th className="text-left px-5 py-3">Invoice</th>
                                <th className="text-left px-5 py-3">Due Date</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-right px-5 py-3">Amount</th>
                                <th className="text-right px-5 py-3">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoices.map((inv: any) => {
                                const balance = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
                                const isOverdue = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && new Date(inv.dueDate) < new Date();
                                return (
                                    <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                                        <td className="px-5 py-3">
                                            <Link href={`/portal/invoices/${inv.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                                                {inv.invoiceNumber}
                                            </Link>
                                            {inv.subscription && (
                                                <p className="text-xs text-gray-400">{inv.subscription.subscriptionNumber}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">
                                            {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                                            {isOverdue && <span className="ml-2 text-xs text-red-600 font-medium">OVERDUE</span>}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-medium text-gray-900">
                                            ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                                        </td>
                                        <td className={`px-5 py-3 text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ₹{balance.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
