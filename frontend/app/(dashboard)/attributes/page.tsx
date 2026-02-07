'use client';

import { useEffect, useState } from 'react';
import { attributesAPI, getUser } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [valueForm, setValueForm] = useState({ value: '', extraPrice: '0' });
  const [addingValue, setAddingValue] = useState(false);
  const [formData, setFormData] = useState({ name: '', displayType: 'select', values: [{ value: '', extraPrice: '0' }] });
  const { showToast } = useToast();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => { loadAttributes(); }, []);

  const loadAttributes = async () => {
    try {
      const data = await attributesAPI.getAll();
      setAttributes(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load attributes', 'error');
    } finally { setLoading(false); }
  };

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({ name: '', displayType: 'select', values: [{ value: '', extraPrice: '0' }] });
    setShowModal(true);
  };

  const openEditModal = (attr: any) => {
    setEditTarget(attr);
    setFormData({ name: attr.name, displayType: attr.displayType, values: [] });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await attributesAPI.update(editTarget.id, { name: formData.name, displayType: formData.displayType });
        showToast('Attribute updated', 'success');
      } else {
        const validValues = formData.values.filter(v => v.value.trim());
        await attributesAPI.create({ name: formData.name, displayType: formData.displayType, values: validValues.length > 0 ? validValues : undefined });
        showToast('Attribute created', 'success');
      }
      setShowModal(false);
      loadAttributes();
    } catch (error: any) {
      showToast(error.message || 'Failed to save attribute', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await attributesAPI.delete(deleteTarget.id);
      showToast('Attribute deleted', 'success');
      setDeleteTarget(null);
      loadAttributes();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete attribute', 'error');
    } finally { setDeleting(false); }
  };

  const handleAddValue = async (attrId: string) => {
    if (!valueForm.value.trim()) { showToast('Value is required', 'error'); return; }
    setAddingValue(true);
    try {
      await attributesAPI.addValue(attrId, { value: valueForm.value, extraPrice: valueForm.extraPrice });
      showToast('Value added', 'success');
      setValueForm({ value: '', extraPrice: '0' });
      loadAttributes();
    } catch (error: any) {
      showToast(error.message || 'Failed to add value', 'error');
    } finally { setAddingValue(false); }
  };

  const handleDeleteValue = async (attrId: string, valueId: string) => {
    try {
      await attributesAPI.deleteValue(attrId, valueId);
      showToast('Value deleted', 'success');
      loadAttributes();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete value', 'error');
    }
  };

  const addFormValue = () => {
    setFormData({ ...formData, values: [...formData.values, { value: '', extraPrice: '0' }] });
  };

  const removeFormValue = (index: number) => {
    setFormData({ ...formData, values: formData.values.filter((_, i) => i !== index) });
  };

  if (loading) return <LoadingSpinner message="Loading attributes..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attributes</h1>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Attribute
          </button>
        )}
      </div>

      <div className="space-y-4">
        {attributes.map((attr) => (
          <div key={attr.id} className="card">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpandedAttr(expandedAttr === attr.id ? null : attr.id)}>
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 transition-transform ${expandedAttr === attr.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="font-medium text-gray-900">{attr.name}</span>
                <span className="badge bg-gray-100 text-gray-600">{attr.displayType}</span>
                <span className="text-sm text-gray-500">{attr.values?.length || 0} values</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEditModal(attr)} className="btn-secondary btn-sm">Edit</button>
                  <button onClick={() => setDeleteTarget(attr)} className="btn-danger btn-sm">Delete</button>
                </div>
              )}
            </div>

            {expandedAttr === attr.id && (
              <div className="border-t border-gray-200 p-4">
                <div className="space-y-2">
                  {attr.values?.map((val: any) => (
                    <div key={val.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">{val.value}</span>
                        {val.extraPrice > 0 && <span className="text-xs text-emerald-600">+{'\u20B9'}{val.extraPrice}</span>}
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteValue(attr.id, val.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                      )}
                    </div>
                  ))}
                  {(!attr.values || attr.values.length === 0) && <p className="text-sm text-gray-500">No values yet.</p>}
                </div>

                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-end gap-2">
                    <div className="flex-1">
                      <input type="text" placeholder="Value name" value={valueForm.value} onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })} className="form-input text-sm" />
                    </div>
                    <div className="w-28">
                      <input type="number" step="0.01" placeholder="Extra price" value={valueForm.extraPrice} onChange={(e) => setValueForm({ ...valueForm, extraPrice: e.target.value })} className="form-input text-sm" />
                    </div>
                    <button onClick={() => handleAddValue(attr.id)} disabled={addingValue} className="btn-primary btn-sm">{addingValue ? '...' : 'Add'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {attributes.length === 0 && (
          <div className="card p-8 text-center text-gray-500">No attributes found. Create one to get started.</div>
        )}
      </div>

      <FormModal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Attribute' : 'Add Attribute'} onSubmit={handleSubmit} submitLabel={editTarget ? 'Update' : 'Create'} loading={saving}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" placeholder="e.g., Color, Size, Brand" />
          </div>
          <div>
            <label className="form-label">Display Type</label>
            <select value={formData.displayType} onChange={(e) => setFormData({ ...formData, displayType: e.target.value })} className="form-select">
              <option value="select">Dropdown</option>
              <option value="radio">Radio Buttons</option>
              <option value="color">Color Swatches</option>
              <option value="pills">Pills</option>
            </select>
          </div>
          {!editTarget && (
            <div>
              <label className="form-label">Initial Values</label>
              {formData.values.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input type="text" placeholder="Value" value={v.value} onChange={(e) => {
                    const vals = [...formData.values]; vals[i] = { ...vals[i], value: e.target.value };
                    setFormData({ ...formData, values: vals });
                  }} className="form-input flex-1" />
                  <input type="number" step="0.01" placeholder="Extra $" value={v.extraPrice} onChange={(e) => {
                    const vals = [...formData.values]; vals[i] = { ...vals[i], extraPrice: e.target.value };
                    setFormData({ ...formData, values: vals });
                  }} className="form-input w-24" />
                  {formData.values.length > 1 && (
                    <button type="button" onClick={() => removeFormValue(i)} className="text-red-500 hover:text-red-700 text-sm">X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addFormValue} className="text-sm text-primary hover:text-primary-dark">+ Add another value</button>
            </div>
          )}
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} title="Delete Attribute" message={`Delete "${deleteTarget?.name}" and all its values? This cannot be undone.`} confirmLabel="Delete" variant="danger" loading={deleting} />
    </div>
  );
}
