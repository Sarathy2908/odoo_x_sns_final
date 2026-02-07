const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    updateStatus: (id: string, status: string) => apiRequest(`/subscriptions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    }),
    addLine: (id: string, data: any) => apiRequest(`/subscriptions/${id}/lines`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// Invoices API
export const invoicesAPI = {
    getAll: () => apiRequest('/invoices'),
    getOne: (id: string) => apiRequest(`/invoices/${id}`),
    generate: (subscriptionId: string) => apiRequest(`/invoices/generate/${subscriptionId}`, {
        method: 'POST',
    }),
    confirm: (id: string) => apiRequest(`/invoices/${id}/confirm`, {
        method: 'PUT',
    }),
    cancel: (id: string) => apiRequest(`/invoices/${id}/cancel`, {
        method: 'PUT',
    }),
};

// Payments API
export const paymentsAPI = {
    getAll: () => apiRequest('/payments'),
    create: (data: any) => apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// Taxes API
export const taxesAPI = {
    getAll: () => apiRequest('/taxes'),
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
    create: (data: any) => apiRequest('/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/quotations/${id}`, {
        method: 'DELETE',
    }),
};

// Users API
export const usersAPI = {
    getAll: () => apiRequest('/users'),
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
};
