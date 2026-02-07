import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all products
export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                variants: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single product
export const getProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: true,
            },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create product (Admin only)
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, productType, salesPrice, costPrice, variants } = req.body;

        if (!name || salesPrice === undefined || costPrice === undefined) {
            return res.status(400).json({ error: 'Name, sales price, and cost price are required' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                productType: productType || 'Service',
                salesPrice: parseFloat(salesPrice),
                costPrice: parseFloat(costPrice),
                variants: variants ? {
                    create: variants.map((v: any) => ({
                        attribute: v.attribute,
                        value: v.value,
                        extraPrice: parseFloat(v.extraPrice || 0),
                    })),
                } : undefined,
            },
            include: {
                variants: true,
            },
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update product (Admin only)
export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, productType, salesPrice, costPrice } = req.body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                productType,
                salesPrice: salesPrice !== undefined ? parseFloat(salesPrice) : undefined,
                costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
            },
            include: {
                variants: true,
            },
        });

        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete product (Admin only)
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add product variant
export const addProductVariant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { attribute, value, extraPrice } = req.body;

        if (!attribute || !value) {
            return res.status(400).json({ error: 'Attribute and value are required' });
        }

        const variant = await prisma.productVariant.create({
            data: {
                productId: id,
                attribute,
                value,
                extraPrice: parseFloat(extraPrice || 0),
            },
        });

        res.status(201).json(variant);
    } catch (error) {
        console.error('Add variant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
