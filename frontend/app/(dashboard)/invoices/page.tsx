'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesAPI } from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoicesAPI.getAll();
      setInvoices(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load invoices', 'error');
    } finally { setLoading(false); }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const isOverdue = (inv: any) => {
    if (inv.status === 'CANCELLED' || inv.status === 'PAID') return false;
    if (!inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date() && inv.paidAmount < inv.totalAmount;
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'DRAFT').length,
    confirmed: invoices.filter(i => i.status === 'CONFIRMED').length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    overdue: invoices.filter(i => isOverdue(i)).length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0),
    totalPaid: invoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0),
  };

  if (loading) return <LoadingSpinner message="Loading invoices..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">{'\u20B9'}{stats.totalAmount.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600">{'\u20B9'}{stats.totalPaid.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input type="text" placeholder="Search by invoice # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input flex-1" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-select w-40">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Subscription</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);
              const overdue = isOverdue(invoice);
              return (
                <tr key={invoice.id} className={overdue ? 'bg-red-50' : ''}>
                  <td className="font-medium text-gray-900 font-mono text-sm">{invoice.invoiceNumber}</td>
                  <td>{invoice.customer?.name || '-'}</td>
                  <td className="font-mono text-xs text-gray-500">{invoice.subscription?.subscriptionNumber || '-'}</td>
                  <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                  <td>
                    <span className={overdue ? 'text-red-600 font-medium' : ''}>
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </span>
                    {overdue && <span className="ml-1 text-xs text-red-500 font-medium">OVERDUE</span>}
                  </td>
                  <td className="font-medium">{'\u20B9'}{Number(invoice.totalAmount).toFixed(2)}</td>
                  <td className="text-emerald-600 font-medium">{'\u20B9'}{Number(invoice.paidAmount).toFixed(2)}</td>
                  <td className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {'\u20B9'}{balance.toFixed(2)}
                  </td>
                  <td><StatusBadge status={invoice.status} /></td>
                  <td>
                    <button onClick={() => router.push(`/invoices/${invoice.id}`)} className="btn-secondary btn-sm">View</button>
                  </td>
                </tr>
              );
            })}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
