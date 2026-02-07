import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all products
export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const { search, category, productType } = req.query;
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (category) where.category = category as string;
        if (productType) where.productType = productType as string;

        const products = await prisma.product.findMany({
            where,
            include: {
                variants: true,
                attributes: {
                    include: {
                        attribute: true,
                        attributeValue: true,
                    },
                },
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
                attributes: {
                    include: {
                        attribute: true,
                        attributeValue: true,
                    },
                },
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
        const { name, description, productType, salesPrice, costPrice, recurringPrice, recurringPeriod, category, variants, attributeLines } = req.body;

        if (!name || salesPrice === undefined || costPrice === undefined) {
            return res.status(400).json({ error: 'Name, sales price, and cost price are required' });
        }

        if (parseFloat(salesPrice) <= parseFloat(costPrice)) {
            return res.status(400).json({ error: 'Sales price must be greater than cost price' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                productType: productType || 'Service',
                salesPrice: parseFloat(salesPrice),
                costPrice: parseFloat(costPrice),
                recurringPrice: recurringPrice ? parseFloat(recurringPrice) : null,
                recurringPeriod: recurringPeriod || null,
                category: category || null,
                variants: variants ? {
                    create: variants.map((v: any) => ({
                        attribute: v.attribute,
                        value: v.value,
                        extraPrice: parseFloat(v.extraPrice || 0),
                    })),
                } : undefined,
                attributes: attributeLines?.length > 0 ? {
                    create: attributeLines.map((al: any) => ({
                        attributeId: al.attributeId,
                        attributeValueId: al.attributeValueId,
                    })),
                } : undefined,
            },
            include: {
                variants: true,
                attributes: {
                    include: { attribute: true, attributeValue: true },
                },
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
        const { name, description, productType, salesPrice, costPrice, recurringPrice, recurringPeriod, category } = req.body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                productType,
                salesPrice: salesPrice !== undefined ? parseFloat(salesPrice) : undefined,
                costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
                recurringPrice: recurringPrice !== undefined ? (recurringPrice ? parseFloat(recurringPrice) : null) : undefined,
                recurringPeriod: recurringPeriod !== undefined ? (recurringPeriod || null) : undefined,
                category: category !== undefined ? (category || null) : undefined,
            },
            include: {
                variants: true,
                attributes: {
                    include: { attribute: true, attributeValue: true },
                },
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

// Get product variants
export const getProductVariants = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const variants = await prisma.productVariant.findMany({
            where: { productId: id },
            orderBy: { createdAt: 'desc' },
        });

        res.json(variants);
    } catch (error) {
        console.error('Get product variants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update product variant
export const updateProductVariant = async (req: AuthRequest, res: Response) => {
    try {
        const { id, variantId } = req.params;
        const { attribute, value, extraPrice } = req.body;

        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, productId: id },
        });

        if (!variant) {
            return res.status(404).json({ error: 'Product variant not found' });
        }

        const updatedVariant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                attribute,
                value,
                extraPrice: extraPrice !== undefined ? parseFloat(extraPrice) : undefined,
            },
        });

        res.json(updatedVariant);
    } catch (error) {
        console.error('Update product variant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete product variant
export const deleteProductVariant = async (req: AuthRequest, res: Response) => {
    try {
        const { id, variantId } = req.params;

        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, productId: id },
        });

        if (!variant) {
            return res.status(404).json({ error: 'Product variant not found' });
        }

        await prisma.productVariant.delete({ where: { id: variantId } });
        res.json({ message: 'Product variant deleted successfully' });
    } catch (error) {
        console.error('Delete product variant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get product attribute lines
export const getAttributeLines = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const lines = await prisma.productAttributeLine.findMany({
            where: { productId: id },
            include: { attribute: true, attributeValue: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json(lines);
    } catch (error) {
        console.error('Get attribute lines error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add attribute line to product
export const addAttributeLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { attributeId, attributeValueId } = req.body;

        if (!attributeId || !attributeValueId) {
            return res.status(400).json({ error: 'Attribute and value are required' });
        }

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const line = await prisma.productAttributeLine.create({
            data: { productId: id, attributeId, attributeValueId },
            include: { attribute: true, attributeValue: true },
        });
        res.status(201).json(line);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'This attribute value is already assigned to this product' });
        console.error('Add attribute line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete attribute line from product
export const deleteAttributeLine = async (req: AuthRequest, res: Response) => {
    try {
        const { id, lineId } = req.params;
        const line = await prisma.productAttributeLine.findFirst({
            where: { id: lineId, productId: id },
        });
        if (!line) return res.status(404).json({ error: 'Attribute line not found' });

        await prisma.productAttributeLine.delete({ where: { id: lineId } });
        res.json({ message: 'Attribute line removed' });
    } catch (error) {
        console.error('Delete attribute line error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
