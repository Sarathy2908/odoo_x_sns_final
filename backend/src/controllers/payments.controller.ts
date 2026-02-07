import { Response } from 'express';
import { PrismaClient, InvoiceStatus, UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get all payments (with role-based filtering)
export const getPayments = async (req: AuthRequest, res: Response) => {
    try {
        const where = req.user!.role === UserRole.PORTAL_USER
            ? { customerId: req.user!.id }
            : {};

        const payments = await prisma.payment.findMany({
            where,
            include: {
                invoice: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Record payment
export const createPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { invoiceId, amount, paymentMethod, paymentDate, reference, notes } = req.body;

        if (!invoiceId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Invoice, amount, and payment method are required' });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status !== InvoiceStatus.CONFIRMED) {
            return res.status(400).json({ error: 'Payments can only be made on CONFIRMED invoices' });
        }

        const remainingAmount = invoice.totalAmount - invoice.paidAmount;
        if (parseFloat(amount) > remainingAmount) {
            return res.status(400).json({ error: `Payment amount exceeds remaining balance. Maximum allowed: ${remainingAmount}` });
        }

        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                customerId: invoice.customerId,
                amount: parseFloat(amount),
                paymentMethod,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                reference,
                notes,
            },
            include: {
                invoice: true,
                customer: true,
            },
        });

        // Update invoice paid amount and status
        const newPaidAmount = invoice.paidAmount + parseFloat(amount);
        const newStatus = newPaidAmount >= invoice.totalAmount ? InvoiceStatus.PAID : invoice.status;

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus,
            },
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single payment
export const getPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                invoice: true,
                customer: true,
            },
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
