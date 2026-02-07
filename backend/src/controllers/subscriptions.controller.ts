import { Response } from 'express';
import { PrismaClient, SubscriptionStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Generate subscription number
const generateSubscriptionNumber = async (): Promise<string> => {
    const count = await prisma.subscription.count();
    return `SUB-${String(count + 1).padStart(6, '0')}`;
};

// Get all subscriptions (with role-based filtering)
export const getSubscriptions = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        const subscriptions = await prisma.subscription.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(subscriptions);
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single subscription
export const getSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const subscription = await prisma.subscription.findUnique({
            where: { id },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                    },
                },
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
                invoices: true,
            },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Check access
        if (req.user!.role === UserRole.PORTAL_USER && subscription.customerId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(subscription);
    } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create subscription
export const createSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, planId, startDate, expirationDate, paymentTerms, lines } = req.body;

        if (!customerId || !planId || !startDate) {
            return res.status(400).json({ error: 'Customer, plan, and start date are required' });
        }

        const subscriptionNumber = await generateSubscriptionNumber();

        const subscription = await prisma.subscription.create({
            data: {
                subscriptionNumber,
                customerId,
                planId,
                startDate: new Date(startDate),
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                paymentTerms,
                status: SubscriptionStatus.DRAFT,
                lines: lines ? {
                    create: lines.map((line: any) => ({
                        productId: line.productId,
                        quantity: parseInt(line.quantity),
                        unitPrice: parseFloat(line.unitPrice),
                        taxId: line.taxId || null,
                        amount: parseInt(line.quantity) * parseFloat(line.unitPrice),
                    })),
                } : undefined,
            },
            include: {
                customer: true,
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update subscription status
export const updateSubscriptionStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const subscription = await prisma.subscription.update({
            where: { id },
            data: { status },
            include: {
                customer: true,
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        res.json(subscription);
    } catch (error) {
        console.error('Update subscription status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add subscription line
export const addSubscriptionLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { productId, quantity, unitPrice, taxId } = req.body;

        if (!productId || !quantity || !unitPrice) {
            return res.status(400).json({ error: 'Product, quantity, and unit price are required' });
        }

        const line = await prisma.subscriptionLine.create({
            data: {
                subscriptionId: id,
                productId,
                quantity: parseInt(quantity),
                unitPrice: parseFloat(unitPrice),
                taxId: taxId || null,
                amount: parseInt(quantity) * parseFloat(unitPrice),
            },
            include: {
                product: true,
                tax: true,
            },
        });

        res.status(201).json(line);
    } catch (error) {
        console.error('Add subscription line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
