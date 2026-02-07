'use client';

import { useEffect, useState } from 'react';
import { portalAPI } from '@/lib/api';

interface CartItem {
    id: string;
    name: string;
    planName: string;
    planId: string;
    billingPeriod: string;
    amount: number;
    quantity: number;
}

export default function PortalCatalog() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [productType, setProductType] = useState('');
    const [category, setCategory] = useState('');
    const [productTypes, setProductTypes] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

    useEffect(() => {
        loadCatalog();
    }, [search, productType, category]);

    const loadCatalog = async () => {
        try {
            const res = await portalAPI.getCatalog({ search: search || undefined, productType: productType || undefined, category: category || undefined });
            const items = res.products || res;
            setProducts(Array.isArray(items) ? items : []);
            if (res.productTypes) setProductTypes(res.productTypes);
            if (res.categories) setCategories(res.categories);
        } catch (err) {
            console.error('Failed to load catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: any) => {
        const stored = localStorage.getItem('portal_cart');
        let cart: CartItem[] = [];
        if (stored) {
            try { cart = JSON.parse(stored); } catch { cart = []; }
        }

        const existingIndex = cart.findIndex(item => item.id === product.id);
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                planName: product.recurringPeriod ? `${product.recurringPeriod} Plan` : 'One-time',
                planId: '',
                billingPeriod: product.recurringPeriod || 'ONE_TIME',
                amount: product.salesPrice || 0,
                quantity: 1,
            });
        }

        localStorage.setItem('portal_cart', JSON.stringify(cart));
        setToast({ type: 'success', message: `${product.name} added to cart!` });
        setTimeout(() => setToast(null), 2000);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm shadow-lg ${
                    toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>{toast.message}</div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
                />
                {productTypes.length > 0 && (
                    <select
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">All Types</option>
                        {productTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                )}
                {categories.length > 0 && (
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No products found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((product: any) => (
                        <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                        {product.category && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{product.category}</span>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        product.productType === 'Service' ? 'bg-blue-50 text-blue-700' : product.productType === 'Digital' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                                    }`}>{product.productType}</span>
                                </div>
                                {product.description && (
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
                                )}
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-900">₹{Number(product.salesPrice).toLocaleString('en-IN')}</span>
                                    {product.recurringPrice && (
                                        <span className="text-sm text-gray-500">
                                            + ₹{Number(product.recurringPrice).toLocaleString('en-IN')}/{product.recurringPeriod?.toLowerCase() || 'mo'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Variants */}
                            {product.variants?.length > 0 && (
                                <div className="px-5 pb-3">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Variants</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.map((v: any) => (
                                            <span key={v.id} className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                                                {v.attribute}: {v.value}
                                                {v.extraPrice > 0 && ` (+₹${Number(v.extraPrice).toLocaleString('en-IN')})`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add to Cart */}
                            <div className="px-5 pb-5 pt-2">
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
