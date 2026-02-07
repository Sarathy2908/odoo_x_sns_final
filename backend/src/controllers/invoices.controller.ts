import { Response } from 'express';
import { PrismaClient, InvoiceStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const invoiceInclude = {
    customer: { select: { id: true, name: true, email: true } },
    contact: true,
    subscription: { select: { id: true, subscriptionNumber: true, status: true } },
    lines: { include: { product: true, tax: true }, orderBy: { createdAt: 'asc' as const } },
    payments: { orderBy: { paymentDate: 'desc' as const } },
};

const generateInvoiceNumber = async (): Promise<string> => {
    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
};

// Get all invoices (with role-based filtering)
export const getInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const { status, search } = req.query;
        const where: any = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        if (status) where.status = status as string;
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search as string, mode: 'insensitive' } },
                { customer: { name: { contains: search as string, mode: 'insensitive' } } },
            ];
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: invoiceInclude,
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
            include: invoiceInclude,
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
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
        const { notes } = req.body || {};

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                lines: { include: { product: true, tax: true } },
            },
        });

        if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

        const invoiceNumber = await generateInvoiceNumber();
        let subtotal = 0;
        let taxAmount = 0;

        const invoiceLines = subscription.lines.map(line => {
            const lineDiscount = line.discount || 0;
            const lineSubtotal = (line.quantity * line.unitPrice) - lineDiscount;
            const lineTax = line.tax ? (lineSubtotal * line.tax.rate) / 100 : 0;
            subtotal += lineSubtotal;
            taxAmount += lineTax;

            return {
                productId: line.productId,
                description: line.product.name,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discount: lineDiscount,
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
                contactId: subscription.contactId,
                subscriptionId: subscription.id,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: InvoiceStatus.DRAFT,
                subtotal,
                taxAmount,
                totalAmount,
                notes: notes || null,
                lines: { create: invoiceLines },
            },
            include: invoiceInclude,
        });

        // Update subscription's nextInvoiceDate
        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { nextInvoiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
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
        const existing = await prisma.invoice.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Invoice not found' });
        if (existing.status !== InvoiceStatus.DRAFT) {
            return res.status(400).json({ error: 'Only DRAFT invoices can be confirmed' });
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status: InvoiceStatus.CONFIRMED },
            include: invoiceInclude,
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
        const existing = await prisma.invoice.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Invoice not found' });
        if (existing.status !== InvoiceStatus.DRAFT && existing.status !== InvoiceStatus.CONFIRMED) {
            return res.status(400).json({ error: 'Only DRAFT or CONFIRMED invoices can be cancelled' });
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status: InvoiceStatus.CANCELLED },
            include: invoiceInclude,
        });
        res.json(invoice);
    } catch (error) {
        console.error('Cancel invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update invoice notes (draft only)
export const updateInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { notes, dueDate } = req.body;

        const existing = await prisma.invoice.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Invoice not found' });
        if (existing.status !== InvoiceStatus.DRAFT) {
            return res.status(400).json({ error: 'Only DRAFT invoices can be updated' });
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                notes: notes !== undefined ? (notes || null) : undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
            include: invoiceInclude,
        });
        res.json(invoice);
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add line to draft invoice
export const addLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { productId, description, quantity, unitPrice, discount, taxId } = req.body;

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.status !== InvoiceStatus.DRAFT) {
            return res.status(400).json({ error: 'Can only add lines to DRAFT invoices' });
        }
        if (!productId) return res.status(400).json({ error: 'Product is required' });

        const qty = parseInt(quantity) || 1;
        const price = parseFloat(unitPrice) || 0;
        const disc = parseFloat(discount) || 0;

        let taxAmount = 0;
        if (taxId) {
            const tax = await prisma.tax.findUnique({ where: { id: taxId } });
            if (tax) taxAmount = ((qty * price - disc) * tax.rate) / 100;
        }

        const lineAmount = (qty * price) - disc + taxAmount;

        const line = await prisma.invoiceLine.create({
            data: {
                invoiceId: id,
                productId,
                description: description || null,
                quantity: qty,
                unitPrice: price,
                discount: disc,
                taxId: taxId || null,
                taxAmount,
                amount: lineAmount,
            },
            include: { product: true, tax: true },
        });

        // Recalculate invoice totals
        await recalculateInvoiceTotals(id);

        res.status(201).json(line);
    } catch (error) {
        console.error('Add invoice line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete line from draft invoice
export const deleteLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id, lineId } = req.params;

        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.status !== InvoiceStatus.DRAFT) {
            return res.status(400).json({ error: 'Can only remove lines from DRAFT invoices' });
        }

        const line = await prisma.invoiceLine.findFirst({ where: { id: lineId, invoiceId: id } });
        if (!line) return res.status(404).json({ error: 'Invoice line not found' });

        await prisma.invoiceLine.delete({ where: { id: lineId } });
        await recalculateInvoiceTotals(id);

        res.json({ message: 'Invoice line removed' });
    } catch (error) {
        console.error('Delete invoice line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper to recalculate invoice totals
async function recalculateInvoiceTotals(invoiceId: string) {
    const lines = await prisma.invoiceLine.findMany({ where: { invoiceId } });
    const subtotal = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice) - (l.discount || 0), 0);
    const taxAmount = lines.reduce((sum, l) => sum + (l.taxAmount || 0), 0);
    const totalAmount = subtotal + taxAmount;

    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { subtotal, taxAmount, totalAmount },
    });
}
