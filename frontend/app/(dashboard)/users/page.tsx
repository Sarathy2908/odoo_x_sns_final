'use client';

import { useEffect, useState } from 'react';
import { usersAPI, getUser } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';
import PhoneInput from '@/app/components/PhoneInput';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const { showToast } = useToast();
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', email: '', password: '', phone: '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      showToast('Please fill in required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
      if (formData.phone) payload.phone = formData.phone;

      await usersAPI.createInternal(payload);
      showToast('User created successfully', 'success');
      setShowModal(false);
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Failed to create user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      await usersAPI.changeRole(userId, newRole);
      showToast('Role updated successfully', 'success');
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Failed to change role', 'error');
    } finally {
      setChangingRole(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersAPI.delete(deleteTarget.id);
      showToast('User deleted successfully', 'success');
      setDeleteTarget(null);
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',
      INTERNAL_USER: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
      PORTAL_USER: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700',
    };
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      INTERNAL_USER: 'Internal User',
      PORTAL_USER: 'Portal User',
    };
    return <span className={styles[role] || 'badge-draft'}>{labels[role] || role}</span>;
  };

  if (loading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Created</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium text-gray-900">{user.name}</td>
                <td>{user.email}</td>
                <td>{roleBadge(user.role)}</td>
                <td>{user.phone || '-'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                {isAdmin && (
                  <td>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={changingRole === user.id || user.id === currentUser?.id}
                        className="form-select text-xs py-1 px-2 w-auto"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="INTERNAL_USER">Internal User</option>
                        <option value="PORTAL_USER">Portal User</option>
                      </select>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add User"
        onSubmit={handleSubmit}
        submitLabel="Create"
        loading={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              placeholder="Phone number (optional)"
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
