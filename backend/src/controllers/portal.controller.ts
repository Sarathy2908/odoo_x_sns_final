import { Response } from 'express';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import { AuthRequest } from '../types';
import { createRazorpayOrder } from '../services/razorpay.service';

const prisma = new PrismaClient();

// Portal Dashboard - summary for the logged-in customer
export const getPortalDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const [subscriptions, invoices, payments] = await Promise.all([
            prisma.subscription.findMany({
                where: { customerId: userId },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            prisma.invoice.findMany({
                where: { customerId: userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            prisma.payment.findMany({
                where: { customerId: userId },
                orderBy: { paymentDate: 'desc' },
                take: 5,
            }),
        ]);

        const activeSubscriptions = await prisma.subscription.count({
            where: { customerId: userId, status: 'ACTIVE' },
        });
        const totalInvoices = await prisma.invoice.count({ where: { customerId: userId } });
        const unpaidInvoices = await prisma.invoice.count({
            where: { customerId: userId, status: 'CONFIRMED' },
        });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        res.json({
            stats: { activeSubscriptions, totalInvoices, unpaidInvoices, totalPaid },
            recentSubscriptions: subscriptions,
            recentInvoices: invoices,
            recentPayments: payments,
        });
    } catch (error) {
        console.error('Portal dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Product Catalog - public-ish products
export const getCatalog = async (req: AuthRequest, res: Response) => {
    try {
        const { search, category, productType } = req.query;
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (category) where.category = { equals: category as string, mode: 'insensitive' };
        if (productType) where.productType = { equals: productType as string, mode: 'insensitive' };

        const products = await prisma.product.findMany({
            where,
            include: { variants: true },
            orderBy: { name: 'asc' },
        });

        const plans = await prisma.recurringPlan.findMany({
            orderBy: { price: 'asc' },
        });

        // Get distinct product types and categories for filter dropdowns
        const allProducts = await prisma.product.findMany({
            select: { productType: true, category: true },
        });
        const productTypes = Array.from(new Set(allProducts.map(p => p.productType).filter(Boolean)));
        const categories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)));

        res.json({ products, plans, productTypes, categories });
    } catch (error) {
        console.error('Portal catalog error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// My Subscriptions
export const getMySubscriptions = async (req: AuthRequest, res: Response) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            where: { customerId: req.user!.id },
            include: {
                plan: true,
                lines: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(subscriptions);
    } catch (error) {
        console.error('Portal subscriptions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// My Subscription Detail
export const getMySubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const subscription = await prisma.subscription.findFirst({
            where: { id, customerId: req.user!.id },
            include: {
                plan: true,
                lines: { include: { product: true, tax: true } },
                invoices: { orderBy: { createdAt: 'desc' } },
                history: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });
        if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
        res.json(subscription);
    } catch (error) {
        console.error('Portal subscription detail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// My Invoices
export const getMyInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: { customerId: req.user!.id },
            include: {
                subscription: { select: { subscriptionNumber: true } },
                lines: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(invoices);
    } catch (error) {
        console.error('Portal invoices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// My Invoice Detail
export const getMyInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findFirst({
            where: { id, customerId: req.user!.id },
            include: {
                subscription: { select: { subscriptionNumber: true } },
                lines: { include: { product: true, tax: true } },
                payments: { orderBy: { paymentDate: 'desc' } },
            },
        });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        console.error('Portal invoice detail error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// My Payments
export const getMyPayments = async (req: AuthRequest, res: Response) => {
    try {
        const payments = await prisma.payment.findMany({
            where: { customerId: req.user!.id },
            include: {
                invoice: { select: { invoiceNumber: true, totalAmount: true } },
            },
            orderBy: { paymentDate: 'desc' },
        });
        res.json(payments);
    } catch (error) {
        console.error('Portal payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update my profile (address fields are stored in Contact)
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, street, street2, city, state, country, postalCode, companyName } = req.body;

        // Update user basic fields
        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: { name, phone },
            select: { id: true, name: true, email: true, phone: true, role: true, contactId: true },
        });

        // Update or create the linked Contact with address fields
        const addressData = { street, street2, city, state, country, postalCode, companyName };
        if (user.contactId) {
            await prisma.contact.update({
                where: { id: user.contactId },
                data: { name, phone, ...addressData },
            });
        } else {
            const contact = await prisma.contact.create({
                data: {
                    name: user.name,
                    email: user.email,
                    phone,
                    contactType: 'INDIVIDUAL',
                    isCustomer: true,
                    ...addressData,
                },
            });
            await prisma.user.update({
                where: { id: user.id },
                data: { contactId: contact.id },
            });
        }

        // Return the updated profile with contact address
        const updatedUser = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true, name: true, email: true, phone: true, role: true, createdAt: true,
                contact: {
                    select: { id: true, street: true, street2: true, city: true, state: true, country: true, postalCode: true, companyName: true },
                },
            },
        });

        const { contact, ...userData } = updatedUser!;
        res.json({
            ...userData,
            street: contact?.street || '',
            street2: contact?.street2 || '',
            city: contact?.city || '',
            state: contact?.state || '',
            country: contact?.country || '',
            postalCode: contact?.postalCode || '',
            companyName: contact?.companyName || '',
            contactId: contact?.id || null,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get my profile (address sourced from linked Contact)
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true, name: true, email: true, phone: true, role: true, createdAt: true,
                contact: {
                    select: { id: true, street: true, street2: true, city: true, state: true, country: true, postalCode: true, companyName: true },
                },
            },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { contact, ...userData } = user;
        res.json({
            ...userData,
            street: contact?.street || '',
            street2: contact?.street2 || '',
            city: contact?.city || '',
            state: contact?.state || '',
            country: contact?.country || '',
            postalCode: contact?.postalCode || '',
            companyName: contact?.companyName || '',
            contactId: contact?.id || null,
            hasAddress: !!(contact?.street && contact?.city && contact?.state && contact?.country && contact?.postalCode),
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Subscribe to a plan — creates subscription + Razorpay order in one step
export const subscribeToPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { planId, discountCode } = req.body;
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }

        // Check if user has a complete address in their Contact
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                contactId: true,
                contact: {
                    select: { street: true, city: true, state: true, country: true, postalCode: true },
                },
            },
        });

        if (!user?.contact || !user.contact.street || !user.contact.city || !user.contact.state || !user.contact.country || !user.contact.postalCode) {
            return res.status(400).json({
                error: 'Please complete your address in your profile before subscribing.',
                code: 'ADDRESS_REQUIRED',
            });
        }

        const plan = await prisma.recurringPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        if (plan.price <= 0) {
            return res.status(400).json({ error: 'Plan has no payable amount' });
        }

        // Validate and calculate discount if code provided
        let discountId: string | null = null;
        let discountAmount = 0;
        let discountName: string | null = null;

        if (discountCode) {
            const discount = await prisma.discount.findFirst({
                where: { name: { equals: discountCode, mode: 'insensitive' } },
            });

            if (discount) {
                const now = new Date();
                const isActive = (!discount.startDate || now >= discount.startDate)
                    && (!discount.endDate || now <= discount.endDate);
                const isWithinUsageLimit = discount.limitUsage === null
                    || discount.usageCount < discount.limitUsage;
                const meetsMinPurchase = !discount.minPurchase
                    || plan.price >= discount.minPurchase;

                if (isActive && isWithinUsageLimit && meetsMinPurchase) {
                    discountId = discount.id;
                    discountName = discount.name;
                    if (discount.type === 'PERCENTAGE') {
                        discountAmount = (plan.price * discount.value) / 100;
                    } else {
                        discountAmount = discount.value;
                    }
                    discountAmount = Math.min(discountAmount, plan.price);
                    discountAmount = Math.round(discountAmount * 100) / 100;
                }
            }
        }

        const payableSubtotal = plan.price - discountAmount;
        const gstAmount = Math.round(payableSubtotal * 0.18 * 100) / 100;
        const payableAmount = Math.round((payableSubtotal + gstAmount) * 100) / 100;

        // Generate subscription number
        const count = await prisma.subscription.count();
        const subscriptionNumber = `SUB-${String(count + 1).padStart(6, '0')}`;

        // Calculate expiration date based on billing period
        const startDate = new Date();
        const expirationDate = new Date(startDate);
        switch (plan.billingPeriod) {
            case 'DAILY': expirationDate.setDate(expirationDate.getDate() + 1); break;
            case 'WEEKLY': expirationDate.setDate(expirationDate.getDate() + 7); break;
            case 'MONTHLY': expirationDate.setMonth(expirationDate.getMonth() + 1); break;
            case 'YEARLY': expirationDate.setFullYear(expirationDate.getFullYear() + 1); break;
        }

        // Create a DRAFT subscription (linked to user's contact)
        const subscription = await prisma.subscription.create({
            data: {
                subscriptionNumber,
                customerId: req.user!.id,
                contactId: user!.contactId,
                planId,
                startDate,
                expirationDate,
                status: SubscriptionStatus.DRAFT,
                recurringTotal: plan.price,
                discountId,
                discountAmount,
                history: {
                    create: {
                        action: 'status_change',
                        toStatus: 'DRAFT',
                        description: discountName
                            ? `Subscription created via portal with discount: ${discountName}`
                            : 'Subscription created via portal',
                        performedBy: req.user!.id,
                    },
                },
            },
        });

        // Create Razorpay order
        const order = await createRazorpayOrder(
            payableAmount,
            'INR',
            subscriptionNumber,
            { subscriptionId: subscription.id }
        );

        const paymentLinkExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Update subscription with order details
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                razorpayOrderId: order.id,
                amountDue: payableAmount,
                status: SubscriptionStatus.CONFIRMED,
                paymentLinkExpiry,
            },
        });

        // Increment discount usage count
        if (discountId) {
            await prisma.discount.update({
                where: { id: discountId },
                data: { usageCount: { increment: 1 } },
            });
        }

        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: subscription.id,
                action: 'status_change',
                fromStatus: 'DRAFT',
                toStatus: 'CONFIRMED',
                description: 'Payment initiated via Razorpay',
                performedBy: req.user!.id,
            },
        });

        res.json({
            subscriptionId: subscription.id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_TEST_API,
            subscriptionNumber,
            planName: plan.name,
            discountAmount,
            discountCode: discountName,
        });
    } catch (error) {
        console.error('Subscribe to plan error:', error);
        res.status(500).json({ error: 'Failed to initiate subscription' });
    }
};
