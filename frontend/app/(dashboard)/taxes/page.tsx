'use client';

import { useEffect, useState } from 'react';
import { taxesAPI } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate: '',
    taxType: '',
    country: '',
    state: '',
    isActive: true,
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    try {
      const data = await taxesAPI.getAll();
      setTaxes(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load taxes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rate: '',
      taxType: '',
      country: '',
      state: '',
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingTax(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (tax: any) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      description: tax.description || '',
      rate: String(tax.rate),
      taxType: tax.taxType || '',
      country: tax.country || '',
      state: tax.state || '',
      isActive: tax.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        rate: parseFloat(formData.rate),
        taxType: formData.taxType,
        country: formData.country,
        state: formData.state,
        isActive: formData.isActive,
      };

      if (editingTax) {
        await taxesAPI.update(editingTax.id, payload);
        showToast('Tax updated successfully', 'success');
      } else {
        await taxesAPI.create(payload);
        showToast('Tax created successfully', 'success');
      }
      setShowModal(false);
      loadTaxes();
    } catch (error: any) {
      showToast(error.message || 'Failed to save tax', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await taxesAPI.delete(deleteTarget.id);
      showToast('Tax deleted successfully', 'success');
      setDeleteTarget(null);
      loadTaxes();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete tax', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading taxes..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Taxes</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tax
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Rate %</th>
              <th>Country</th>
              <th>State</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax) => (
              <tr key={tax.id}>
                <td className="font-medium text-gray-900">{tax.name}</td>
                <td className="text-gray-500">{tax.taxType || '-'}</td>
                <td className="font-medium">{tax.rate}%</td>
                <td>{tax.country || '-'}</td>
                <td>{tax.state || '-'}</td>
                <td>
                  <span className={tax.isActive !== false ? 'badge-active' : 'badge-closed'}>
                    {tax.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(tax)} className="btn-secondary btn-sm">Edit</button>
                    <button onClick={() => setDeleteTarget(tax)} className="btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {taxes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No taxes configured. Add your first tax rule to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTax ? 'Edit Tax' : 'New Tax'}
        onSubmit={handleSubmit}
        submitLabel={editingTax ? 'Update' : 'Create'}
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Tax Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="e.g. GST 18%"
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
              <label className="form-label">Rate (%)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="form-input"
                placeholder="e.g. 18"
              />
            </div>
            <div>
              <label className="form-label">Tax Type</label>
              <input
                type="text"
                value={formData.taxType}
                onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                className="form-input"
                placeholder="e.g. GST, VAT, Sales Tax"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="form-input"
                placeholder="e.g. India, US"
              />
            </div>
            <div>
              <label className="form-label">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="form-input"
                placeholder="e.g. Karnataka, California"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="form-checkbox"
              />
              Active
            </label>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Tax"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
