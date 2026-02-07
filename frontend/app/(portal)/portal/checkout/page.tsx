'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
    id: string;
    name: string;
    planName: string;
    planId: string;
    billingPeriod: string;
    amount: number;
    quantity: number;
}

export default function PortalCheckout() {
    const router = useRouter();
    const [items, setItems] = useState<CartItem[]>([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('portal_cart');
        if (stored) {
            try { setItems(JSON.parse(stored)); } catch { setItems([]); }
        }
    }, []);

    const subtotal = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;

    const handlePlaceOrder = async () => {
        setProcessing(true);
        // Simulate order processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        localStorage.removeItem('portal_cart');
        router.push('/portal/confirmation');
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 mb-3">No items in cart</p>
                <Link href="/portal/catalog" className="text-sm text-blue-600 hover:text-blue-700">Browse catalog →</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <Link href="/portal/cart" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">← Back to cart</Link>
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">Order Summary</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {items.map((item) => (
                                <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.planName} — {item.billingPeriod} x {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-gray-900">₹{(item.amount * item.quantity).toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer">
                                <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Online Payment (Razorpay)</p>
                                    <p className="text-xs text-gray-500">UPI, Cards, Net Banking</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                                <input type="radio" name="payment" className="w-4 h-4 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Bank Transfer</p>
                                    <p className="text-xs text-gray-500">Manual bank transfer</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Price Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
                        <h2 className="font-semibold text-gray-900 mb-4">Price Details</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">GST (18%)</span>
                                <span className="text-gray-900">₹{tax.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-gray-100">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={processing}
                            className="w-full mt-5 px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                `Pay ₹${total.toLocaleString('en-IN')}`
                            )}
                        </button>
                        <p className="text-xs text-gray-400 text-center mt-3">Secure payment via Razorpay</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
