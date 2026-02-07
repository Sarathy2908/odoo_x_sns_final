'use client';

import { useEffect, useState } from 'react';
import { portalAPI } from '@/lib/api';

export default function PortalPayments() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const res = await portalAPI.getPayments();
            setPayments(Array.isArray(res) ? res : res.payments || []);
        } catch (err) {
            console.error('Failed to load payments:', err);
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

    const totalPaid = payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-gray-400">No payments found</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                                <th className="text-left px-5 py-3">Date</th>
                                <th className="text-left px-5 py-3">Invoice</th>
                                <th className="text-left px-5 py-3">Method</th>
                                <th className="text-left px-5 py-3">Reference</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-right px-5 py-3">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map((pay: any) => (
                                <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 text-gray-900">{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</td>
                                    <td className="px-5 py-3 text-gray-600">{pay.invoice?.invoiceNumber || '—'}</td>
                                    <td className="px-5 py-3 text-gray-600">
                                        <span className="inline-flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            {pay.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{pay.reference || '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            pay.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            pay.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            pay.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>{pay.status}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-medium text-gray-900">₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
