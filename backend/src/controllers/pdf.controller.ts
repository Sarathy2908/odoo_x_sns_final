import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import { generateInvoicePDF, generateQuotationPDF } from '../services/pdf.service';

const prisma = new PrismaClient();

// Generate PDF for invoice
export const generateInvoicePdf = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: { select: { name: true, email: true } },
                contact: true,
                lines: { include: { product: true, tax: true } },
            },
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const pdfUrl = await generateInvoicePDF({
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString(),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : undefined,
            customer: invoice.customer,
            contact: invoice.contact ? {
                name: invoice.contact.name,
                email: invoice.contact.email || undefined,
                phone: invoice.contact.phone || undefined,
                street: invoice.contact.street || undefined,
                city: invoice.contact.city || undefined,
                state: invoice.contact.state || undefined,
                postalCode: invoice.contact.postalCode || undefined,
            } : null,
            lines: invoice.lines.map(line => ({
                product: line.product?.name || 'Unknown',
                description: line.description || undefined,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discount: line.discount || 0,
                taxName: line.tax?.name,
                taxRate: line.tax?.rate,
                taxAmount: line.taxAmount || 0,
                amount: line.amount,
            })),
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            notes: invoice.notes || undefined,
        });

        // Save PDF URL to invoice
        await prisma.invoice.update({
            where: { id },
            data: { pdfUrl },
        });

        res.json({ pdfUrl });
    } catch (error) {
        console.error('Generate invoice PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

// Generate PDF for quotation template
export const generateQuotationPdf = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const template = await prisma.quotationTemplate.findUnique({
            where: { id },
            include: {
                plan: true,
                lines: { include: { product: true } },
            },
        });

        if (!template) return res.status(404).json({ error: 'Quotation template not found' });

        const totalAmount = template.lines.reduce(
            (sum, line) => sum + (line.quantity * line.unitPrice) - (line.discount || 0), 0
        );

        const pdfUrl = await generateQuotationPDF({
            templateName: template.name,
            planName: template.plan.name,
            validityDays: template.validityDays,
            recurringPeriod: template.recurringPeriod || undefined,
            description: template.description || undefined,
            notes: template.notes || undefined,
            termsAndConditions: template.termsAndConditions || undefined,
            lines: template.lines.map(line => ({
                product: line.product?.name || 'Unknown',
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discount: line.discount || 0,
            })),
            totalAmount,
        });

        res.json({ pdfUrl });
    } catch (error) {
        console.error('Generate quotation PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
