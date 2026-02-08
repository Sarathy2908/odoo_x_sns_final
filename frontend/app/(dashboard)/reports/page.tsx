'use client';

import { useEffect, useState } from 'react';
import { reportsAPI, churnAPI } from '@/lib/api';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

type TabKey = 'overview' | 'subscriptions' | 'revenue' | 'payments' | 'churn';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [churnActionLoading, setChurnActionLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: TabKey) => {
    setLoading(true);
    try {
      let result;
      switch (tab) {
        case 'overview':
          result = await reportsAPI.getDashboard();
          break;
        case 'subscriptions':
          result = await reportsAPI.getSubscriptions();
          break;
        case 'revenue':
          result = await reportsAPI.getRevenue();
          break;
        case 'payments':
          result = await reportsAPI.getPayments();
          break;
        case 'churn':
          result = await churnAPI.getAtRisk().catch(() => []);
          break;
      }
      setData(result);
    } catch (error: any) {
      showToast(error.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'payments', label: 'Payments' },
    { key: 'churn', label: 'Churn Analysis' },
  ];

  const renderOverview = () => {
    if (!data) return null;
    const metrics = [
      { label: 'Active Subscriptions', value: data.activeSubscriptions || 0, border: 'border-l-blue-500' },
      { label: 'Total Revenue', value: `\u20B9${(data.totalRevenue || 0).toLocaleString()}`, border: 'border-l-emerald-500' },
      { label: 'Pending Revenue', value: `\u20B9${(data.pendingRevenue || 0).toLocaleString()}`, border: 'border-l-amber-500' },
      { label: 'Overdue Invoices', value: data.overdueInvoices || 0, border: 'border-l-red-500' },
      { label: 'Total Payments', value: data.totalPayments || 0, border: 'border-l-indigo-500' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className={`card border-l-4 ${metric.border} p-5`}>
            <p className="text-sm font-medium text-gray-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderSubscriptions = () => {
    if (!data) return null;
    const statusData = Array.isArray(data) ? data : data.byStatus || [];

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {statusData.map((item: any, i: number) => {
              const total = statusData.reduce((sum: number, s: any) => sum + (Number(s.count) || Number(s._count?.id) || 0), 0);
              const count = Number(item.count) || Number(item._count?.id) || 0;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
              return (
                <tr key={i}>
                  <td className="font-medium text-gray-900">{item.status || item.name || '-'}</td>
                  <td>{count}</td>
                  <td>{pct}%</td>
                </tr>
              );
            })}
            {statusData.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No subscription data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRevenue = () => {
    if (!data) return null;
    const revenueData = Array.isArray(data) ? data : data.monthly || [];

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Revenue</th>
              <th>Invoices</th>
            </tr>
          </thead>
          <tbody>
            {revenueData.map((item: any, i: number) => (
              <tr key={i}>
                <td className="font-medium text-gray-900">{item.month || item.period || item.name || '-'}</td>
                <td className="text-emerald-600 font-medium">{'\u20B9'}{Number(item.revenue || item.total || item.amount || 0).toLocaleString('en-IN')}</td>
                <td>{item.invoiceCount || item.count || '-'}</td>
              </tr>
            ))}
            {revenueData.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No revenue data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPayments = () => {
    if (!data) return null;
    const paymentData = Array.isArray(data) ? data : data.byMethod || [];

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Count</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((item: any, i: number) => (
              <tr key={i}>
                <td className="font-medium text-gray-900">
                  {(item.paymentMethod || item.method || item.name || '-').replace(/_/g, ' ')}
                </td>
                <td>{item.count || item._count?.id || 0}</td>
                <td className="text-emerald-600 font-medium">
                  {'\u20B9'}{Number(item.total || item._sum?.amount || item.amount || item.totalAmount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
            {paymentData.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No payment data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const handleTrainModel = async () => {
    setChurnActionLoading(true);
    try {
      const result = await churnAPI.train();
      showToast(result.message || 'Model trained successfully', 'success');
      loadTabData('churn');
    } catch (error: any) {
      showToast(error.message || 'Failed to train model', 'error');
    } finally {
      setChurnActionLoading(false);
    }
  };

  const handleRunPredictions = async () => {
    setChurnActionLoading(true);
    try {
      const result = await churnAPI.predictAll();
      showToast(result.message || 'Predictions completed', 'success');
      loadTabData('churn');
    } catch (error: any) {
      showToast(error.message || 'Failed to run predictions', 'error');
    } finally {
      setChurnActionLoading(false);
    }
  };

  const renderChurn = () => {
    const atRiskList = Array.isArray(data) ? data : [];

    // Count by risk level
    const riskCounts: Record<string, number> = {};
    atRiskList.forEach((sub: any) => {
      riskCounts[sub.churnRisk] = (riskCounts[sub.churnRisk] || 0) + 1;
    });

    return (
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTrainModel}
            disabled={churnActionLoading}
            className="btn-primary"
          >
            {churnActionLoading ? 'Processing...' : 'Train Model'}
          </button>
          <button
            onClick={handleRunPredictions}
            disabled={churnActionLoading}
            className="btn-secondary"
          >
            {churnActionLoading ? 'Processing...' : 'Run Predictions'}
          </button>
        </div>

        {/* Risk Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Critical Risk', 'High Risk', 'Moderate Risk', 'Low Risk'].map(level => (
            <div key={level} className={`card p-4 border-l-4 ${
              level === 'Critical Risk' ? 'border-l-red-500' :
              level === 'High Risk' ? 'border-l-orange-500' :
              level === 'Moderate Risk' ? 'border-l-yellow-500' :
              'border-l-emerald-500'
            }`}>
              <p className="text-sm text-gray-500">{level}</p>
              <p className="text-2xl font-bold text-gray-900">{riskCounts[level] || 0}</p>
            </div>
          ))}
        </div>

        {/* At-Risk List */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subscription</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Risk Level</th>
                <th>Top Factor</th>
                <th>Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {atRiskList.map((sub: any) => (
                <tr key={sub.id}>
                  <td className="font-mono text-sm font-medium text-gray-900">{sub.subscriptionNumber}</td>
                  <td>{sub.customerName}</td>
                  <td>
                    <span>{sub.planName}</span>
                    <span className="block text-xs text-gray-500">
                      {'\u20B9'}{Number(sub.planPrice).toLocaleString('en-IN')} / {sub.billingPeriod?.toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sub.churnRisk === 'Critical Risk' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>{sub.churnRisk}</span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {sub.churnFactors?.[0]?.factor || '-'}
                    {sub.churnFactors?.[0]?.detail && (
                      <span className="block text-xs text-gray-400">{sub.churnFactors[0].detail}</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-500">
                    {sub.lastChurnCheck ? new Date(sub.lastChurnCheck).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {atRiskList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No at-risk subscriptions found. Run "Train Model" then "Run Predictions" to analyze churn risk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabContent: Record<TabKey, () => React.ReactNode> = {
    overview: renderOverview,
    subscriptions: renderSubscriptions,
    revenue: renderRevenue,
    payments: renderPayments,
    churn: renderChurn,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingSpinner message="Loading report..." />
      ) : (
        tabContent[activeTab]()
      )}
    </div>
  );
}
