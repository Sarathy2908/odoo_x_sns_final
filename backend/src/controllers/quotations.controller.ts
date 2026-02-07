import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all quotation templates
export const getQuotationTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const templates = await prisma.quotationTemplate.findMany({
            include: {
                plan: true,
                lines: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(templates);
    } catch (error) {
        console.error('Get quotation templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create quotation template (Admin only)
export const createQuotationTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, validityDays, planId, lines } = req.body;

        if (!name || !planId) {
            return res.status(400).json({ error: 'Name and plan are required' });
        }

        const template = await prisma.quotationTemplate.create({
            data: {
                name,
                description,
                validityDays: validityDays || 30,
                planId,
                lines: lines ? {
                    create: lines.map((line: any) => ({
                        productId: line.productId,
                        quantity: parseInt(line.quantity),
                        unitPrice: parseFloat(line.unitPrice),
                    })),
                } : undefined,
            },
            include: {
                plan: true,
                lines: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Create quotation template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete quotation template (Admin only)
export const deleteQuotationTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.quotationTemplate.delete({ where: { id } });
        res.json({ message: 'Quotation template deleted successfully' });
    } catch (error) {
        console.error('Delete quotation template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
