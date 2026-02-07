'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscriptionsAPI, productsAPI, razorpayAPI } from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useToast } from '@/app/components/Toast';

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [lineForm, setLineForm] = useState({
    productId: '',
    quantity: '1',
    unitPrice: '',
  });
  const [addingLine, setAddingLine] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [subData, productsData] = await Promise.all([
        subscriptionsAPI.getOne(id as string),
        productsAPI.getAll(),
      ]);
      setSubscription(subData);
      setProducts(productsData);
    } catch (error: any) {
      showToast(error.message || 'Failed to load subscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await subscriptionsAPI.updateStatus(id as string, confirmAction.status);
      showToast(`Subscription status updated to ${confirmAction.status}`, 'success');
      setConfirmAction(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNow = async () => {
    setActionLoading(true);
    try {
      const orderData = await razorpayAPI.createOrder(id as string);

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SIDAZ',
        description: `Payment for ${orderData.subscriptionNumber}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            await razorpayAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast('Payment successful!', 'success');
            loadData();
          } catch (err: any) {
            showToast(err.message || 'Payment verification failed', 'error');
          }
        },
        prefill: {
          name: subscription.customer?.name || '',
          email: subscription.customer?.email || '',
        },
        theme: {
          color: '#1E40AF',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        showToast('Payment failed: ' + (response.error?.description || 'Unknown error'), 'error');
      });
      rzp.open();
    } catch (error: any) {
      showToast(error.message || 'Failed to initiate payment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLine = async () => {
    if (!lineForm.productId || !lineForm.unitPrice) {
      showToast('Please fill in all line fields', 'error');
      return;
    }
    setAddingLine(true);
    try {
      await subscriptionsAPI.addLine(id as string, {
        productId: lineForm.productId,
        quantity: parseInt(lineForm.quantity),
        unitPrice: parseFloat(lineForm.unitPrice),
      });
      showToast('Line added successfully', 'success');
      setLineForm({ productId: '', quantity: '1', unitPrice: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to add line', 'error');
    } finally {
      setAddingLine(false);
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    try {
      await subscriptionsAPI.deleteLine(id as string, lineId);
      showToast('Line removed', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove line', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscription..." />;
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Subscription not found.</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    );
  }

  const getStatusActions = () => {
    const actions: { status: string; label: string; className: string; handler?: () => void }[] = [];
    switch (subscription.status) {
      case 'DRAFT':
        actions.push({
          status: 'PAY',
          label: 'Pay Now',
          className: 'btn-primary',
          handler: handlePayNow,
        });
        break;
      case 'CONFIRMED':
        if (subscription.paymentLinkExpiry && new Date(subscription.paymentLinkExpiry) > new Date()) {
          actions.push({
            status: 'PAY',
            label: 'Complete Payment',
            className: 'btn-primary',
            handler: handlePayNow,
          });
        }
        break;
      case 'ACTIVE':
        actions.push({ status: 'CLOSED', label: 'Close Subscription', className: 'btn-danger' });
        break;
    }
    return actions;
  };

  const statusActions = getStatusActions();
  const linesTotal = subscription.lines?.reduce((sum: number, line: any) => sum + Number(line.amount || 0), 0) || 0;
  const planPrice = Number(subscription.plan?.price || 0);
  const displayAmount = linesTotal > 0 ? linesTotal : planPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Subscription {subscription.subscriptionNumber}
        </h1>
        <StatusBadge status={subscription.status} />
      </div>

      {/* Subscription Info Card */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">{subscription.customer?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Plan</p>
            <p className="font-medium text-gray-900">{subscription.plan?.name || '-'}</p>
            {subscription.plan?.price && (
              <p className="text-xs text-gray-500">
                {'\u20B9'}{Number(subscription.plan.price).toFixed(2)} / {subscription.plan.billingPeriod?.toLowerCase()}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium text-gray-900">{new Date(subscription.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expiration Date</p>
            <p className="font-medium text-gray-900">
              {subscription.expirationDate ? new Date(subscription.expirationDate).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        {/* Payment Details */}
        {(subscription.razorpayOrderId || subscription.razorpayPaymentId) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscription.amountDue && (
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">{'\u20B9'}{Number(subscription.amountDue).toFixed(2)}</p>
                </div>
              )}
              {subscription.razorpayPaymentId && (
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{subscription.razorpayPaymentId}</p>
                </div>
              )}
              {subscription.paymentLinkExpiry && subscription.status === 'CONFIRMED' && (
                <div>
                  <p className="text-sm text-gray-500">Payment Expires</p>
                  <p className="font-medium text-gray-900">{new Date(subscription.paymentLinkExpiry).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amount Summary for DRAFT */}
        {subscription.status === 'DRAFT' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">{'\u20B9'}{displayAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Status Action Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-3">
          {statusActions.map((action) => (
            <button
              key={action.status}
              onClick={() => {
                if (action.handler) {
                  action.handler();
                } else {
                  setConfirmAction({ status: action.status, label: action.label });
                }
              }}
              className={action.className}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : action.label}
            </button>
          ))}
          {statusActions.length === 0 && subscription.status === 'CLOSED' && (
            <p className="text-sm text-gray-500">This subscription is closed.</p>
          )}
        </div>
      </div>

      {/* Subscription Lines */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Lines</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
                {subscription.status === 'DRAFT' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {subscription.lines?.map((line: any, index: number) => (
                <tr key={line.id || index}>
                  <td className="font-medium text-gray-900">{line.product?.name || '-'}</td>
                  <td>{line.quantity}</td>
                  <td>{'\u20B9'}{Number(line.unitPrice).toFixed(2)}</td>
                  <td className="font-medium">{'\u20B9'}{Number(line.amount || line.unitPrice * line.quantity).toFixed(2)}</td>
                  {subscription.status === 'DRAFT' && (
                    <td>
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {(!subscription.lines || subscription.lines.length === 0) && (
                <tr>
                  <td colSpan={subscription.status === 'DRAFT' ? 5 : 4} className="text-center py-6 text-gray-500">
                    No lines added yet. {subscription.status === 'DRAFT' && 'Add products below.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Line Form */}
        {subscription.status === 'DRAFT' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Line</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="form-label">Product</label>
                <select
                  value={lineForm.productId}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setLineForm({
                      ...lineForm,
                      productId: e.target.value,
                      unitPrice: product ? String(product.salesPrice) : lineForm.unitPrice,
                    });
                  }}
                  className="form-select"
                >
                  <option value="">Select product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} — {'\u20B9'}{Number(product.salesPrice).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="form-label">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={lineForm.quantity}
                  onChange={(e) => setLineForm({ ...lineForm, quantity: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="w-32">
                <label className="form-label">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={lineForm.unitPrice}
                  onChange={(e) => setLineForm({ ...lineForm, unitPrice: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={handleAddLine}
                disabled={addingLine}
                className="btn-primary"
              >
                {addingLine ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Linked Invoices */}
      {subscription.invoices && subscription.invoices.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscription.invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="font-medium">{'\u20B9'}{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="text-emerald-600">{'\u20B9'}{Number(inv.paidAmount).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <button
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onConfirm={handleStatusChange}
        onCancel={() => setConfirmAction(null)}
        title="Change Status"
        message={`Are you sure you want to change the subscription status to "${confirmAction?.status}"?`}
        confirmLabel={confirmAction?.label || 'Confirm'}
        variant={confirmAction?.status === 'CLOSED' ? 'danger' : 'warning'}
        loading={actionLoading}
      />
    </div>
  );
}
