import { Response } from 'express';
import { PrismaClient, SubscriptionStatus, InvoiceStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get dashboard metrics
export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        // Active subscriptions
        const activeSubscriptions = await prisma.subscription.count({
            where: {
                ...where,
                status: SubscriptionStatus.ACTIVE,
            },
        });

        // Total revenue
        const invoices = await prisma.invoice.findMany({
            where: req.user!.role === UserRole.PORTAL_USER
                ? { customerId: req.user!.id }
                : {},
            select: {
                invoiceDate: true,
                totalAmount: true,
                paidAmount: true,
                status: true,
            },
        });

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const pendingRevenue = invoices
            .filter(inv => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED)
            .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

        // Overdue invoices
        const overdueInvoices = await prisma.invoice.count({
            where: {
                ...(req.user!.role === UserRole.PORTAL_USER ? { customerId: req.user!.id } : {}),
                status: InvoiceStatus.CONFIRMED,
                dueDate: {
                    lt: new Date(),
                },
            },
        });

        // Total payments count
        const totalPayments = await prisma.payment.count({
            where: req.user!.role === UserRole.PORTAL_USER
                ? { customerId: req.user!.id }
                : {},
        });

        // Total subscriptions
        const totalSubscriptions = await prisma.subscription.count({ where });

        // Subscriptions by status
        const subscriptionsByStatus = await prisma.subscription.groupBy({
            by: ['status'],
            where,
            _count: { id: true },
        });

        // Recent subscriptions (last 5)
        const recentSubscriptions = await prisma.subscription.findMany({
            where,
            include: {
                customer: { select: { name: true } },
                plan: { select: { name: true, price: true, billingPeriod: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Recent invoices (last 5)
        const recentInvoices = await prisma.invoice.findMany({
            where: req.user!.role === UserRole.PORTAL_USER
                ? { customerId: req.user!.id }
                : {},
            include: {
                customer: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Monthly revenue: current month vs last month
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const currentMonthInvoices = invoices.filter(
            inv => new Date(inv.invoiceDate || now) >= currentMonthStart
        );
        const lastMonthInvoices = invoices.filter(
            inv => {
                const d = new Date(inv.invoiceDate || now);
                return d >= lastMonthStart && d < currentMonthStart;
            }
        );

        const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        res.json({
            activeSubscriptions,
            totalSubscriptions,
            totalRevenue,
            pendingRevenue,
            overdueInvoices,
            totalPayments,
            subscriptionsByStatus,
            recentSubscriptions,
            recentInvoices,
            monthlyRevenue: { currentMonth: currentMonthRevenue, lastMonth: lastMonthRevenue },
        });
    } catch (error) {
        console.error('Get dashboard metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get subscription report
export const getSubscriptionReport = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        const subscriptions = await prisma.subscription.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true,
            },
        });

        res.json(subscriptions);
    } catch (error) {
        console.error('Get subscription report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get revenue report
export const getRevenueReport = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        const invoices = await prisma.invoice.findMany({
            where,
            select: {
                invoiceDate: true,
                totalAmount: true,
                paidAmount: true,
                status: true,
            },
            orderBy: {
                invoiceDate: 'desc',
            },
        });

        // Group by month
        const monthlyRevenue: Record<string, { total: number; paid: number }> = {};

        invoices.forEach(invoice => {
            const month = invoice.invoiceDate.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyRevenue[month]) {
                monthlyRevenue[month] = { total: 0, paid: 0 };
            }
            monthlyRevenue[month].total += invoice.totalAmount;
            monthlyRevenue[month].paid += invoice.paidAmount;
        });

        res.json(monthlyRevenue);
    } catch (error) {
        console.error('Get revenue report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get overdue invoices
export const getOverdueInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: InvoiceStatus.CONFIRMED,
                dueDate: {
                    lt: new Date(),
                },
            },
            include: {
                customer: true,
            },
            orderBy: { dueDate: 'asc' },
        });

        res.json(overdueInvoices);
    } catch (error) {
        console.error('Get overdue invoices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get payment report
export const getPaymentReport = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        const payments = await prisma.payment.groupBy({
            by: ['paymentMethod'],
            where,
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });

        res.json(payments);
    } catch (error) {
        console.error('Get payment report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
