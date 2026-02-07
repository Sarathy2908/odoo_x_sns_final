'use client';

import { useEffect, useState } from 'react';
import { subscriptionsAPI } from '@/lib/api';

const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-500/20 text-gray-300',
    QUOTATION: 'bg-blue-500/20 text-blue-300',
    CONFIRMED: 'bg-yellow-500/20 text-yellow-300',
    ACTIVE: 'bg-green-500/20 text-green-300',
    CLOSED: 'bg-red-500/20 text-red-300',
};

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            const data = await subscriptionsAPI.getAll();
            setSubscriptions(data);
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition transform hover:scale-105">
                    ➕ New Subscription
                </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Subscription #</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Plan</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Start Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 text-white font-mono text-sm">{sub.subscriptionNumber}</td>
                                    <td className="px-6 py-4 text-gray-300">{sub.customer.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{sub.plan.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{new Date(sub.startDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[sub.status]}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {subscriptions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-xl">No subscriptions found</p>
                    <p className="text-sm mt-2">Create your first subscription to get started</p>
                </div>
            )}
        </div>
    );
}
