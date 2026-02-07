'use client';

import { useEffect, useState } from 'react';
import { discountsAPI } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    minQuantity: '',
    startDate: '',
    endDate: '',
    limitUsage: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const data = await discountsAPI.getAll();
      setDiscounts(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load discounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: '',
      minPurchase: '',
      minQuantity: '',
      startDate: '',
      endDate: '',
      limitUsage: '',
    });
  };

  const openCreateModal = () => {
    setEditingDiscount(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (discount: any) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: String(discount.value),
      minPurchase: discount.minPurchase ? String(discount.minPurchase) : '',
      minQuantity: discount.minQuantity ? String(discount.minQuantity) : '',
      startDate: discount.startDate ? discount.startDate.split('T')[0] : '',
      endDate: discount.endDate ? discount.endDate.split('T')[0] : '',
      limitUsage: discount.limitUsage ? String(discount.limitUsage) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: parseFloat(formData.value),
      };
      if (formData.minPurchase) payload.minPurchase = parseFloat(formData.minPurchase);
      if (formData.minQuantity) payload.minQuantity = parseInt(formData.minQuantity);
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;
      if (formData.limitUsage) payload.limitUsage = parseInt(formData.limitUsage);

      if (editingDiscount) {
        await discountsAPI.update(editingDiscount.id, payload);
        showToast('Discount updated successfully', 'success');
      } else {
        await discountsAPI.create(payload);
        showToast('Discount created successfully', 'success');
      }
      setShowModal(false);
      loadDiscounts();
    } catch (error: any) {
      showToast(error.message || 'Failed to save discount', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await discountsAPI.delete(deleteTarget.id);
      showToast('Discount deleted successfully', 'success');
      setDeleteTarget(null);
      loadDiscounts();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete discount', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading discounts..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Discount
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Purchase</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Usage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id}>
                <td className="font-medium text-gray-900">{discount.name}</td>
                <td>
                  <span className={discount.type === 'PERCENTAGE' ? 'badge-active' : 'badge-confirmed'}>
                    {discount.type}
                  </span>
                </td>
                <td className="font-medium">
                  {discount.type === 'FIXED' ? `$${Number(discount.value).toFixed(2)}` : `${discount.value}%`}
                </td>
                <td>{discount.minPurchase ? `$${Number(discount.minPurchase).toFixed(2)}` : '-'}</td>
                <td>{discount.startDate ? new Date(discount.startDate).toLocaleDateString() : '-'}</td>
                <td>{discount.endDate ? new Date(discount.endDate).toLocaleDateString() : '-'}</td>
                <td>
                  {discount.usageCount || 0}
                  {discount.limitUsage ? ` / ${discount.limitUsage}` : ''}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(discount)} className="btn-secondary btn-sm">Edit</button>
                    <button onClick={() => setDeleteTarget(discount)} className="btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No discounts found. Create your first discount to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDiscount ? 'Edit Discount' : 'New Discount'}
        onSubmit={handleSubmit}
        submitLabel={editingDiscount ? 'Update' : 'Create'}
        loading={saving}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Discount Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Enter discount name"
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="Description (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="form-label">Value</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="form-input"
                placeholder={formData.type === 'PERCENTAGE' ? 'e.g. 10' : '0.00'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Min Purchase</label>
              <input
                type="number"
                step="0.01"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                className="form-input"
                placeholder="0.00 (optional)"
              />
            </div>
            <div>
              <label className="form-label">Min Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                className="form-input"
                placeholder="0 (optional)"
              />
            </div>
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
          <div>
            <label className="form-label">Usage Limit</label>
            <input
              type="number"
              min="0"
              value={formData.limitUsage}
              onChange={(e) => setFormData({ ...formData, limitUsage: e.target.value })}
              className="form-input"
              placeholder="Unlimited (leave empty)"
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Discount"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
