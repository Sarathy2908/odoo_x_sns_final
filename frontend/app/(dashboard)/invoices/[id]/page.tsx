'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoicesAPI, paymentsAPI, pdfAPI } from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useToast } from '@/app/components/Toast';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'CREDIT_CARD', reference: '', notes: '' });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => { loadInvoice(); }, [id]);

  const loadInvoice = async () => {
    try {
      const data = await invoicesAPI.getOne(id as string);
      setInvoice(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load invoice', 'error');
    } finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await invoicesAPI.confirm(id as string);
      showToast('Invoice confirmed', 'success');
      setConfirmAction(null);
      loadInvoice();
    } catch (error: any) {
      showToast(error.message || 'Failed to confirm invoice', 'error');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await invoicesAPI.cancel(id as string);
      showToast('Invoice cancelled', 'success');
      setConfirmAction(null);
      loadInvoice();
    } catch (error: any) {
      showToast(error.message || 'Failed to cancel invoice', 'error');
    } finally { setActionLoading(false); }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) { showToast('Please enter an amount', 'error'); return; }
    setSubmittingPayment(true);
    try {
      await paymentsAPI.create({
        invoiceId: id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });
      showToast('Payment recorded', 'success');
      setPaymentForm({ amount: '', paymentMethod: 'CREDIT_CARD', reference: '', notes: '' });
      loadInvoice();
    } catch (error: any) {
      showToast(error.message || 'Failed to record payment', 'error');
    } finally { setSubmittingPayment(false); }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const result = await pdfAPI.generateInvoice(id as string);
      window.open(result.pdfUrl, '_blank');
      showToast('PDF generated', 'success');
      loadInvoice();
    } catch (error: any) {
      showToast(error.message || 'Failed to generate PDF', 'error');
    } finally { setGeneratingPdf(false); }
  };

  if (loading) return <LoadingSpinner message="Loading invoice..." />;

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found.</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  const subtotal = invoice.lines?.reduce((sum: number, l: any) => sum + (Number(l.unitPrice) * Number(l.quantity)) - Number(l.discount || 0), 0) || 0;
  const taxTotal = invoice.lines?.reduce((sum: number, l: any) => sum + Number(l.taxAmount || 0), 0) || 0;
  const total = Number(invoice.totalAmount) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  const balanceDue = total - paid;
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && balanceDue > 0 && invoice.status !== 'CANCELLED' && invoice.status !== 'PAID';

  const paymentMethodLabel: Record<string, string> = {
    CREDIT_CARD: 'Credit Card', DEBIT_CARD: 'Debit Card', BANK_TRANSFER: 'Bank Transfer',
    UPI: 'UPI', CASH: 'Cash', OTHER: 'Other',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
          <StatusBadge status={invoice.status} />
          {isOverdue && <span className="badge bg-red-100 text-red-700">OVERDUE</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGeneratePdf} disabled={generatingPdf} className="btn-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {generatingPdf ? 'Generating...' : 'Download PDF'}
          </button>
          {invoice.status === 'DRAFT' && (
            <>
              <button onClick={() => setConfirmAction('confirm')} className="btn-primary" disabled={actionLoading}>Confirm Invoice</button>
              <button onClick={() => setConfirmAction('cancel')} className="btn-danger" disabled={actionLoading}>Cancel</button>
            </>
          )}
          {invoice.status === 'CONFIRMED' && (
            <button onClick={() => setConfirmAction('cancel')} className="btn-danger" disabled={actionLoading}>Cancel Invoice</button>
          )}
        </div>
      </div>

      {/* Invoice Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Number</span><span className="font-mono font-medium">{invoice.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span className={isOverdue ? 'text-red-600 font-medium' : ''}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</span></div>
            {invoice.subscription && (
              <div className="flex justify-between"><span className="text-gray-500">Subscription</span><span className="font-mono text-xs">{invoice.subscription.subscriptionNumber}</span></div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{invoice.customer?.name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{invoice.customer?.email || '-'}</span></div>
            {invoice.contact && (
              <div className="flex justify-between"><span className="text-gray-500">Contact</span><span>{invoice.contact.name}</span></div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Amounts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{'\u20B9'}{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{'\u20B9'}{taxTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>{'\u20B9'}{total.toFixed(2)}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{'\u20B9'}{paid.toFixed(2)}</span></div>
            <div className={`flex justify-between font-bold border-t pt-2 ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <span>Balance Due</span><span>{'\u20B9'}{balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{invoice.notes}</p>
        </div>
      )}

      {/* Invoice Lines */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Description</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Qty</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Unit Price</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Discount</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Tax</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines?.map((line: any) => (
                <tr key={line.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{line.product?.name || '-'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{line.description || '-'}</td>
                  <td className="px-4 py-2.5 text-right">{line.quantity}</td>
                  <td className="px-4 py-2.5 text-right">{'\u20B9'}{Number(line.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right">{line.discount > 0 ? `₹${Number(line.discount).toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {line.tax ? `${line.tax.name} (${line.tax.rate}%)` : '-'}
                    {line.taxAmount > 0 && <span className="block text-xs text-gray-400">{'\u20B9'}{Number(line.taxAmount).toFixed(2)}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">{'\u20B9'}{Number(line.amount).toFixed(2)}</td>
                </tr>
              ))}
              {(!invoice.lines || invoice.lines.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No line items.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{'\u20B9'}{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-medium">{'\u20B9'}{taxTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2"><span>Total</span><span>{'\u20B9'}{total.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-emerald-600"><span>Paid</span><span className="font-medium">{'\u20B9'}{paid.toFixed(2)}</span></div>
            <div className={`flex justify-between text-base font-bold border-t pt-2 ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <span>Balance Due</span><span>{'\u20B9'}{balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Method</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Reference</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p: any) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">{paymentMethodLabel[p.paymentMethod] || p.paymentMethod}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{p.reference || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{'\u20B9'}{Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment */}
      {invoice.status === 'CONFIRMED' && balanceDue > 0 && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h2>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Amount *</label>
                <input type="number" step="0.01" max={balanceDue} value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="form-input" placeholder={balanceDue.toFixed(2)} required />
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} className="form-select">
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Reference</label>
                <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="form-input" placeholder="Transaction ref (optional)" />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <input type="text" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="form-input" placeholder="Notes (optional)" />
              </div>
            </div>
            <button type="submit" disabled={submittingPayment} className="btn-primary">
              {submittingPayment ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Confirm/Cancel Dialogs */}
      <ConfirmDialog isOpen={confirmAction === 'confirm'} onConfirm={handleConfirm} onCancel={() => setConfirmAction(null)} title="Confirm Invoice" message="Confirm this invoice? It will be marked as ready for payment." confirmLabel="Confirm" variant="warning" loading={actionLoading} />
      <ConfirmDialog isOpen={confirmAction === 'cancel'} onConfirm={handleCancel} onCancel={() => setConfirmAction(null)} title="Cancel Invoice" message="Cancel this invoice? This cannot be undone." confirmLabel="Cancel Invoice" variant="danger" loading={actionLoading} />
    </div>
  );
}
