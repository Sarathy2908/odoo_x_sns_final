'use client';

import { useEffect, useState } from 'react';
import { paymentsAPI, invoicesAPI } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'CREDIT_CARD',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, invoicesData] = await Promise.all([
        paymentsAPI.getAll(),
        invoicesAPI.getAll(),
      ]);
      setPayments(paymentsData);
      setInvoices(invoicesData);
    } catch (error: any) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      invoiceId: '',
      amount: '',
      paymentMethod: 'CREDIT_CARD',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.invoiceId || !formData.amount) {
      showToast('Please fill in required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        invoiceId: formData.invoiceId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
      };
      if (formData.paymentDate) payload.paymentDate = formData.paymentDate;
      if (formData.reference) payload.reference = formData.reference;
      if (formData.notes) payload.notes = formData.notes;

      await paymentsAPI.create(payload);
      showToast('Payment recorded successfully', 'success');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const methodBadge = (method: string) => {
    const styles: Record<string, string> = {
      CREDIT_CARD: 'badge-confirmed',
      DEBIT_CARD: 'badge-active',
      BANK_TRANSFER: 'badge-quotation',
      UPI: 'badge-paid',
      CASH: 'badge-draft',
      OTHER: 'badge-closed',
    };
    const labels: Record<string, string> = {
      CREDIT_CARD: 'Credit Card',
      DEBIT_CARD: 'Debit Card',
      BANK_TRANSFER: 'Bank Transfer',
      UPI: 'UPI',
      CASH: 'Cash',
      OTHER: 'Other',
    };
    return <span className={styles[method] || 'badge-draft'}>{labels[method] || method}</span>;
  };

  if (loading) {
    return <LoadingSpinner message="Loading payments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Payment
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</td>
                <td className="font-mono text-sm">{payment.invoice?.invoiceNumber || '-'}</td>
                <td>{payment.invoice?.customer?.name || '-'}</td>
                <td className="font-medium text-emerald-600">{'\u20B9'}{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>{methodBadge(payment.paymentMethod)}</td>
                <td className="text-gray-500">{payment.reference || '-'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Payment"
        onSubmit={handleSubmit}
        submitLabel="Record"
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Invoice</label>
            <select
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Select an invoice...</option>
              {invoices
                .filter((inv) => inv.status === 'CONFIRMED')
                .map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customer?.name} ({'\u20B9'}{Number(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} due)
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="form-select"
              >
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Payment Date</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="form-input"
              placeholder="Transaction reference (optional)"
            />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="Additional notes (optional)"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
