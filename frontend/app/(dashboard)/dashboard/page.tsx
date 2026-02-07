'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportsAPI } from '@/lib/api';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusBadge from '@/app/components/StatusBadge';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await reportsAPI.getDashboard();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const cards = [
    {
      title: 'Active Subscriptions',
      value: metrics?.activeSubscriptions || 0,
      borderColor: 'border-l-blue-500',
      iconBg: 'bg-blue-50 text-blue-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    },
    {
      title: 'Total Revenue',
      value: `\u20B9${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`,
      borderColor: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      title: 'Pending Revenue',
      value: `\u20B9${(metrics?.pendingRevenue || 0).toLocaleString('en-IN')}`,
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      title: 'Overdue Invoices',
      value: metrics?.overdueInvoices || 0,
      borderColor: 'border-l-red-500',
      iconBg: 'bg-red-50 text-red-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    },
    {
      title: 'Total Subscriptions',
      value: metrics?.totalSubscriptions || 0,
      borderColor: 'border-l-indigo-500',
      iconBg: 'bg-indigo-50 text-indigo-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    },
  ];

  // Subscription status breakdown
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    QUOTATION: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-red-100 text-red-700',
  };

  const statusBreakdown = metrics?.subscriptionsByStatus || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`card border-l-4 ${card.borderColor} p-5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {card.icon}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/subscriptions/new')}
            className="btn-primary btn-lg justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Subscription
          </button>
          <button
            onClick={() => router.push('/invoices')}
            className="btn-secondary btn-lg justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Invoices
          </button>
          <button
            onClick={() => router.push('/payments')}
            className="btn-secondary btn-lg justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* Subscription Status Breakdown */}
      {statusBreakdown.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {statusBreakdown.map((item: any) => (
              <div
                key={item.status}
                className={`px-4 py-2.5 rounded-lg ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}
              >
                <span className="text-sm font-medium">{item.status}</span>
                <span className="ml-2 text-lg font-bold">{item._count?.id || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Subscriptions</h2>
            <button
              onClick={() => router.push('/subscriptions')}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {metrics?.recentSubscriptions?.length > 0 ? (
              metrics.recentSubscriptions.map((sub: any) => (
                <div
                  key={sub.id}
                  onClick={() => router.push(`/subscriptions/${sub.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sub.subscriptionNumber}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {sub.customer?.name || '-'} &middot; {sub.plan?.name || '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {sub.plan?.price && (
                      <span className="text-xs text-gray-500">{'\u20B9'}{Number(sub.plan.price).toLocaleString('en-IN')}</span>
                    )}
                    <StatusBadge status={sub.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No subscriptions yet.</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <button
              onClick={() => router.push('/invoices')}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {metrics?.recentInvoices?.length > 0 ? (
              metrics.recentInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {inv.customer?.name || '-'} &middot; {new Date(inv.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      {'\u20B9'}{Number(inv.totalAmount).toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No invoices yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Comparison */}
      {metrics?.monthlyRevenue && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600 font-medium">This Month</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {'\u20B9'}{(metrics.monthlyRevenue.currentMonth || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium">Last Month</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">
                {'\u20B9'}{(metrics.monthlyRevenue.lastMonth || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
