import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const templateInclude = {
    plan: true,
    lines: {
        include: { product: true },
        orderBy: { createdAt: 'asc' as const },
    },
};

// Get all quotation templates
export const getQuotationTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const templates = await prisma.quotationTemplate.findMany({
            include: templateInclude,
            orderBy: { createdAt: 'desc' },
        });
        res.json(templates);
    } catch (error) {
        console.error('Get quotation templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single quotation template
export const getQuotationTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const template = await prisma.quotationTemplate.findUnique({
            where: { id },
            include: templateInclude,
        });
        if (!template) return res.status(404).json({ error: 'Quotation template not found' });
        res.json(template);
    } catch (error) {
        console.error('Get quotation template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create quotation template
export const createQuotationTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, validityDays, planId, recurringPeriod, notes, termsAndConditions, lines } = req.body;

        if (!name || !planId) {
            return res.status(400).json({ error: 'Name and plan are required' });
        }

        const template = await prisma.quotationTemplate.create({
            data: {
                name,
                description,
                validityDays: validityDays || 30,
                planId,
                recurringPeriod: recurringPeriod || null,
                notes: notes || null,
                termsAndConditions: termsAndConditions || null,
                lines: lines?.length > 0 ? {
                    create: lines.map((line: any) => ({
                        productId: line.productId,
                        quantity: parseInt(line.quantity) || 1,
                        unitPrice: parseFloat(line.unitPrice) || 0,
                        discount: parseFloat(line.discount) || 0,
                    })),
                } : undefined,
            },
            include: templateInclude,
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Create quotation template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update quotation template
export const updateQuotationTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, validityDays, planId, recurringPeriod, notes, termsAndConditions } = req.body;

        const template = await prisma.quotationTemplate.update({
            where: { id },
            data: {
                name,
                description,
                validityDays: validityDays !== undefined ? parseInt(validityDays) : undefined,
                planId,
                recurringPeriod: recurringPeriod !== undefined ? (recurringPeriod || null) : undefined,
                notes: notes !== undefined ? (notes || null) : undefined,
                termsAndConditions: termsAndConditions !== undefined ? (termsAndConditions || null) : undefined,
            },
            include: templateInclude,
        });

        res.json(template);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Quotation template not found' });
        console.error('Update quotation template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete quotation template
export const deleteQuotationTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.quotationTemplate.delete({ where: { id } });
        res.json({ message: 'Quotation template deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Quotation template not found' });
        console.error('Delete quotation template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add line to quotation template
export const addLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { productId, quantity, unitPrice, discount } = req.body;

        if (!productId) return res.status(400).json({ error: 'Product is required' });

        const template = await prisma.quotationTemplate.findUnique({ where: { id } });
        if (!template) return res.status(404).json({ error: 'Quotation template not found' });

        const line = await prisma.quotationLine.create({
            data: {
                templateId: id,
                productId,
                quantity: parseInt(quantity) || 1,
                unitPrice: parseFloat(unitPrice) || 0,
                discount: parseFloat(discount) || 0,
            },
            include: { product: true },
        });
        res.status(201).json(line);
    } catch (error) {
        console.error('Add quotation line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update line
export const updateLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id, lineId } = req.params;
        const { quantity, unitPrice, discount } = req.body;

        const existing = await prisma.quotationLine.findFirst({ where: { id: lineId, templateId: id } });
        if (!existing) return res.status(404).json({ error: 'Quotation line not found' });

        const line = await prisma.quotationLine.update({
            where: { id: lineId },
            data: {
                quantity: quantity !== undefined ? parseInt(quantity) : undefined,
                unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
                discount: discount !== undefined ? parseFloat(discount) : undefined,
            },
            include: { product: true },
        });
        res.json(line);
    } catch (error) {
        console.error('Update quotation line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete line
export const deleteLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id, lineId } = req.params;
        const existing = await prisma.quotationLine.findFirst({ where: { id: lineId, templateId: id } });
        if (!existing) return res.status(404).json({ error: 'Quotation line not found' });

        await prisma.quotationLine.delete({ where: { id: lineId } });
        res.json({ message: 'Quotation line deleted' });
    } catch (error) {
        console.error('Delete quotation line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create subscription from quotation template
export const createSubscriptionFromTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { customerId, contactId, startDate } = req.body;

        if (!customerId) return res.status(400).json({ error: 'Customer is required' });

        const template = await prisma.quotationTemplate.findUnique({
            where: { id },
            include: { lines: { include: { product: true } }, plan: true },
        });
        if (!template) return res.status(404).json({ error: 'Quotation template not found' });

        const subNumber = `SUB-${Date.now().toString(36).toUpperCase()}`;
        const start = startDate ? new Date(startDate) : new Date();

        const subscription = await prisma.subscription.create({
            data: {
                subscriptionNumber: subNumber,
                customerId,
                contactId: contactId || null,
                planId: template.planId,
                startDate: start,
                status: 'QUOTATION',
                lines: template.lines.length > 0 ? {
                    create: template.lines.map((line: any) => ({
                        productId: line.productId,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discount: line.discount || 0,
                        amount: (line.quantity * line.unitPrice) - (line.discount || 0),
                    })),
                } : undefined,
                history: {
                    create: {
                        action: 'status_change',
                        toStatus: 'QUOTATION',
                        description: `Subscription created from quotation template "${template.name}"`,
                        performedBy: req.user?.id,
                    },
                },
            },
            include: {
                customer: { select: { id: true, name: true, email: true } },
                plan: true,
                lines: { include: { product: true } },
            },
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error('Create subscription from template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
