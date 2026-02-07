import { Response } from 'express';
import { PrismaClient, InvoiceStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
};

// Get all invoices (with role-based filtering)
export const getInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                subscription: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single invoice
export const getInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                subscription: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
                payments: true,
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Check access
        if (req.user!.role === UserRole.PORTAL_USER && invoice.customerId !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Generate invoice from subscription
export const generateInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const invoiceNumber = await generateInvoiceNumber();

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const invoiceLines = subscription.lines.map(line => {
            const lineSubtotal = line.amount;
            const lineTax = line.tax ? (lineSubtotal * line.tax.rate) / 100 : 0;

            subtotal += lineSubtotal;
            taxAmount += lineTax;

            return {
                productId: line.productId,
                description: line.product.name,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                taxId: line.taxId,
                taxAmount: lineTax,
                amount: lineSubtotal + lineTax,
            };
        });

        const totalAmount = subtotal + taxAmount;

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                customerId: subscription.customerId,
                subscriptionId: subscription.id,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                status: InvoiceStatus.DRAFT,
                subtotal,
                taxAmount,
                totalAmount,
                lines: {
                    create: invoiceLines,
                },
            },
            include: {
                customer: true,
                subscription: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Confirm invoice
export const confirmInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status: InvoiceStatus.CONFIRMED },
            include: {
                customer: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        res.json(invoice);
    } catch (error) {
        console.error('Confirm invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Cancel invoice
export const cancelInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status: InvoiceStatus.CANCELLED },
            include: {
                customer: true,
                lines: {
                    include: {
                        product: true,
                        tax: true,
                    },
                },
            },
        });

        res.json(invoice);
    } catch (error) {
        console.error('Cancel invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
