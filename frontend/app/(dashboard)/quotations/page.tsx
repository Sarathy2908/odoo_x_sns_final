'use client';

import { useEffect, useState } from 'react';
import { quotationsAPI, plansAPI, productsAPI, usersAPI, getUser, pdfAPI } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lineForm, setLineForm] = useState({ productId: '', quantity: '1', unitPrice: '', discount: '0' });
  const [addingLine, setAddingLine] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subForm, setSubForm] = useState({ templateId: '', customerId: '', startDate: '' });
  const [creatingSub, setCreatingSub] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', validityDays: '30', planId: '',
    recurringPeriod: '', notes: '', termsAndConditions: '',
  });
  const { showToast } = useToast();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [q, p, prod, u] = await Promise.all([
        quotationsAPI.getAll(),
        plansAPI.getAll(),
        productsAPI.getAll(),
        usersAPI.getAll({ role: 'PORTAL_USER' }).catch(() => []),
      ]);
      setQuotations(q); setPlans(p); setProducts(prod); setUsers(u);
    } catch (error: any) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({ name: '', description: '', validityDays: '30', planId: '', recurringPeriod: '', notes: '', termsAndConditions: '' });
    setShowModal(true);
  };

  const openEditModal = (q: any) => {
    setEditTarget(q);
    setFormData({
      name: q.name, description: q.description || '', validityDays: String(q.validityDays),
      planId: q.planId, recurringPeriod: q.recurringPeriod || '',
      notes: q.notes || '', termsAndConditions: q.termsAndConditions || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.planId) { showToast('Name and plan are required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        validityDays: parseInt(formData.validityDays) || 30,
        recurringPeriod: formData.recurringPeriod || null,
        notes: formData.notes || null,
        termsAndConditions: formData.termsAndConditions || null,
      };
      if (editTarget) {
        await quotationsAPI.update(editTarget.id, payload);
        showToast('Template updated', 'success');
      } else {
        await quotationsAPI.create(payload);
        showToast('Template created', 'success');
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save template', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quotationsAPI.delete(deleteTarget.id);
      showToast('Template deleted', 'success');
      setDeleteTarget(null);
      if (expandedId === deleteTarget.id) setExpandedId(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete', 'error');
    } finally { setDeleting(false); }
  };

  const handleAddLine = async (templateId: string) => {
    if (!lineForm.productId) { showToast('Select a product', 'error'); return; }
    setAddingLine(true);
    try {
      await quotationsAPI.addLine(templateId, {
        productId: lineForm.productId,
        quantity: parseInt(lineForm.quantity) || 1,
        unitPrice: parseFloat(lineForm.unitPrice) || 0,
        discount: parseFloat(lineForm.discount) || 0,
      });
      showToast('Line added', 'success');
      setLineForm({ productId: '', quantity: '1', unitPrice: '', discount: '0' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to add line', 'error');
    } finally { setAddingLine(false); }
  };

  const handleDeleteLine = async (templateId: string, lineId: string) => {
    try {
      await quotationsAPI.deleteLine(templateId, lineId);
      showToast('Line removed', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove line', 'error');
    }
  };

  const openSubModal = (templateId: string) => {
    setSubForm({ templateId, customerId: '', startDate: new Date().toISOString().split('T')[0] });
    setShowSubModal(true);
  };

  const handleCreateSubscription = async () => {
    if (!subForm.customerId) { showToast('Select a customer', 'error'); return; }
    setCreatingSub(true);
    try {
      const result = await quotationsAPI.createSubscription(subForm.templateId, {
        customerId: subForm.customerId,
        startDate: subForm.startDate,
      });
      showToast(`Subscription ${result.subscriptionNumber} created!`, 'success');
      setShowSubModal(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to create subscription', 'error');
    } finally { setCreatingSub(false); }
  };

  const onProductSelect = (productId: string) => {
    const p = products.find((pr: any) => pr.id === productId);
    setLineForm({ ...lineForm, productId, unitPrice: p ? String(p.salesPrice) : '' });
  };

  const handleDownloadPdf = async (templateId: string) => {
    try {
      const result = await pdfAPI.generateQuotation(templateId);
      window.open(result.pdfUrl, '_blank');
      showToast('PDF generated', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to generate PDF', 'error');
    }
  };

  const periodLabel: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' };

  if (loading) return <LoadingSpinner message="Loading quotation templates..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quotation Templates</h1>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Template
          </button>
        )}
      </div>

      <div className="space-y-3">
        {quotations.map((q) => {
          const totalAmount = q.lines?.reduce((sum: number, l: any) => sum + (l.quantity * l.unitPrice - (l.discount || 0)), 0) || 0;
          return (
            <div key={q.id} className="card">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                <div className="flex items-center gap-4 flex-1">
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === q.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{q.name}</span>
                      <span className="badge bg-blue-100 text-blue-700">{q.plan?.name}</span>
                      {q.recurringPeriod && <span className="badge bg-emerald-100 text-emerald-700">{periodLabel[q.recurringPeriod]}</span>}
                    </div>
                    {q.description && <p className="text-sm text-gray-500 truncate mt-0.5">{q.description}</p>}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-500">Validity</p>
                      <p className="font-medium">{q.validityDays} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Lines</p>
                      <p className="font-medium">{q.lines?.length || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total</p>
                      <p className="font-semibold text-gray-900">{'\u20B9'}{totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDownloadPdf(q.id)} className="btn-secondary btn-sm">PDF</button>
                  <button onClick={() => openSubModal(q.id)} className="btn-primary btn-sm">Create Sub</button>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEditModal(q)} className="btn-secondary btn-sm">Edit</button>
                      <button onClick={() => setDeleteTarget(q)} className="btn-danger btn-sm">Delete</button>
                    </>
                  )}
                </div>
              </div>

              {expandedId === q.id && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {/* Notes & Terms */}
                  {(q.notes || q.termsAndConditions) && (
                    <div className="grid grid-cols-2 gap-4">
                      {q.notes && (
                        <div><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p><p className="text-sm text-gray-700">{q.notes}</p></div>
                      )}
                      {q.termsAndConditions && (
                        <div><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Terms & Conditions</p><p className="text-sm text-gray-700">{q.termsAndConditions}</p></div>
                      )}
                    </div>
                  )}

                  {/* Lines Table */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Unit Price</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Discount</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600">Subtotal</th>
                            {isAdmin && <th className="px-3 py-2 w-16"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {q.lines?.map((line: any) => (
                            <tr key={line.id} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-medium text-gray-900">{line.product?.name}</td>
                              <td className="px-3 py-2 text-right">{line.quantity}</td>
                              <td className="px-3 py-2 text-right">{'\u20B9'}{Number(line.unitPrice).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">{line.discount > 0 ? `₹${Number(line.discount).toFixed(2)}` : '-'}</td>
                              <td className="px-3 py-2 text-right font-medium">{'\u20B9'}{(line.quantity * line.unitPrice - (line.discount || 0)).toFixed(2)}</td>
                              {isAdmin && (
                                <td className="px-3 py-2 text-right">
                                  <button onClick={() => handleDeleteLine(q.id, line.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                                </td>
                              )}
                            </tr>
                          ))}
                          {(!q.lines || q.lines.length === 0) && (
                            <tr><td colSpan={isAdmin ? 6 : 5} className="px-3 py-4 text-center text-gray-500">No line items.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Line Form */}
                    {isAdmin && (
                      <div className="mt-3 flex items-end gap-2">
                        <div className="flex-1">
                          <select value={lineForm.productId} onChange={(e) => onProductSelect(e.target.value)} className="form-select text-sm">
                            <option value="">Select Product</option>
                            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} - {'\u20B9'}{Number(p.salesPrice).toFixed(2)}</option>)}
                          </select>
                        </div>
                        <div className="w-20">
                          <input type="number" min="1" placeholder="Qty" value={lineForm.quantity} onChange={(e) => setLineForm({ ...lineForm, quantity: e.target.value })} className="form-input text-sm" />
                        </div>
                        <div className="w-28">
                          <input type="number" step="0.01" placeholder="Price" value={lineForm.unitPrice} onChange={(e) => setLineForm({ ...lineForm, unitPrice: e.target.value })} className="form-input text-sm" />
                        </div>
                        <div className="w-24">
                          <input type="number" step="0.01" placeholder="Discount" value={lineForm.discount} onChange={(e) => setLineForm({ ...lineForm, discount: e.target.value })} className="form-input text-sm" />
                        </div>
                        <button onClick={() => handleAddLine(q.id)} disabled={addingLine} className="btn-primary btn-sm">
                          {addingLine ? '...' : 'Add'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {quotations.length === 0 && (
          <div className="card p-8 text-center text-gray-500">No quotation templates found. Create one to get started.</div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      <FormModal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Template' : 'New Quotation Template'} onSubmit={handleSubmit} submitLabel={editTarget ? 'Update' : 'Create'} loading={saving}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Template Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" placeholder="e.g., Enterprise Annual Plan" />
            </div>
            <div>
              <label className="form-label">Recurring Plan *</label>
              <select value={formData.planId} onChange={(e) => setFormData({ ...formData, planId: e.target.value })} className="form-select" required>
                <option value="">Select a plan...</option>
                {plans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>{plan.name} - {'\u20B9'}{Number(plan.price).toFixed(2)} / {plan.billingPeriod.toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Validity Days</label>
              <input type="number" min="1" value={formData.validityDays} onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })} className="form-input" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Recurring Period Override</label>
              <select value={formData.recurringPeriod} onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })} className="form-select">
                <option value="">Use plan default</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-textarea" rows={2} placeholder="Template description (optional)" />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-textarea" rows={2} placeholder="Internal notes (optional)" />
          </div>
          <div>
            <label className="form-label">Terms & Conditions</label>
            <textarea value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} className="form-textarea" rows={3} placeholder="Terms and conditions for quotation (optional)" />
          </div>
        </div>
      </FormModal>

      {/* Create Subscription Modal */}
      <FormModal isOpen={showSubModal} onClose={() => setShowSubModal(false)} title="Create Subscription from Template" onSubmit={handleCreateSubscription} submitLabel="Create Subscription" loading={creatingSub}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Customer *</label>
            <select value={subForm.customerId} onChange={(e) => setSubForm({ ...subForm, customerId: e.target.value })} className="form-select" required>
              <option value="">Select customer...</option>
              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" value={subForm.startDate} onChange={(e) => setSubForm({ ...subForm, startDate: e.target.value })} className="form-input" />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} title="Delete Template" message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`} confirmLabel="Delete" variant="danger" loading={deleting} />
    </div>
  );
}
