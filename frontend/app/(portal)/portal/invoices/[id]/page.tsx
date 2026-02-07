'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { portalAPI } from '@/lib/api';

export default function PortalInvoiceDetail() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        try {
            const res = await portalAPI.getInvoice(id as string);
            setInvoice(res);
        } catch (err) {
            console.error('Failed to load invoice:', err);
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

    if (!invoice) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Invoice not found</p>
                <Link href="/portal/invoices" className="text-sm text-blue-600 mt-2 inline-block">← Back to invoices</Link>
            </div>
        );
    }

    const balance = Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0);
    const isOverdue = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && new Date(invoice.dueDate) < new Date();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/portal/invoices" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">← Back to invoices</Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'OVERDUE' || isOverdue ? 'bg-red-100 text-red-700' :
                        invoice.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>{isOverdue && invoice.status !== 'PAID' ? 'OVERDUE' : invoice.status}</span>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-3">Invoice Details</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Invoice Date</span><span className="font-medium text-gray-900">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span></div>
                        {invoice.subscription && (
                            <div className="flex justify-between"><span className="text-gray-500">Subscription</span><span className="font-medium text-gray-900">{invoice.subscription.subscriptionNumber}</span></div>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-3">Amounts</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-900">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-medium text-gray-900">₹{Number(invoice.taxAmount || 0).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-700 font-medium">Total</span><span className="text-lg font-bold text-gray-900">₹{Number(invoice.totalAmount).toLocaleString('en-IN')}</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-3">Payment Status</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="font-medium text-green-600">₹{Number(invoice.paidAmount || 0).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between border-t border-gray-100 pt-2">
                            <span className="text-gray-700 font-medium">Balance Due</span>
                            <span className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{balance.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            {invoice.lines?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Line Items</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                                <th className="text-left px-5 py-3">Description</th>
                                <th className="text-right px-5 py-3">Qty</th>
                                <th className="text-right px-5 py-3">Unit Price</th>
                                <th className="text-right px-5 py-3">Discount</th>
                                <th className="text-right px-5 py-3">Tax</th>
                                <th className="text-right px-5 py-3">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoice.lines.map((line: any) => (
                                <tr key={line.id}>
                                    <td className="px-5 py-3 text-gray-900">{line.product?.name || line.description || '—'}</td>
                                    <td className="px-5 py-3 text-right text-gray-600">{line.quantity}</td>
                                    <td className="px-5 py-3 text-right text-gray-600">₹{Number(line.unitPrice).toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-3 text-right text-gray-600">{line.discount || 0}%</td>
                                    <td className="px-5 py-3 text-right text-gray-600">₹{Number(line.taxAmount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-3 text-right font-medium text-gray-900">₹{Number(line.amount).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-gray-200">
                            <tr>
                                <td colSpan={5} className="px-5 py-3 text-right font-medium text-gray-700">Subtotal</td>
                                <td className="px-5 py-3 text-right font-medium text-gray-900">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td colSpan={5} className="px-5 py-2 text-right text-gray-500">Tax</td>
                                <td className="px-5 py-2 text-right text-gray-600">₹{Number(invoice.taxAmount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td colSpan={5} className="px-5 py-3 text-right font-bold text-gray-900">Total</td>
                                <td className="px-5 py-3 text-right text-lg font-bold text-gray-900">₹{Number(invoice.totalAmount).toLocaleString('en-IN')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Payment History */}
            {invoice.payments?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Payment History</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                                <th className="text-left px-5 py-3">Date</th>
                                <th className="text-left px-5 py-3">Method</th>
                                <th className="text-left px-5 py-3">Reference</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-right px-5 py-3">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {invoice.payments.map((pay: any) => (
                                <tr key={pay.id}>
                                    <td className="px-5 py-3 text-gray-900">{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</td>
                                    <td className="px-5 py-3 text-gray-600">{pay.paymentMethod}</td>
                                    <td className="px-5 py-3 text-gray-600">{pay.reference || '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            pay.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            pay.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{pay.status}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-medium text-gray-900">₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notes */}
            {invoice.notes && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-medium text-gray-400 uppercase mb-2">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
            )}
        </div>
    );
}
