'use client';

import { useEffect, useState } from 'react';
import { contactsAPI, getUser } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';
import PhoneInput from '@/app/components/PhoneInput';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [portalOnly, setPortalOnly] = useState(true);
  const [formData, setFormData] = useState({
    name: '', displayName: '', contactType: 'INDIVIDUAL', email: '', phone: '', mobile: '',
    website: '', street: '', city: '', state: '', country: '', postalCode: '',
    companyName: '', taxId: '', isCustomer: true, isVendor: false, notes: '',
  });
  const { showToast } = useToast();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterType) params.contactType = filterType;
      if (portalOnly) params.portalOnly = 'true';
      const data = await contactsAPI.getAll(params);
      setContacts(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load contacts', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timeout = setTimeout(() => { setLoading(true); loadContacts(); }, 300);
    return () => clearTimeout(timeout);
  }, [search, filterType, portalOnly]);

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({ name: '', displayName: '', contactType: 'INDIVIDUAL', email: '', phone: '', mobile: '', website: '', street: '', city: '', state: '', country: '', postalCode: '', companyName: '', taxId: '', isCustomer: true, isVendor: false, notes: '' });
    setShowModal(true);
  };

  const openEditModal = (contact: any) => {
    setEditTarget(contact);
    setFormData({
      name: contact.name || '', displayName: contact.displayName || '', contactType: contact.contactType || 'INDIVIDUAL',
      email: contact.email || '', phone: contact.phone || '', mobile: contact.mobile || '',
      website: contact.website || '', street: contact.street || '', city: contact.city || '',
      state: contact.state || '', country: contact.country || '', postalCode: contact.postalCode || '',
      companyName: contact.companyName || '', taxId: contact.taxId || '',
      isCustomer: contact.isCustomer ?? true, isVendor: contact.isVendor ?? false, notes: contact.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await contactsAPI.update(editTarget.id, formData);
        showToast('Contact updated successfully', 'success');
      } else {
        await contactsAPI.create(formData);
        showToast('Contact created successfully', 'success');
      }
      setShowModal(false);
      loadContacts();
    } catch (error: any) {
      showToast(error.message || 'Failed to save contact', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contactsAPI.delete(deleteTarget.id);
      showToast('Contact deleted successfully', 'success');
      setDeleteTarget(null);
      loadContacts();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete contact', 'error');
    } finally { setDeleting(false); }
  };

  if (loading && contacts.length === 0) return <LoadingSpinner message="Loading contacts..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <button onClick={openCreateModal} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Contact
        </button>
      </div>

      <div className="flex gap-3 items-center">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input max-w-xs" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="form-select w-auto">
          <option value="">All Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="COMPANY">Company</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={portalOnly} onChange={(e) => setPortalOnly(e.target.checked)} className="form-checkbox" />
          Portal Users Only
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Customer</th>
              <th>Portal User</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className="font-medium text-gray-900">{contact.name}</td>
                <td>
                  <span className={`badge ${contact.contactType === 'COMPANY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {contact.contactType === 'COMPANY' ? 'Company' : 'Individual'}
                  </span>
                </td>
                <td>{contact.email || '-'}</td>
                <td>{contact.phone || '-'}</td>
                <td>{contact.city || '-'}</td>
                <td>{contact.isCustomer ? <span className="badge-active">Yes</span> : <span className="badge-draft">No</span>}</td>
                <td>
                  {contact.users?.filter((u: any) => u.role === 'PORTAL_USER').map((u: any) => (
                    <span key={u.id} className="inline-block mr-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{u.name || u.email}</span>
                  )) || '-'}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(contact)} className="btn-secondary btn-sm">Edit</button>
                    {isAdmin && <button onClick={() => setDeleteTarget(contact)} className="btn-danger btn-sm">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No contacts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Contact' : 'Add Contact'} onSubmit={handleSubmit} submitLabel={editTarget ? 'Update' : 'Create'} loading={saving} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" placeholder="Contact name" />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select value={formData.contactType} onChange={(e) => setFormData({ ...formData, contactType: e.target.value })} className="form-select">
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </select>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-input" placeholder="email@example.com" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <PhoneInput value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} placeholder="Phone number" />
          </div>
          <div>
            <label className="form-label">Mobile</label>
            <PhoneInput value={formData.mobile} onChange={(val) => setFormData({ ...formData, mobile: val })} placeholder="Mobile number" />
          </div>
          <div>
            <label className="form-label">Website</label>
            <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="form-input" placeholder="https://..." />
          </div>
          {formData.contactType === 'COMPANY' && (
            <>
              <div>
                <label className="form-label">Company Name</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="form-input" placeholder="Company name" />
              </div>
              <div>
                <label className="form-label">Tax ID (GST/VAT)</label>
                <input type="text" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className="form-input" placeholder="Tax ID" />
              </div>
            </>
          )}
          <div className="md:col-span-2"><hr className="border-gray-200" /></div>
          <div>
            <label className="form-label">Street</label>
            <input type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">City</label>
            <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">State</label>
            <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">Country</label>
            <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="form-input" />
          </div>
          <div>
            <label className="form-label">Postal Code</label>
            <input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="form-input" />
          </div>
          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isCustomer} onChange={(e) => setFormData({ ...formData, isCustomer: e.target.checked })} className="form-checkbox" />
              <span className="text-sm text-gray-700">Customer</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.isVendor} onChange={(e) => setFormData({ ...formData, isVendor: e.target.checked })} className="form-checkbox" />
              <span className="text-sm text-gray-700">Vendor</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-textarea" rows={2} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} title="Delete Contact" message={`Are you sure you want to delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="danger" loading={deleting} />
    </div>
  );
}
