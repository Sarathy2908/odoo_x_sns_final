import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all discounts
export const getDiscounts = async (req: AuthRequest, res: Response) => {
    try {
        const discounts = await prisma.discount.findMany({
            include: {
                products: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(discounts);
    } catch (error) {
        console.error('Get discounts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single discount
export const getDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const discount = await prisma.discount.findUnique({
            where: { id },
            include: {
                products: true,
            },
        });

        if (!discount) {
            return res.status(404).json({ error: 'Discount not found' });
        }

        res.json(discount);
    } catch (error) {
        console.error('Get discount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create discount (Admin only)
export const createDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, type, value, minPurchase, minQuantity, startDate, endDate, limitUsage, productIds } = req.body;

        if (!name || !type || value === undefined) {
            return res.status(400).json({ error: 'Name, type, and value are required' });
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        if (type === 'PERCENTAGE' && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
            return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
        }

        const discount = await prisma.discount.create({
            data: {
                name,
                description,
                type,
                value: parseFloat(value),
                minPurchase: minPurchase ? parseFloat(minPurchase) : null,
                minQuantity: minQuantity ? parseInt(minQuantity) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                limitUsage: limitUsage ? parseInt(limitUsage) : null,
                products: productIds ? {
                    connect: productIds.map((id: string) => ({ id })),
                } : undefined,
            },
            include: {
                products: true,
            },
        });

        res.status(201).json(discount);
    } catch (error) {
        console.error('Create discount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update discount (Admin only)
export const updateDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, type, value, minPurchase, minQuantity, startDate, endDate, limitUsage } = req.body;

        const discount = await prisma.discount.update({
            where: { id },
            data: {
                name,
                description,
                type,
                value: value !== undefined ? parseFloat(value) : undefined,
                minPurchase: minPurchase !== undefined ? (minPurchase ? parseFloat(minPurchase) : null) : undefined,
                minQuantity: minQuantity !== undefined ? (minQuantity ? parseInt(minQuantity) : null) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                limitUsage: limitUsage !== undefined ? (limitUsage ? parseInt(limitUsage) : null) : undefined,
            },
            include: {
                products: true,
            },
        });

        res.json(discount);
    } catch (error) {
        console.error('Update discount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete discount (Admin only)
export const deleteDiscount = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.discount.delete({ where: { id } });
        res.json({ message: 'Discount deleted successfully' });
    } catch (error) {
        console.error('Delete discount error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
