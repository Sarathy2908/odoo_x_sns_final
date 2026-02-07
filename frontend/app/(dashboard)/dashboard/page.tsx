'use client';

import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const cards = [
        {
            title: 'Active Subscriptions',
            value: metrics?.activeSubscriptions || 0,
            icon: '📋',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'Total Revenue',
            value: `$${(metrics?.totalRevenue || 0).toLocaleString()}`,
            icon: '💰',
            color: 'from-green-500 to-emerald-500',
        },
        {
            title: 'Pending Revenue',
            value: `$${(metrics?.pendingRevenue || 0).toLocaleString()}`,
            icon: '⏳',
            color: 'from-yellow-500 to-orange-500',
        },
        {
            title: 'Overdue Invoices',
            value: metrics?.overdueInvoices || 0,
            icon: '⚠️',
            color: 'from-red-500 to-pink-500',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-20 rounded-full -mr-16 -mt-16`}></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-4xl">{card.icon}</span>
                                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                                    {card.icon}
                                </div>
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-2">{card.title}</h3>
                            <p className="text-white text-3xl font-bold">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-white font-semibold transition transform hover:scale-105">
                        ➕ New Subscription
                    </button>
                    <button className="p-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-xl text-white font-semibold transition transform hover:scale-105">
                        🧾 Generate Invoice
                    </button>
                    <button className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition transform hover:scale-105">
                        💳 Record Payment
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">System Overview</h3>
                <div className="space-y-4 text-gray-300">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <span>Total Payments Recorded</span>
                        <span className="font-bold text-white">{metrics?.totalPayments || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <span>System Status</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">Operational</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
