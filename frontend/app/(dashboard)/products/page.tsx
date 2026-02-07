'use client';

import { useEffect, useState } from 'react';
import { productsAPI } from '@/lib/api';
import { getUser } from '@/lib/api';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        productType: 'Service',
        salesPrice: '',
        costPrice: '',
    });
    const user = getUser();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productsAPI.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await productsAPI.create(formData);
            setShowForm(false);
            setFormData({ name: '', description: '', productType: 'Service', salesPrice: '', costPrice: '' });
            loadProducts();
        } catch (error) {
            console.error('Failed to create product:', error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Products</h2>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
                    >
                        ➕ Add Product
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">New Product</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Product Type</label>
                            <select
                                value={formData.productType}
                                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Service">Service</option>
                                <option value="Physical">Physical</option>
                                <option value="Digital">Digital</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Sales Price</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.salesPrice}
                                onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cost Price</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-4">
                            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                                Create Product
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:scale-105 transition-transform">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{product.name}</h3>
                                <span className="inline-block mt-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
                                    {product.productType}
                                </span>
                            </div>
                            <span className="text-2xl">📦</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{product.description || 'No description'}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div>
                                <p className="text-gray-400 text-xs">Sales Price</p>
                                <p className="text-white font-bold text-lg">${product.salesPrice}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">Cost Price</p>
                                <p className="text-gray-300 font-semibold">${product.costPrice}</p>
                            </div>
                        </div>
                        {product.variants && product.variants.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-gray-400 text-xs mb-2">{product.variants.length} variant(s)</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-xl">No products found</p>
                    <p className="text-sm mt-2">Create your first product to get started</p>
                </div>
            )}
        </div>
    );
}
