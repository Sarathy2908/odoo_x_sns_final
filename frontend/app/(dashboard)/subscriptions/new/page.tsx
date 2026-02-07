'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionsAPI, usersAPI, plansAPI, getUser } from '@/lib/api';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function NewSubscriptionPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    paymentTerms: '',
  });
  const router = useRouter();
  const { showToast } = useToast();

  const isPortalUser = currentUser?.role === 'PORTAL_USER';

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
    if (user?.role === 'PORTAL_USER') {
      setFormData((prev) => ({ ...prev, customerId: user.id }));
    }
    loadData(user);
  }, []);

  const loadData = async (user: any) => {
    try {
      const promises: Promise<any>[] = [plansAPI.getAll()];
      // Only fetch users list for admin/internal users
      if (user?.role !== 'PORTAL_USER') {
        promises.push(usersAPI.getAll({ role: 'PORTAL_USER' }));
      }
      const results = await Promise.all(promises);
      setPlans(results[0]);
      if (results[1]) {
        setUsers(results[1]);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPortalUser && !formData.customerId) {
      showToast('Please select a customer', 'error');
      return;
    }
    if (!formData.planId) {
      showToast('Please select a plan', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        planId: formData.planId,
        startDate: formData.startDate,
      };
      // Portal users don't need to send customerId - backend auto-sets it
      if (!isPortalUser) {
        payload.customerId = formData.customerId;
      }
      if (formData.expirationDate) payload.expirationDate = formData.expirationDate;
      if (formData.paymentTerms) payload.paymentTerms = formData.paymentTerms;

      await subscriptionsAPI.create(payload);
      showToast('Subscription created successfully', 'success');
      router.push('/subscriptions');
    } catch (error: any) {
      showToast(error.message || 'Failed to create subscription', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading form data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary btn-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Subscription</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer field - hidden for portal users */}
            {!isPortalUser ? (
              <div>
                <label className="form-label">Customer</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">Select a customer...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="form-label">Customer</label>
                <input
                  type="text"
                  value={currentUser?.name || ''}
                  className="form-input bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Subscription will be created for your account</p>
              </div>
            )}

            <div>
              <label className="form-label">Plan</label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Select a plan...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {'\u20B9'}{Number(plan.price).toFixed(2)} / {plan.billingPeriod.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Expiration Date</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="form-input"
                placeholder="e.g., Net 30, Due on Receipt"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Subscription'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowPlans(!showPlans)}
              className="btn-secondary ml-auto flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {showPlans ? 'Hide Plans' : 'Show Plans'}
            </button>
          </div>
        </form>
      </div>

      {/* Plans List Panel */}
      {showPlans && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
          {plans.length === 0 ? (
            <p className="text-gray-500 text-sm">No plans available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  onClick={() => {
                    setFormData({ ...formData, planId: plan.id });
                    setShowPlans(false);
                    showToast(`Selected plan: ${plan.name}`, 'success');
                  }}
                  className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                    formData.planId === plan.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    {formData.planId === plan.id && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                  )}
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      {'\u20B9'}{Number(plan.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {plan.billingPeriod.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{plan.billingPeriod}</span>
                    {plan.renewable && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Renewable</span>}
                    {plan.pausable && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">Pausable</span>}
                    {plan.closable && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Closable</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
