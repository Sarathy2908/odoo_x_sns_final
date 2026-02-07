'use client';

import { useEffect, useState } from 'react';
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

export default function PortalCart() {
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('portal_cart');
        if (stored) {
            try { setItems(JSON.parse(stored)); } catch { setItems([]); }
        }
    }, []);

    const updateCart = (newItems: CartItem[]) => {
        setItems(newItems);
        localStorage.setItem('portal_cart', JSON.stringify(newItems));
    };

    const removeItem = (id: string) => {
        updateCart(items.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        updateCart(items.map(item => item.id === id ? { ...item, quantity: qty } : item));
    };

    const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>

            {items.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    <p className="text-gray-400 mb-3">Your cart is empty</p>
                    <Link href="/portal/catalog" className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {items.map((item) => (
                            <div key={item.id} className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                    <p className="text-sm text-gray-500">{item.planName} — {item.billingPeriod}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">−</button>
                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
                                </div>
                                <p className="text-right font-medium text-gray-900 w-28">₹{(item.amount * item.quantity).toLocaleString('en-IN')}</p>
                                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600">Subtotal ({items.length} items)</span>
                            <span className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">Taxes will be calculated at checkout</p>
                        <div className="flex items-center gap-3">
                            <Link href="/portal/checkout" className="flex-1 px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center">
                                Proceed to Checkout
                            </Link>
                            <Link href="/portal/catalog" className="px-5 py-3 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
