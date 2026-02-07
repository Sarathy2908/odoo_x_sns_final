import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { suggestTax, validateTaxRate, calculateApplicableTaxes } from '../services/ai/taxSuggestion.service';

const prisma = new PrismaClient();

// Get all taxes
export const getTaxes = async (req: AuthRequest, res: Response) => {
    try {
        const taxes = await prisma.tax.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(taxes);
    } catch (error) {
        console.error('Get taxes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single tax
export const getTax = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const tax = await prisma.tax.findUnique({
            where: { id },
        });

        if (!tax) {
            return res.status(404).json({ error: 'Tax not found' });
        }

        res.json(tax);
    } catch (error) {
        console.error('Get tax error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create tax (Admin only)
export const createTax = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, rate, taxType, country, state, isActive } = req.body;

        if (!name || rate === undefined || !taxType) {
            return res.status(400).json({ error: 'Name, rate, and tax type are required' });
        }

        // Validate tax rate
        const validation = validateTaxRate(parseFloat(rate), country || 'India');
        if (!validation.valid) {
            console.warn('Tax validation warnings:', validation.warnings);
        }

        const tax = await prisma.tax.create({
            data: {
                name,
                description,
                rate: parseFloat(rate),
                taxType,
                country,
                state,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        res.status(201).json({
            tax,
            validation: validation.warnings.length > 0 ? { warnings: validation.warnings } : undefined,
        });
    } catch (error) {
        console.error('Create tax error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// AI-powered tax suggestion
export const suggestTaxes = async (req: AuthRequest, res: Response) => {
    try {
        const { country, state, productType } = req.body;

        if (!country || !productType) {
            return res.status(400).json({ error: 'Country and product type are required' });
        }

        const suggestions = await suggestTax(country, state, productType);

        res.json({ suggestions });
    } catch (error) {
        console.error('Suggest taxes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Calculate applicable taxes for invoice
export const calculateTaxes = async (req: AuthRequest, res: Response) => {
    try {
        const { customerId, productIds } = req.body;

        if (!customerId || !productIds || !Array.isArray(productIds)) {
            return res.status(400).json({ error: 'Customer ID and product IDs are required' });
        }

        const applicableTaxes = await calculateApplicableTaxes(customerId, productIds);

        res.json({ applicableTaxes });
    } catch (error) {
        console.error('Calculate taxes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update tax (Admin only)
export const updateTax = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, rate, taxType, country, state, isActive } = req.body;

        const tax = await prisma.tax.update({
            where: { id },
            data: {
                name,
                description,
                rate: rate !== undefined ? parseFloat(rate) : undefined,
                taxType,
                country,
                state,
                isActive,
            },
        });

        res.json(tax);
    } catch (error) {
        console.error('Update tax error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete tax (Admin only)
export const deleteTax = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.tax.delete({ where: { id } });
        res.json({ message: 'Tax deleted successfully' });
    } catch (error) {
        console.error('Delete tax error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
