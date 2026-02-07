'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionsAPI, plansAPI } from '@/lib/api';
import StatusBadge from '@/app/components/StatusBadge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import FormModal from '@/app/components/FormModal';
import { useToast } from '@/app/components/Toast';

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    billingPeriod: 'MONTHLY',
  });
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await subscriptionsAPI.getAll();
      setSubscriptions(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.name || !planForm.price) {
      showToast('Plan name and price are required', 'error');
      return;
    }
    setSavingPlan(true);
    try {
      await plansAPI.create({
        name: planForm.name,
        description: planForm.description || null,
        price: parseFloat(planForm.price),
        billingPeriod: planForm.billingPeriod,
      });
      showToast('Plan created successfully', 'success');
      setShowPlanModal(false);
      setPlanForm({ name: '', description: '', price: '', billingPeriod: 'MONTHLY' });
    } catch (error: any) {
      showToast(error.message || 'Failed to create plan', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const statusCounts = subscriptions.reduce((acc: Record<string, number>, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1;
    return acc;
  }, {});

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesTab = activeTab === 'ALL' || sub.status === activeTab;
    const matchesSearch =
      !search ||
      sub.subscriptionNumber?.toLowerCase().includes(search.toLowerCase()) ||
      sub.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading subscriptions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlanModal(true)}
            className="btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Plan
          </button>
          <button
            onClick={() => router.push('/subscriptions/new')}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Subscription
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'ALL' ? subscriptions.length : (statusCounts[tab.key] || 0);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by subscription number, customer, or plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subscription #</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>Expiration</th>
              <th>Payment Terms</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map((sub) => (
              <tr
                key={sub.id}
                className="cursor-pointer"
                onClick={() => router.push(`/subscriptions/${sub.id}`)}
              >
                <td className="font-medium text-gray-900 font-mono text-sm">
                  {sub.subscriptionNumber}
                </td>
                <td>{sub.customer?.name || '-'}</td>
                <td>
                  <div>
                    <span className="text-gray-900">{sub.plan?.name || '-'}</span>
                    {sub.plan?.price && (
                      <span className="block text-xs text-gray-500">
                        {'\u20B9'}{Number(sub.plan.price).toFixed(2)} / {sub.plan.billingPeriod?.toLowerCase() || 'month'}
                      </span>
                    )}
                  </div>
                </td>
                <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                <td>
                  {sub.expirationDate
                    ? new Date(sub.expirationDate).toLocaleDateString()
                    : '-'}
                </td>
                <td className="text-gray-500 text-sm">{sub.paymentTerms || '-'}</td>
                <td><StatusBadge status={sub.status} /></td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/subscriptions/${sub.id}`);
                    }}
                    className="btn-secondary btn-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredSubscriptions.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      {search
                        ? 'No subscriptions match your search.'
                        : activeTab === 'ALL'
                        ? 'No subscriptions found. Create your first subscription to get started.'
                        : `No ${activeTab.toLowerCase()} subscriptions.`}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {filteredSubscriptions.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="flex items-center gap-1.5">
                <StatusBadge status={status} />
                <span className="font-medium text-gray-700">{count as number}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      <FormModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Add New Plan"
        onSubmit={handleCreatePlan}
        submitLabel="Create Plan"
        loading={savingPlan}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Plan Name *</label>
            <input
              type="text"
              required
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              className="form-input"
              placeholder="e.g., Basic Monthly, Pro Yearly"
            />
          </div>
          <div>
            <label className="form-label">Price *</label>
            <input
              type="number"
              required
              step="0.01"
              value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              className="form-input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="form-label">Billing Period</label>
            <select
              value={planForm.billingPeriod}
              onChange={(e) => setPlanForm({ ...planForm, billingPeriod: e.target.value })}
              className="form-select"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="Plan description (optional)"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
