const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Get token from localStorage
const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Set token in localStorage
export const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
    }
};

// Remove token from localStorage
export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// Get user from localStorage
export const getUser = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

// Set user in localStorage
export const setUser = (user: any) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
    }
};

// API request wrapper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
};

// Auth API
export const authAPI = {
    signup: (data: any) => apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    login: (data: any) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    requestPasswordReset: (email: string) => apiRequest('/auth/reset-password-request', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    resetPassword: (token: string, newPassword: string) => apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
    }),
    getCurrentUser: () => apiRequest('/auth/me'),
};

// Products API
export const productsAPI = {
    getAll: () => apiRequest('/products'),
    getOne: (id: string) => apiRequest(`/products/${id}`),
    create: (data: any) => apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/products/${id}`, {
        method: 'DELETE',
    }),
    addVariant: (id: string, data: any) => apiRequest(`/products/${id}/variants`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getVariants: (id: string) => apiRequest(`/products/${id}/variants`),
    updateVariant: (id: string, variantId: string, data: any) => apiRequest(`/products/${id}/variants/${variantId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteVariant: (id: string, variantId: string) => apiRequest(`/products/${id}/variants/${variantId}`, {
        method: 'DELETE',
    }),
    getAttributeLines: (id: string) => apiRequest(`/products/${id}/attributes`),
    addAttributeLine: (id: string, data: any) => apiRequest(`/products/${id}/attributes`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    deleteAttributeLine: (id: string, lineId: string) => apiRequest(`/products/${id}/attributes/${lineId}`, {
        method: 'DELETE',
    }),
};

// Plans API
export const plansAPI = {
    getAll: () => apiRequest('/plans'),
    getOne: (id: string) => apiRequest(`/plans/${id}`),
    create: (data: any) => apiRequest('/plans', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/plans/${id}`, {
        method: 'DELETE',
    }),
};

// Subscriptions API
export const subscriptionsAPI = {
    getAll: () => apiRequest('/subscriptions'),
    getOne: (id: string) => apiRequest(`/subscriptions/${id}`),
    create: (data: any) => apiRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: string) => apiRequest(`/subscriptions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),
    addLine: (id: string, data: any) => apiRequest(`/subscriptions/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/subscriptions/${id}`, {
        method: 'DELETE',
    }),
    deleteLine: (id: string, lineId: string) => apiRequest(`/subscriptions/${id}/lines/${lineId}`, {
        method: 'DELETE',
    }),
    renew: (id: string) => apiRequest(`/subscriptions/${id}/renew`, {
        method: 'POST',
    }),
    upsell: (id: string, additionalLines: any[]) => apiRequest(`/subscriptions/${id}/upsell`, {
        method: 'POST',
        body: JSON.stringify({ additionalLines }),
    }),
    getHistory: (id: string) => apiRequest(`/subscriptions/${id}/history`),
};

// Invoices API
export const invoicesAPI = {
    getAll: (params?: { status?: string; search?: string }) => {
        const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
        return apiRequest(`/invoices${query}`);
    },
    getOne: (id: string) => apiRequest(`/invoices/${id}`),
    generate: (subscriptionId: string, data?: any) => apiRequest(`/invoices/generate/${subscriptionId}`, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    }),
    update: (id: string, data: any) => apiRequest(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    confirm: (id: string) => apiRequest(`/invoices/${id}/confirm`, {
        method: 'PUT',
    }),
    cancel: (id: string) => apiRequest(`/invoices/${id}/cancel`, {
        method: 'PUT',
    }),
    addLine: (id: string, data: any) => apiRequest(`/invoices/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    deleteLine: (id: string, lineId: string) => apiRequest(`/invoices/${id}/lines/${lineId}`, {
        method: 'DELETE',
    }),
};

// Payments API
export const paymentsAPI = {
    getAll: () => apiRequest('/payments'),
    getOne: (id: string) => apiRequest(`/payments/${id}`),
    create: (data: any) => apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// Taxes API
export const taxesAPI = {
    getAll: () => apiRequest('/taxes'),
    getOne: (id: string) => apiRequest(`/taxes/${id}`),
    create: (data: any) => apiRequest('/taxes', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    suggest: (data: any) => apiRequest('/taxes/suggest', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    calculate: (data: any) => apiRequest('/taxes/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/taxes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/taxes/${id}`, {
        method: 'DELETE',
    }),
};

// Discounts API
export const discountsAPI = {
    getAll: () => apiRequest('/discounts'),
    getOne: (id: string) => apiRequest(`/discounts/${id}`),
    create: (data: any) => apiRequest('/discounts', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/discounts/${id}`, {
        method: 'DELETE',
    }),
};

// Quotations API
export const quotationsAPI = {
    getAll: () => apiRequest('/quotations'),
    getOne: (id: string) => apiRequest(`/quotations/${id}`),
    create: (data: any) => apiRequest('/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/quotations/${id}`, {
        method: 'DELETE',
    }),
    addLine: (id: string, data: any) => apiRequest(`/quotations/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateLine: (id: string, lineId: string, data: any) => apiRequest(`/quotations/${id}/lines/${lineId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteLine: (id: string, lineId: string) => apiRequest(`/quotations/${id}/lines/${lineId}`, {
        method: 'DELETE',
    }),
    createSubscription: (id: string, data: any) => apiRequest(`/quotations/${id}/create-subscription`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// Users API
export const usersAPI = {
    getAll: (params?: { role?: string }) => {
        const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
        return apiRequest(`/users${query}`);
    },
    getOne: (id: string) => apiRequest(`/users/${id}`),
    createInternal: (data: any) => apiRequest('/users/internal', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/users/${id}`, {
        method: 'DELETE',
    }),
    changeRole: (id: string, role: string) => apiRequest(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    }),
};

// Reports API
export const reportsAPI = {
    getDashboard: () => apiRequest('/reports/dashboard'),
    getSubscriptions: () => apiRequest('/reports/subscriptions'),
    getRevenue: () => apiRequest('/reports/revenue'),
    getPayments: () => apiRequest('/reports/payments'),
    getOverdueInvoices: () => apiRequest('/reports/overdue-invoices'),
};

// Razorpay API
export const razorpayAPI = {
    createOrder: (subscriptionId: string) => apiRequest('/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId }),
    }),
    verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        apiRequest('/razorpay/verify-payment', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Contacts API
export const contactsAPI = {
    getAll: (params?: { search?: string; contactType?: string; isCustomer?: string; isVendor?: string; portalOnly?: string }) => {
        const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString() : '';
        return apiRequest(`/contacts${query}`);
    },
    getOne: (id: string) => apiRequest(`/contacts/${id}`),
    create: (data: any) => apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/contacts/${id}`, {
        method: 'DELETE',
    }),
    getChildren: (id: string) => apiRequest(`/contacts/${id}/children`),
};

// Attributes API
export const attributesAPI = {
    getAll: () => apiRequest('/attributes'),
    getOne: (id: string) => apiRequest(`/attributes/${id}`),
    create: (data: any) => apiRequest('/attributes', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/attributes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/attributes/${id}`, {
        method: 'DELETE',
    }),
    addValue: (id: string, data: any) => apiRequest(`/attributes/${id}/values`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateValue: (id: string, valueId: string, data: any) => apiRequest(`/attributes/${id}/values/${valueId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteValue: (id: string, valueId: string) => apiRequest(`/attributes/${id}/values/${valueId}`, {
        method: 'DELETE',
    }),
};

// PDF API
export const pdfAPI = {
    generateInvoice: (invoiceId: string) => apiRequest(`/pdf/invoice/${invoiceId}`, { method: 'POST' }),
    generateQuotation: (templateId: string) => apiRequest(`/pdf/quotation/${templateId}`, { method: 'POST' }),
};

// Portal API
export const portalAPI = {
    getDashboard: () => apiRequest('/portal/dashboard'),
    getCatalog: (params?: { search?: string; category?: string; productType?: string }) => {
        const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
        return apiRequest(`/portal/catalog${query}`);
    },
    getSubscriptions: () => apiRequest('/portal/subscriptions'),
    getSubscription: (id: string) => apiRequest(`/portal/subscriptions/${id}`),
    getInvoices: () => apiRequest('/portal/invoices'),
    getInvoice: (id: string) => apiRequest(`/portal/invoices/${id}`),
    getPayments: () => apiRequest('/portal/payments'),
    getProfile: () => apiRequest('/portal/profile'),
    updateProfile: (data: any) => apiRequest('/portal/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    subscribe: (planId: string) => apiRequest('/portal/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId }),
    }),
};
