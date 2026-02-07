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
  const [aiLoading, setAiLoading] = useState(false);
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

  const handleAISuggest = async () => {
    if (!formData.name && !formData.taxType) {
      showToast('Please enter a tax name or type first', 'error');
      return;
    }
    if (!formData.country) {
      showToast('Please enter a country first', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const response = await taxesAPI.suggestAI({
        taxName: formData.name || formData.taxType,
        country: formData.country,
        state: formData.state || undefined,
      });

      const suggestion = response.suggestion;
      setFormData(prev => ({
        ...prev,
        rate: String(suggestion.rate),
        taxType: suggestion.taxType || prev.taxType,
        name: prev.name || suggestion.taxName,
      }));
      showToast(`AI suggested ${suggestion.rate}% — ${suggestion.reason}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'AI suggestion failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading taxes..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Taxes</h1>
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
            <button
              type="button"
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-all"
              style={{ backgroundColor: aiLoading ? '#9CA3AF' : '#017E84' }}
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting AI Suggestion...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Suggest Rate
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Fill in tax name/type &amp; country first, then click to auto-fill rate
            </p>
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
