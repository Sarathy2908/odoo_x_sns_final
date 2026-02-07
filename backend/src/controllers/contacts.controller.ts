import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all contacts (with optional search and filters)
export const getContacts = async (req: AuthRequest, res: Response) => {
    try {
        const { search, contactType, isCustomer, isVendor, portalOnly } = req.query;
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (contactType) where.contactType = contactType as string;
        if (isCustomer !== undefined) where.isCustomer = isCustomer === 'true';
        if (isVendor !== undefined) where.isVendor = isVendor === 'true';
        if (portalOnly === 'true') {
            where.users = { some: { role: 'PORTAL_USER' } };
        }

        const contacts = await prisma.contact.findMany({
            where,
            include: {
                _count: { select: { children: true } },
                users: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(contacts);
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single contact
export const getContact = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const contact = await prisma.contact.findUnique({
            where: { id },
            include: {
                children: true,
                users: { select: { id: true, name: true, email: true, role: true } },
                subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
                invoices: { orderBy: { createdAt: 'desc' } },
                parent: true,
            },
        });

        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        res.json(contact);
    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create contact
export const createContact = async (req: AuthRequest, res: Response) => {
    try {
        const { name, displayName, contactType, email, phone, mobile, website, street, street2, city, state, country, postalCode, companyName, taxId, isCustomer, isVendor, notes, parentId } = req.body;

        if (!name) return res.status(400).json({ error: 'Name is required' });

        const contact = await prisma.contact.create({
            data: {
                name, displayName: displayName || name, contactType: contactType || 'INDIVIDUAL',
                email, phone, mobile, website, street, street2, city, state, country, postalCode,
                companyName, taxId, isCustomer: isCustomer !== undefined ? isCustomer : true,
                isVendor: isVendor !== undefined ? isVendor : false, notes, parentId: parentId || null,
            },
            include: { parent: true, children: true },
        });

        res.status(201).json(contact);
    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update contact
export const updateContact = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, displayName, contactType, email, phone, mobile, website, street, street2, city, state, country, postalCode, companyName, taxId, isCustomer, isVendor, notes, parentId } = req.body;

        const contact = await prisma.contact.update({
            where: { id },
            data: {
                name, displayName, contactType, email, phone, mobile, website,
                street, street2, city, state, country, postalCode, companyName, taxId,
                isCustomer, isVendor, notes, parentId: parentId !== undefined ? (parentId || null) : undefined,
            },
            include: { parent: true, children: true },
        });

        res.json(contact);
    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete contact
export const deleteContact = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.contact.delete({ where: { id } });
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get child contacts
export const getChildren = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const contact = await prisma.contact.findUnique({ where: { id } });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const children = await prisma.contact.findMany({
            where: { parentId: id },
            include: { _count: { select: { children: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(children);
    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
