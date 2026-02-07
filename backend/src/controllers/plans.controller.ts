import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all recurring plans
export const getPlans = async (req: AuthRequest, res: Response) => {
    try {
        const plans = await prisma.recurringPlan.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(plans);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single plan
export const getPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const plan = await prisma.recurringPlan.findUnique({
            where: { id },
        });

        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        res.json(plan);
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create plan (Admin only)
export const createPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, price, billingPeriod, minQuantity, startDate, endDate, autoClose, closable, pausable, renewable } = req.body;

        if (!name || price === undefined || !billingPeriod) {
            return res.status(400).json({ error: 'Name, price, and billing period are required' });
        }

        if (parseFloat(price) <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        const plan = await prisma.recurringPlan.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                billingPeriod,
                minQuantity: minQuantity || 1,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                autoClose: autoClose || false,
                closable: closable !== undefined ? closable : true,
                pausable: pausable !== undefined ? pausable : true,
                renewable: renewable !== undefined ? renewable : true,
            },
        });

        res.status(201).json(plan);
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update plan (Admin only)
export const updatePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, billingPeriod, minQuantity, startDate, endDate, autoClose, closable, pausable, renewable } = req.body;

        const plan = await prisma.recurringPlan.update({
            where: { id },
            data: {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                billingPeriod,
                minQuantity,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                autoClose,
                closable,
                pausable,
                renewable,
            },
        });

        res.json(plan);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete plan (Admin only)
export const deletePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.recurringPlan.delete({ where: { id } });
        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
