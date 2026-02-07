import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all attributes with values
export const getAll = async (req: AuthRequest, res: Response) => {
    try {
        const attributes = await prisma.attribute.findMany({
            include: { values: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(attributes);
    } catch (error) {
        console.error('Get attributes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single attribute with values and product lines
export const getOne = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const attribute = await prisma.attribute.findUnique({
            where: { id },
            include: {
                values: true,
                productLines: {
                    include: {
                        product: { select: { id: true, name: true } },
                        attributeValue: true,
                    },
                },
            },
        });
        if (!attribute) return res.status(404).json({ error: 'Attribute not found' });
        res.json(attribute);
    } catch (error) {
        console.error('Get attribute error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create attribute with optional initial values
export const create = async (req: AuthRequest, res: Response) => {
    try {
        const { name, displayType, values } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const attribute = await prisma.attribute.create({
            data: {
                name,
                displayType: displayType || 'select',
                values: values?.length > 0 ? {
                    create: values.map((v: any) => ({ value: v.value, extraPrice: v.extraPrice ? parseFloat(v.extraPrice) : 0 })),
                } : undefined,
            },
            include: { values: true },
        });
        res.status(201).json(attribute);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Attribute name already exists' });
        console.error('Create attribute error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update attribute
export const update = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, displayType } = req.body;
        const attribute = await prisma.attribute.update({
            where: { id }, data: { name, displayType }, include: { values: true },
        });
        res.json(attribute);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'Attribute name already exists' });
        if (error.code === 'P2025') return res.status(404).json({ error: 'Attribute not found' });
        console.error('Update attribute error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete attribute
export const deleteAttribute = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.attribute.delete({ where: { id } });
        res.json({ message: 'Attribute deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Attribute not found' });
        console.error('Delete attribute error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add value to attribute
export const addValue = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { value, extraPrice } = req.body;
        if (!value) return res.status(400).json({ error: 'Value is required' });

        const attribute = await prisma.attribute.findUnique({ where: { id } });
        if (!attribute) return res.status(404).json({ error: 'Attribute not found' });

        const attrValue = await prisma.attributeValue.create({
            data: { attributeId: id, value, extraPrice: extraPrice ? parseFloat(extraPrice) : 0 },
        });
        res.status(201).json(attrValue);
    } catch (error) {
        console.error('Add attribute value error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update value
export const updateValue = async (req: AuthRequest, res: Response) => {
    try {
        const { id, valueId } = req.params;
        const { value, extraPrice } = req.body;

        const existing = await prisma.attributeValue.findFirst({ where: { id: valueId, attributeId: id } });
        if (!existing) return res.status(404).json({ error: 'Attribute value not found' });

        const updated = await prisma.attributeValue.update({
            where: { id: valueId },
            data: { value, extraPrice: extraPrice !== undefined ? parseFloat(extraPrice) : undefined },
        });
        res.json(updated);
    } catch (error) {
        console.error('Update attribute value error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete value
export const deleteValue = async (req: AuthRequest, res: Response) => {
    try {
        const { id, valueId } = req.params;
        const existing = await prisma.attributeValue.findFirst({ where: { id: valueId, attributeId: id } });
        if (!existing) return res.status(404).json({ error: 'Attribute value not found' });

        await prisma.attributeValue.delete({ where: { id: valueId } });
        res.json({ message: 'Attribute value deleted successfully' });
    } catch (error) {
        console.error('Delete attribute value error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
