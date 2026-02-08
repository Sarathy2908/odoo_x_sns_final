'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { discountsAPI } from '@/lib/api';

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

    // Discount state
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{
        id: string;
        name: string;
        type: string;
        value: number;
        description?: string;
        discountAmount: number;
    } | null>(null);
    const [discountError, setDiscountError] = useState('');
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('portal_cart');
        if (stored) {
            try { setItems(JSON.parse(stored)); } catch { setItems([]); }
        }
        // Load previously applied discount
        const storedDiscount = localStorage.getItem('portal_discount');
        if (storedDiscount) {
            try {
                const parsed = JSON.parse(storedDiscount);
                setAppliedDiscount(parsed);
                setDiscountCode(parsed.name);
            } catch { /* ignore */ }
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

    const subtotal = items.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const discountAmount = appliedDiscount?.discountAmount || 0;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = Math.round(discountedSubtotal * 0.18 * 100) / 100;
    const total = Math.round((discountedSubtotal + tax) * 100) / 100;

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;
        setValidating(true);
        setDiscountError('');
        try {
            const result = await discountsAPI.validateCode(discountCode.trim(), subtotal);
            const discount = {
                id: result.discount.id,
                name: result.discount.name,
                type: result.discount.type,
                value: result.discount.value,
                description: result.discount.description,
                discountAmount: result.discountAmount,
            };
            setAppliedDiscount(discount);
            localStorage.setItem('portal_discount', JSON.stringify(discount));
        } catch (err: any) {
            setDiscountError(err.message || 'Invalid discount code');
            setAppliedDiscount(null);
            localStorage.removeItem('portal_discount');
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
        localStorage.removeItem('portal_discount');
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Shopping Cart</h1>

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
                        <div className="space-y-3 text-sm mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                                <span className="font-medium text-gray-900">{'\u20B9'}{subtotal.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Discount Code Section */}
                            {!appliedDiscount ? (
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={discountCode}
                                            onChange={(e) => {
                                                setDiscountCode(e.target.value);
                                                setDiscountError('');
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                                            placeholder="Enter discount code"
                                            className="min-w-0 flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={handleApplyDiscount}
                                            disabled={validating || !discountCode.trim()}
                                            className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {validating ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {discountError && (
                                        <p className="text-xs text-red-500 mt-1">{discountError}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600 font-medium">{appliedDiscount.name}</span>
                                            <span className="text-xs text-gray-400">
                                                ({appliedDiscount.type === 'PERCENTAGE'
                                                    ? `${appliedDiscount.value}%`
                                                    : `\u20B9${appliedDiscount.value.toLocaleString('en-IN')}`})
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleRemoveDiscount}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-green-600">Discount</span>
                                        <span className="text-green-600 font-medium">-{'\u20B9'}{discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-gray-500">GST (18%)</span>
                                <span className="text-gray-900">{'\u20B9'}{tax.toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex justify-between pt-3 border-t border-gray-100">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-gray-900">{'\u20B9'}{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

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
