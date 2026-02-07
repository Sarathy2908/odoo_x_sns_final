import { Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all users (with role-based filtering)
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        let where: any = {};
        const { role } = req.query;

        if (req.user!.role === UserRole.INTERNAL_USER) {
            // Internal users can only see portal users (customers)
            where.role = UserRole.PORTAL_USER;
        } else if (req.user!.role === UserRole.PORTAL_USER) {
            // Portal users can only see themselves
            where.id = req.user!.id;
        } else if (role) {
            // Admin can filter by role via query param
            where.role = role as string;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single user
export const getUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check access
        if (req.user!.role === UserRole.PORTAL_USER && id !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create internal user (Admin only)
export const createInternalUser = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: UserRole.INTERNAL_USER,
                createdById: req.user!.id,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Create internal user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, address, city, state, country, postalCode } = req.body;

        // Check access
        if (req.user!.role !== UserRole.ADMIN && id !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                phone,
                address,
                city,
                state,
                country,
                postalCode,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                country: true,
                postalCode: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user!.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Change user role (Admin only)
export const changeUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        // Prevent changing own role
        if (id === req.user!.id) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Change user role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
