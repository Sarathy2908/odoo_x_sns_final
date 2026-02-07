import { Response } from 'express';
import { PrismaClient, SubscriptionStatus, InvoiceStatus, PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../types';
import { sendInvoiceEmail } from '../services/email.service';

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
                contact: {
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
                childSubscriptions: {
                    select: {
                        id: true,
                        subscriptionNumber: true,
                        renewalType: true,
                        status: true,
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
                contact: true,
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                },
                history: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                parentSubscription: {
                    select: {
                        id: true,
                        subscriptionNumber: true,
                        status: true,
                    },
                },
                childSubscriptions: {
                    select: {
                        id: true,
                        subscriptionNumber: true,
                        renewalType: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                },
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
        const { customerId, contactId, planId, startDate, expirationDate, paymentTerms, internalNotes, lines } = req.body;

        // Portal users are always the customer
        const effectiveCustomerId = req.user!.role === UserRole.PORTAL_USER
            ? req.user!.id
            : customerId;

        if (!effectiveCustomerId || !planId || !startDate) {
            return res.status(400).json({ error: 'Customer, plan, and start date are required' });
        }

        const subscriptionNumber = await generateSubscriptionNumber();

        const subscription = await prisma.subscription.create({
            data: {
                subscriptionNumber,
                customerId: effectiveCustomerId,
                contactId: contactId || null,
                planId,
                startDate: new Date(startDate),
                expirationDate: expirationDate ? new Date(expirationDate) : null,
                paymentTerms,
                internalNotes,
                status: SubscriptionStatus.DRAFT,
                lines: lines ? {
                    create: lines.map((line: any) => ({
                        productId: line.productId,
                        quantity: parseInt(line.quantity),
                        unitPrice: parseFloat(line.unitPrice),
                        discount: line.discount ? parseFloat(line.discount) : 0,
                        taxId: line.taxId || null,
                        amount: parseInt(line.quantity) * parseFloat(line.unitPrice) - (line.discount ? parseFloat(line.discount) : 0),
                    })),
                } : undefined,
                history: {
                    create: {
                        action: 'status_change',
                        toStatus: 'DRAFT',
                        description: 'Subscription created',
                        performedBy: req.user!.id,
                    },
                },
            },
            include: {
                customer: true,
                contact: true,
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

// Valid status transitions: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED
const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['QUOTATION'],
    QUOTATION: ['CONFIRMED', 'DRAFT'],
    CONFIRMED: ['ACTIVE'],
    ACTIVE: ['CLOSED'],
    CLOSED: [],
};

// Update subscription status
export const updateSubscriptionStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const currentSubscription = await prisma.subscription.findUnique({
            where: { id },
            include: { lines: true },
        });

        if (!currentSubscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const currentStatus = currentSubscription.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

        if (!allowedTransitions.includes(status)) {
            return res.status(400).json({
                error: `Invalid status transition from ${currentStatus} to ${status}. Allowed: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`,
            });
        }

        // Transition-specific validations
        if (currentStatus === 'DRAFT' && status === 'QUOTATION') {
            if (!currentSubscription.customerId || !currentSubscription.planId) {
                return res.status(400).json({ error: 'Customer and plan are required to create quotation' });
            }
        }

        if (status === 'CONFIRMED') {
            if (currentSubscription.lines.length === 0) {
                return res.status(400).json({ error: 'At least one line item is required to confirm' });
            }
        }

        const subscription = await prisma.subscription.update({
            where: { id },
            data: { status },
            include: {
                customer: true,
                contact: true,
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        // Log history
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: id,
                action: 'status_change',
                fromStatus: currentStatus,
                toStatus: status,
                description: `Status changed from ${currentStatus} to ${status}`,
                performedBy: req.user!.id,
            },
        });

        // Auto-generate invoice + send email when subscription becomes ACTIVE
        if (status === 'ACTIVE') {
            try {
                const invoiceCount = await prisma.invoice.count();
                const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

                let subtotal = 0;
                let taxAmount = 0;
                const invoiceLines: any[] = [];

                if (subscription.lines.length > 0) {
                    for (const line of subscription.lines) {
                        const lineDiscount = line.discount || 0;
                        const lineSubtotal = (line.quantity * line.unitPrice) - lineDiscount;
                        const lineTax = line.tax ? (lineSubtotal * line.tax.rate) / 100 : 0;
                        subtotal += lineSubtotal;
                        taxAmount += lineTax;
                        invoiceLines.push({
                            productId: line.productId,
                            description: line.product.name,
                            quantity: line.quantity,
                            unitPrice: line.unitPrice,
                            discount: lineDiscount,
                            taxId: line.taxId,
                            taxAmount: lineTax,
                            amount: lineSubtotal + lineTax,
                        });
                    }
                } else if (subscription.plan) {
                    subtotal = subscription.plan.price;
                    let defaultProduct = await prisma.product.findFirst({
                        where: { name: 'Subscription Plan', productType: 'Service' },
                    });
                    if (!defaultProduct) {
                        defaultProduct = await prisma.product.create({
                            data: {
                                name: 'Subscription Plan',
                                productType: 'Service',
                                salesPrice: 0,
                                costPrice: 0,
                                description: 'Auto-created product for plan-based subscriptions',
                            },
                        });
                    }
                    invoiceLines.push({
                        productId: defaultProduct.id,
                        description: subscription.plan.name,
                        quantity: 1,
                        unitPrice: subscription.plan.price,
                        discount: 0,
                        taxAmount: 0,
                        amount: subscription.plan.price,
                    });
                }

                const totalAmount = subtotal + taxAmount;

                const invoice = await prisma.invoice.create({
                    data: {
                        invoiceNumber,
                        customerId: subscription.customer.id,
                        contactId: subscription.contact?.id || null,
                        subscriptionId: subscription.id,
                        invoiceDate: new Date(),
                        dueDate: new Date(),
                        status: InvoiceStatus.PAID,
                        subtotal,
                        taxAmount,
                        totalAmount,
                        paidAmount: totalAmount,
                        notes: `Auto-generated on subscription activation by admin`,
                        lines: { create: invoiceLines },
                    },
                });

                // Create payment record
                await prisma.payment.create({
                    data: {
                        invoiceId: invoice.id,
                        customerId: subscription.customer.id,
                        amount: totalAmount,
                        paymentMethod: PaymentMethod.OTHER,
                        status: PaymentStatus.COMPLETED,
                        reference: `Admin activation - ${subscription.subscriptionNumber}`,
                        notes: `Subscription activated by admin`,
                    },
                });

                // Send invoice email (non-blocking)
                if (subscription.customer?.email) {
                    sendInvoiceEmail({
                        customerName: subscription.customer.name,
                        customerEmail: subscription.customer.email,
                        invoiceNumber,
                        subscriptionNumber: subscription.subscriptionNumber,
                        planName: subscription.plan?.name || 'Subscription',
                        amount: totalAmount,
                        paymentId: `Admin-${subscription.subscriptionNumber}`,
                        invoiceDate: new Date().toLocaleDateString('en-IN'),
                    }).catch(err => console.error('Invoice email error:', err));
                }

                console.log('Auto-created invoice:', invoiceNumber, 'for subscription:', subscription.subscriptionNumber);
            } catch (invoiceErr) {
                console.error('Auto-invoice creation failed (status change still succeeded):', invoiceErr);
            }
        }

        res.json(subscription);
    } catch (error) {
        console.error('Update subscription status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Renew subscription
export const renewSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const currentSubscription = await prisma.subscription.findUnique({
            where: { id },
            include: {
                lines: { include: { product: true, tax: true } },
                plan: true,
            },
        });

        if (!currentSubscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (currentSubscription.status !== 'ACTIVE' && currentSubscription.status !== 'CLOSED') {
            return res.status(400).json({ error: 'Only ACTIVE or CLOSED subscriptions can be renewed' });
        }

        if (!currentSubscription.plan.renewable) {
            return res.status(400).json({ error: 'This plan does not support renewal' });
        }

        const subscriptionNumber = await generateSubscriptionNumber();
        const startDate = new Date();

        const newSubscription = await prisma.subscription.create({
            data: {
                subscriptionNumber,
                customerId: currentSubscription.customerId,
                contactId: currentSubscription.contactId,
                planId: currentSubscription.planId,
                startDate,
                paymentTerms: currentSubscription.paymentTerms,
                status: SubscriptionStatus.DRAFT,
                parentSubscriptionId: id,
                renewalType: 'renewal',
                lines: {
                    create: currentSubscription.lines.map(line => ({
                        productId: line.productId,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discount: line.discount,
                        taxId: line.taxId,
                        amount: line.amount,
                    })),
                },
                history: {
                    create: {
                        action: 'renewal',
                        toStatus: 'DRAFT',
                        description: `Renewed from ${currentSubscription.subscriptionNumber}`,
                        performedBy: req.user!.id,
                    },
                },
            },
            include: {
                customer: true,
                contact: true,
                plan: true,
                lines: { include: { product: true, tax: true } },
            },
        });

        // Log on parent
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: id,
                action: 'renewal',
                description: `Renewal created: ${newSubscription.subscriptionNumber}`,
                performedBy: req.user!.id,
            },
        });

        res.status(201).json(newSubscription);
    } catch (error) {
        console.error('Renew subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Upsell subscription (create upsell with additional lines)
export const upsellSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { additionalLines } = req.body;

        const currentSubscription = await prisma.subscription.findUnique({
            where: { id },
            include: {
                lines: { include: { product: true, tax: true } },
                plan: true,
            },
        });

        if (!currentSubscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (currentSubscription.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Only ACTIVE subscriptions can be upsold' });
        }

        if (!additionalLines || additionalLines.length === 0) {
            return res.status(400).json({ error: 'Additional lines are required for upsell' });
        }

        const subscriptionNumber = await generateSubscriptionNumber();

        // Combine existing + new lines
        const allLines = [
            ...currentSubscription.lines.map(line => ({
                productId: line.productId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discount: line.discount,
                taxId: line.taxId,
                amount: line.amount,
            })),
            ...additionalLines.map((line: any) => ({
                productId: line.productId,
                quantity: parseInt(line.quantity),
                unitPrice: parseFloat(line.unitPrice),
                discount: line.discount ? parseFloat(line.discount) : 0,
                taxId: line.taxId || null,
                amount: parseInt(line.quantity) * parseFloat(line.unitPrice) - (line.discount ? parseFloat(line.discount) : 0),
            })),
        ];

        const newSubscription = await prisma.subscription.create({
            data: {
                subscriptionNumber,
                customerId: currentSubscription.customerId,
                contactId: currentSubscription.contactId,
                planId: currentSubscription.planId,
                startDate: new Date(),
                paymentTerms: currentSubscription.paymentTerms,
                status: SubscriptionStatus.DRAFT,
                parentSubscriptionId: id,
                renewalType: 'upsell',
                lines: { create: allLines },
                history: {
                    create: {
                        action: 'upsell',
                        toStatus: 'DRAFT',
                        description: `Upsell from ${currentSubscription.subscriptionNumber}`,
                        performedBy: req.user!.id,
                    },
                },
            },
            include: {
                customer: true,
                contact: true,
                plan: true,
                lines: { include: { product: true, tax: true } },
            },
        });

        // Log on parent
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: id,
                action: 'upsell',
                description: `Upsell created: ${newSubscription.subscriptionNumber}`,
                performedBy: req.user!.id,
            },
        });

        res.status(201).json(newSubscription);
    } catch (error) {
        console.error('Upsell subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get subscription history
export const getSubscriptionHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const history = await prisma.subscriptionHistory.findMany({
            where: { subscriptionId: id },
            orderBy: { createdAt: 'desc' },
        });

        res.json(history);
    } catch (error) {
        console.error('Get subscription history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add subscription line
export const addSubscriptionLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { productId, quantity, unitPrice, discount, taxId } = req.body;

        if (!productId || !quantity || !unitPrice) {
            return res.status(400).json({ error: 'Product, quantity, and unit price are required' });
        }

        // Ownership check for portal users
        const subscription = await prisma.subscription.findUnique({ where: { id } });
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        if (req.user!.role === UserRole.PORTAL_USER && subscription.customerId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const discountValue = discount ? parseFloat(discount) : 0;

        const line = await prisma.subscriptionLine.create({
            data: {
                subscriptionId: id,
                productId,
                quantity: parseInt(quantity),
                unitPrice: parseFloat(unitPrice),
                discount: discountValue,
                taxId: taxId || null,
                amount: parseInt(quantity) * parseFloat(unitPrice) - discountValue,
            },
            include: {
                product: true,
                tax: true,
            },
        });

        // Log history
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: id,
                action: 'line_change',
                description: `Line added: ${line.product.name} x${quantity}`,
                performedBy: req.user!.id,
            },
        });

        res.status(201).json(line);
    } catch (error) {
        console.error('Add subscription line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update subscription (only if DRAFT or QUOTATION)
export const updateSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { customerId, contactId, planId, startDate, expirationDate, paymentTerms, internalNotes } = req.body;

        const subscription = await prisma.subscription.findUnique({ where: { id } });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (subscription.status !== SubscriptionStatus.DRAFT && subscription.status !== SubscriptionStatus.QUOTATION) {
            return res.status(400).json({ error: 'Subscription can only be updated in DRAFT or QUOTATION status' });
        }

        // Ownership check for portal users
        if (req.user!.role === UserRole.PORTAL_USER && subscription.customerId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await prisma.subscription.update({
            where: { id },
            data: {
                customerId,
                contactId: contactId !== undefined ? contactId : undefined,
                planId,
                startDate: startDate ? new Date(startDate) : undefined,
                expirationDate: expirationDate ? new Date(expirationDate) : undefined,
                paymentTerms,
                internalNotes: internalNotes !== undefined ? internalNotes : undefined,
            },
            include: {
                customer: true,
                contact: true,
                plan: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete subscription (only if DRAFT)
export const deleteSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const subscription = await prisma.subscription.findUnique({ where: { id } });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (subscription.status !== SubscriptionStatus.DRAFT) {
            return res.status(400).json({ error: 'Only DRAFT subscriptions can be deleted' });
        }

        // Ownership check for portal users
        if (req.user!.role === UserRole.PORTAL_USER && subscription.customerId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.subscription.delete({ where: { id } });
        res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
        console.error('Delete subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete subscription line
export const deleteSubscriptionLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id, lineId } = req.params;

        // Ownership check for portal users
        const subscription = await prisma.subscription.findUnique({ where: { id } });
        if (subscription && req.user!.role === UserRole.PORTAL_USER && subscription.customerId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const line = await prisma.subscriptionLine.findFirst({
            where: { id: lineId, subscriptionId: id },
            include: { product: true },
        });

        if (!line) {
            return res.status(404).json({ error: 'Subscription line not found' });
        }

        await prisma.subscriptionLine.delete({ where: { id: lineId } });

        // Log history
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: id,
                action: 'line_change',
                description: `Line removed: ${line.product.name}`,
                performedBy: req.user!.id,
            },
        });

        res.json({ message: 'Subscription line deleted successfully' });
    } catch (error) {
        console.error('Delete subscription line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
