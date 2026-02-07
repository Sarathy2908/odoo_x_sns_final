'use client';

import { useEffect, useState } from 'react';
import { productsAPI, attributesAPI, getUser } from '@/lib/api';
import FormModal from '@/app/components/FormModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [allAttributes, setAllAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState({ attribute: '', value: '', extraPrice: '0' });
  const [addingVariant, setAddingVariant] = useState(false);
  const [attrLineForm, setAttrLineForm] = useState({ attributeId: '', attributeValueId: '' });
  const [addingAttrLine, setAddingAttrLine] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', productType: 'Service',
    salesPrice: '', costPrice: '', recurringPrice: '', recurringPeriod: '', category: '',
  });
  const { showToast } = useToast();
  const user = getUser();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => { loadProducts(); loadAttributes(); }, []);

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      setProducts(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to load products', 'error');
    } finally { setLoading(false); }
  };

  const loadAttributes = async () => {
    try {
      const data = await attributesAPI.getAll();
      setAllAttributes(data);
    } catch { /* silent */ }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', productType: 'Service', salesPrice: '', costPrice: '', recurringPrice: '', recurringPeriod: '', category: '' });
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      productType: product.productType,
      salesPrice: String(product.salesPrice),
      costPrice: String(product.costPrice),
      recurringPrice: product.recurringPrice ? String(product.recurringPrice) : '',
      recurringPeriod: product.recurringPeriod || '',
      category: product.category || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.salesPrice || !formData.costPrice) {
      showToast('Name, sales price, and cost price are required', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        salesPrice: parseFloat(formData.salesPrice),
        costPrice: parseFloat(formData.costPrice),
        recurringPrice: formData.recurringPrice ? parseFloat(formData.recurringPrice) : null,
        recurringPeriod: formData.recurringPeriod || null,
        category: formData.category || null,
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
        showToast('Product updated', 'success');
      } else {
        await productsAPI.create(payload);
        showToast('Product created', 'success');
      }
      setShowModal(false);
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to save product', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsAPI.delete(deleteTarget.id);
      showToast('Product deleted', 'success');
      setDeleteTarget(null);
      if (expandedProduct === deleteTarget.id) setExpandedProduct(null);
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete product', 'error');
    } finally { setDeleting(false); }
  };

  const handleAddVariant = async (productId: string) => {
    if (!variantForm.attribute || !variantForm.value) {
      showToast('Attribute and value are required', 'error'); return;
    }
    setAddingVariant(true);
    try {
      await productsAPI.addVariant(productId, variantForm);
      showToast('Variant added', 'success');
      setVariantForm({ attribute: '', value: '', extraPrice: '0' });
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to add variant', 'error');
    } finally { setAddingVariant(false); }
  };

  const handleDeleteVariant = async (productId: string, variantId: string) => {
    try {
      await productsAPI.deleteVariant(productId, variantId);
      showToast('Variant removed', 'success');
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete variant', 'error');
    }
  };

  const handleAddAttrLine = async (productId: string) => {
    if (!attrLineForm.attributeId || !attrLineForm.attributeValueId) {
      showToast('Select an attribute and value', 'error'); return;
    }
    setAddingAttrLine(true);
    try {
      await productsAPI.addAttributeLine(productId, attrLineForm);
      showToast('Attribute linked', 'success');
      setAttrLineForm({ attributeId: '', attributeValueId: '' });
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to link attribute', 'error');
    } finally { setAddingAttrLine(false); }
  };

  const handleDeleteAttrLine = async (productId: string, lineId: string) => {
    try {
      await productsAPI.deleteAttributeLine(productId, lineId);
      showToast('Attribute removed', 'success');
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove attribute', 'error');
    }
  };

  const selectedAttrValues = attrLineForm.attributeId
    ? allAttributes.find((a: any) => a.id === attrLineForm.attributeId)?.values || []
    : [];

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.productType === filterType;
    const matchCategory = !filterCategory || p.category === filterCategory;
    return matchSearch && matchType && matchCategory;
  });

  if (loading) return <LoadingSpinner message="Loading products..." />;

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = { Service: 'badge-active', Physical: 'badge-confirmed', Digital: 'badge-quotation' };
    return <span className={styles[type] || 'badge-draft'}>{type}</span>;
  };

  const periodLabel: Record<string, string> = { DAILY: '/day', WEEKLY: '/week', MONTHLY: '/month', YEARLY: '/year' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        {isAdmin && (
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input flex-1" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="form-select w-40">
          <option value="">All Types</option>
          <option value="Service">Service</option>
          <option value="Physical">Physical</option>
          <option value="Digital">Digital</option>
        </select>
        {categories.length > 0 && (
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select w-40">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Product Cards */}
      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedProduct === product.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    {typeBadge(product.productType)}
                    {product.category && <span className="badge bg-gray-100 text-gray-600">{product.category}</span>}
                  </div>
                  {product.description && <p className="text-sm text-gray-500 truncate mt-0.5">{product.description}</p>}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-gray-500">Sales Price</p>
                    <p className="font-semibold text-gray-900">{'\u20B9'}{Number(product.salesPrice).toFixed(2)}</p>
                  </div>
                  {product.recurringPrice && (
                    <div className="text-right">
                      <p className="text-gray-500">Recurring</p>
                      <p className="font-semibold text-emerald-600">
                        {'\u20B9'}{Number(product.recurringPrice).toFixed(2)}
                        <span className="text-xs font-normal text-gray-500">{periodLabel[product.recurringPeriod] || ''}</span>
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-gray-500">Cost</p>
                    <p className="font-medium text-gray-700">{'\u20B9'}{Number(product.costPrice).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Variants</p>
                    <p className="font-medium">{product.variants?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Attributes</p>
                    <p className="font-medium">{product.attributes?.length || 0}</p>
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEditModal(product)} className="btn-secondary btn-sm">Edit</button>
                  <button onClick={() => setDeleteTarget(product)} className="btn-danger btn-sm">Delete</button>
                </div>
              )}
            </div>

            {/* Expanded Detail */}
            {expandedProduct === product.id && (
              <div className="border-t border-gray-200 p-4 space-y-4">
                {/* Variants Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Variants</h4>
                  <div className="space-y-1">
                    {product.variants?.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-700">{v.attribute}</span>
                          <span className="text-gray-400">{'\u2192'}</span>
                          <span className="text-gray-900">{v.value}</span>
                          {v.extraPrice > 0 && <span className="text-emerald-600 text-xs">+{'\u20B9'}{Number(v.extraPrice).toFixed(2)}</span>}
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDeleteVariant(product.id, v.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                        )}
                      </div>
                    ))}
                    {(!product.variants || product.variants.length === 0) && <p className="text-sm text-gray-500">No variants yet.</p>}
                  </div>
                  {isAdmin && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-end gap-2">
                      <div className="flex-1">
                        <input type="text" placeholder="Attribute (e.g. Color)" value={variantForm.attribute} onChange={(e) => setVariantForm({ ...variantForm, attribute: e.target.value })} className="form-input text-sm" />
                      </div>
                      <div className="flex-1">
                        <input type="text" placeholder="Value (e.g. Red)" value={variantForm.value} onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })} className="form-input text-sm" />
                      </div>
                      <div className="w-28">
                        <input type="number" step="0.01" placeholder="Extra price" value={variantForm.extraPrice} onChange={(e) => setVariantForm({ ...variantForm, extraPrice: e.target.value })} className="form-input text-sm" />
                      </div>
                      <button onClick={() => handleAddVariant(product.id)} disabled={addingVariant} className="btn-primary btn-sm">
                        {addingVariant ? '...' : 'Add'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Attribute Lines Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Linked Attributes</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.attributes?.map((al: any) => (
                      <div key={al.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-sm">
                        <span className="font-medium">{al.attribute?.name}:</span>
                        <span>{al.attributeValue?.value}</span>
                        {al.attributeValue?.extraPrice > 0 && <span className="text-blue-500 text-xs">+{'\u20B9'}{al.attributeValue.extraPrice}</span>}
                        {isAdmin && (
                          <button onClick={() => handleDeleteAttrLine(product.id, al.id)} className="ml-1 text-blue-400 hover:text-red-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {(!product.attributes || product.attributes.length === 0) && <p className="text-sm text-gray-500">No attributes linked.</p>}
                  </div>
                  {isAdmin && allAttributes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="form-label text-xs">Attribute</label>
                        <select
                          value={attrLineForm.attributeId}
                          onChange={(e) => setAttrLineForm({ attributeId: e.target.value, attributeValueId: '' })}
                          className="form-select text-sm"
                        >
                          <option value="">Select Attribute</option>
                          {allAttributes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="form-label text-xs">Value</label>
                        <select
                          value={attrLineForm.attributeValueId}
                          onChange={(e) => setAttrLineForm({ ...attrLineForm, attributeValueId: e.target.value })}
                          className="form-select text-sm"
                          disabled={!attrLineForm.attributeId}
                        >
                          <option value="">Select Value</option>
                          {selectedAttrValues.map((v: any) => <option key={v.id} value={v.id}>{v.value} {v.extraPrice > 0 ? `(+₹${v.extraPrice})` : ''}</option>)}
                        </select>
                      </div>
                      <button onClick={() => handleAddAttrLine(product.id)} disabled={addingAttrLine} className="btn-primary btn-sm">
                        {addingAttrLine ? '...' : 'Link'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="card p-8 text-center text-gray-500">No products found.</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <FormModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'Edit Product' : 'New Product'} onSubmit={handleSubmit} submitLabel={editingProduct ? 'Update' : 'Create'} loading={saving}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Product Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" placeholder="Enter product name" />
            </div>
            <div>
              <label className="form-label">Product Type</label>
              <select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="form-select">
                <option value="Service">Service</option>
                <option value="Physical">Physical</option>
                <option value="Digital">Digital</option>
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input" placeholder="e.g. Software, Hardware" />
            </div>
            <div>
              <label className="form-label">Sales Price *</label>
              <input type="number" required step="0.01" value={formData.salesPrice} onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })} className="form-input" placeholder="0.00" />
            </div>
            <div>
              <label className="form-label">Cost Price *</label>
              <input type="number" required step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} className="form-input" placeholder="0.00" />
            </div>
          </div>

          {/* Recurring Price Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Recurring Pricing (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Recurring Price</label>
                <input type="number" step="0.01" value={formData.recurringPrice} onChange={(e) => setFormData({ ...formData, recurringPrice: e.target.value })} className="form-input" placeholder="0.00" />
              </div>
              <div>
                <label className="form-label">Billing Period</label>
                <select value={formData.recurringPeriod} onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })} className="form-select">
                  <option value="">None</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="form-textarea" rows={3} placeholder="Product description (optional)" />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} title="Delete Product" message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`} confirmLabel="Delete" variant="danger" loading={deleting} />
    </div>
  );
}
