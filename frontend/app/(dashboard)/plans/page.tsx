'use client';

import { useEffect, useState } from 'react';
import { plansAPI } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingPeriod: 'MONTHLY',
    minQuantity: '1',
    startDate: '',
    endDate: '',
    autoClose: false,
    closable: true,
    pausable: false,
    renewable: true,
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await plansAPI.getAll();
      setPlans(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billingPeriod: 'MONTHLY',
      minQuantity: '1',
      startDate: '',
      endDate: '',
      autoClose: false,
      closable: true,
      pausable: false,
      renewable: true,
    });
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      billingPeriod: plan.billingPeriod,
      minQuantity: String(plan.minQuantity || 1),
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
      endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
      autoClose: plan.autoClose || false,
      closable: plan.closable !== false,
      pausable: plan.pausable || false,
      renewable: plan.renewable !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        billingPeriod: formData.billingPeriod,
        minQuantity: parseInt(formData.minQuantity),
        autoClose: formData.autoClose,
        closable: formData.closable,
        pausable: formData.pausable,
        renewable: formData.renewable,
      };
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;

      if (editingPlan) {
        await plansAPI.update(editingPlan.id, payload);
        showToast('Plan updated successfully', 'success');
      } else {
        await plansAPI.create(payload);
        showToast('Plan created successfully', 'success');
      }
      setShowModal(false);
      loadPlans();
    } catch (error: any) {
      showToast(error.message || 'Failed to save plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await plansAPI.delete(deleteTarget.id);
      showToast('Plan deleted successfully', 'success');
      setDeleteTarget(null);
      loadPlans();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete plan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const periodBadge = (period: string) => {
    const styles: Record<string, string> = {
      DAILY: 'badge-draft',
      WEEKLY: 'badge-confirmed',
      MONTHLY: 'badge-active',
      YEARLY: 'badge-quotation',
    };
    return <span className={styles[period] || 'badge-draft'}>{period}</span>;
  };

  if (loading) {
    return <LoadingSpinner message="Loading plans..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Plan
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Billing Period</th>
              <th>Min Qty</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Options</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="font-medium text-gray-900">{plan.name}</td>
                <td>${Number(plan.price).toFixed(2)}</td>
                <td>{periodBadge(plan.billingPeriod)}</td>
                <td>{plan.minQuantity || 1}</td>
                <td>{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '-'}</td>
                <td>{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${plan.autoClose ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      Auto-close: {plan.autoClose ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${plan.closable !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      Closable: {plan.closable !== false ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${plan.pausable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      Pausable: {plan.pausable ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${plan.renewable !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      Renewable: {plan.renewable !== false ? 'Yes' : 'No'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(plan)} className="btn-secondary btn-sm">Edit</button>
                    <button onClick={() => setDeleteTarget(plan)} className="btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No plans found. Create your first plan to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlan ? 'Edit Plan' : 'New Plan'}
        onSubmit={handleSubmit}
        submitLabel={editingPlan ? 'Update' : 'Create'}
        loading={saving}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Plan Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Enter plan name"
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="Plan description (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Price</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="form-label">Billing Period</label>
              <select
                value={formData.billingPeriod}
                onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                className="form-select"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Min Quantity</label>
            <input
              type="number"
              min="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="form-label mb-3">Plan Options</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.autoClose}
                  onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                  className="form-checkbox"
                />
                Auto Close
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.closable}
                  onChange={(e) => setFormData({ ...formData, closable: e.target.checked })}
                  className="form-checkbox"
                />
                Closable
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.pausable}
                  onChange={(e) => setFormData({ ...formData, pausable: e.target.checked })}
                  className="form-checkbox"
                />
                Pausable
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.renewable}
                  onChange={(e) => setFormData({ ...formData, renewable: e.target.checked })}
                  className="form-checkbox"
                />
                Renewable
              </label>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Plan"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
