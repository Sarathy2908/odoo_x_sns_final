'use client';

import Link from 'next/link';

export default function PortalConfirmation() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
                {/* Success Icon */}
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                <p className="text-gray-500 mb-8">
                    Your subscription order has been placed successfully. You will receive a confirmation email shortly with the details of your subscription.
                </p>

                {/* Order Info */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order ID</span>
                            <span className="font-mono font-medium text-gray-900">ORD-{Date.now().toString(36).toUpperCase().slice(-6)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Processing</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="text-gray-900">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                    <Link href="/portal/subscriptions"
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        View Subscriptions
                    </Link>
                    <Link href="/portal"
                        className="px-6 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
