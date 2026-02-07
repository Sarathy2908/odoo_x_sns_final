'use client';

import { useEffect, useState } from 'react';
import { invoicesAPI } from '@/lib/api';

const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-500/20 text-gray-300',
    CONFIRMED: 'bg-blue-500/20 text-blue-300',
    PAID: 'bg-green-500/20 text-green-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            const data = await invoicesAPI.getAll();
            setInvoices(data);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Invoices</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Invoice #</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Total</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Paid</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 text-white font-mono text-sm">{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 text-gray-300">{invoice.customer.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-white font-semibold">${invoice.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-green-400 font-semibold">${invoice.paidAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[invoice.status]}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {invoices.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-xl">No invoices found</p>
                    <p className="text-sm mt-2">Invoices will appear here once generated</p>
                </div>
            )}
        </div>
    );
}
