'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionsAPI, plansAPI, churnAPI } from '@/lib/api';
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
  { key: 'AT_RISK', label: 'At Risk' },
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
  const [runningChurn, setRunningChurn] = useState(false);
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

  const handleRunChurnAnalysis = async () => {
    setRunningChurn(true);
    try {
      const result = await churnAPI.predictAll();
      showToast(result.message || 'Churn analysis completed', 'success');
      loadSubscriptions();
    } catch (error: any) {
      showToast(error.message || 'Failed to run churn analysis', 'error');
    } finally {
      setRunningChurn(false);
    }
  };

  const statusCounts = subscriptions.reduce((acc: Record<string, number>, sub) => {
    acc[sub.status] = (acc[sub.status] || 0) + 1;
    return acc;
  }, {});

  const atRiskCount = subscriptions.filter(sub =>
    sub.churnRisk === 'High Risk' || sub.churnRisk === 'Critical Risk'
  ).length;

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesTab = activeTab === 'ALL'
      || (activeTab === 'AT_RISK' ? (sub.churnRisk === 'High Risk' || sub.churnRisk === 'Critical Risk') : sub.status === activeTab);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Subscriptions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunChurnAnalysis}
            disabled={runningChurn}
            className="btn-secondary text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">{runningChurn ? 'Analyzing...' : 'Churn Analysis'}</span>
            <span className="sm:hidden">{runningChurn ? '...' : 'Churn'}</span>
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="btn-secondary text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Plan</span>
            <span className="sm:hidden">Plan</span>
          </button>
          <button
            onClick={() => router.push('/subscriptions/new')}
            className="btn-primary text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Subscription</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'ALL' ? subscriptions.length : tab.key === 'AT_RISK' ? atRiskCount : (statusCounts[tab.key] || 0);
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
              <th>Churn Risk</th>
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
                  {sub.churnRisk ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sub.churnRisk === 'Low Risk' ? 'bg-emerald-100 text-emerald-700' :
                      sub.churnRisk === 'Moderate Risk' ? 'bg-yellow-100 text-yellow-700' :
                      sub.churnRisk === 'High Risk' ? 'bg-orange-100 text-orange-700' :
                      sub.churnRisk === 'Critical Risk' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{sub.churnRisk}</span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
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
                <td colSpan={9} className="text-center py-12">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-500 px-1">
          <span>
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3 flex-wrap">
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
