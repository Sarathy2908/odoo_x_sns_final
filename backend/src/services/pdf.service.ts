import PDFDocument from 'pdfkit';
import { bucket } from '../config/firebase';

/**
 * Collect PDF document output into a Buffer
 */
function generatePDFBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

/**
 * Upload a PDF buffer to Firebase Storage and return the public URL
 */
async function uploadToFirebase(buffer: Buffer, filename: string): Promise<string> {
    const file = bucket.file(`pdfs/${filename}`);

    await file.save(buffer, {
        metadata: {
            contentType: 'application/pdf',
            cacheControl: 'public, max-age=31536000',
        },
    });

    // Make the file publicly readable
    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/pdfs/${filename}`;
}

interface InvoicePDFData {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    customer: { name: string; email: string };
    contact?: { name: string; email?: string; phone?: string; street?: string; city?: string; state?: string; postalCode?: string } | null;
    lines: Array<{
        product: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        taxName?: string;
        taxRate?: number;
        taxAmount: number;
        amount: number;
    }>;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    notes?: string;
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<string> {
    const filename = `${data.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Header
        doc.fontSize(24).fillColor('#1E40AF').text('SIDAZ', 50, 50);
        doc.fontSize(10).fillColor('#666').text('Subscription Management System', 50, 78);

        // Invoice Title
        doc.fontSize(20).fillColor('#1a1a1a').text('INVOICE', 400, 50, { align: 'right' });
        doc.fontSize(10).fillColor('#666').text(data.invoiceNumber, 400, 75, { align: 'right' });

        doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e5e7eb').stroke();

        // Invoice Details
        let y = 115;
        doc.fontSize(9).fillColor('#666');
        doc.text('Invoice Date:', 50, y);
        doc.fillColor('#1a1a1a').text(data.invoiceDate, 130, y);
        y += 15;
        if (data.dueDate) {
            doc.fillColor('#666').text('Due Date:', 50, y);
            doc.fillColor('#1a1a1a').text(data.dueDate, 130, y);
            y += 15;
        }

        // Customer Info
        doc.fillColor('#666').text('Bill To:', 350, 115);
        doc.fontSize(11).fillColor('#1a1a1a').text(data.customer.name, 350, 130);
        doc.fontSize(9).fillColor('#666').text(data.customer.email, 350, 145);
        if (data.contact) {
            let cy = 160;
            if (data.contact.street) { doc.text(data.contact.street, 350, cy); cy += 12; }
            if (data.contact.city || data.contact.state) {
                doc.text(`${data.contact.city || ''}${data.contact.city && data.contact.state ? ', ' : ''}${data.contact.state || ''} ${data.contact.postalCode || ''}`, 350, cy);
            }
        }

        // Table Header
        y = Math.max(y, 190) + 10;
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 8;

        doc.fontSize(8).fillColor('#666');
        doc.text('PRODUCT', 50, y);
        doc.text('QTY', 280, y, { width: 40, align: 'right' });
        doc.text('PRICE', 325, y, { width: 60, align: 'right' });
        doc.text('DISC', 390, y, { width: 45, align: 'right' });
        doc.text('TAX', 440, y, { width: 45, align: 'right' });
        doc.text('AMOUNT', 490, y, { width: 55, align: 'right' });
        y += 15;
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 8;

        // Table Rows
        doc.fontSize(9).fillColor('#1a1a1a');
        for (const line of data.lines) {
            const productName = line.product;
            doc.text(productName.length > 35 ? productName.substring(0, 35) + '...' : productName, 50, y);
            doc.text(String(line.quantity), 280, y, { width: 40, align: 'right' });
            doc.text(`₹${line.unitPrice.toFixed(2)}`, 325, y, { width: 60, align: 'right' });
            doc.text(line.discount > 0 ? `₹${line.discount.toFixed(2)}` : '-', 390, y, { width: 45, align: 'right' });
            doc.text(line.taxAmount > 0 ? `₹${line.taxAmount.toFixed(2)}` : '-', 440, y, { width: 45, align: 'right' });
            doc.text(`₹${line.amount.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
            y += 18;

            if (y > 700) {
                doc.addPage();
                y = 50;
            }
        }

        // Totals
        y += 5;
        doc.moveTo(350, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 10;

        doc.fontSize(9).fillColor('#666').text('Subtotal', 350, y);
        doc.fillColor('#1a1a1a').text(`₹${data.subtotal.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
        y += 16;

        doc.fillColor('#666').text('Tax', 350, y);
        doc.fillColor('#1a1a1a').text(`₹${data.taxAmount.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
        y += 16;

        doc.moveTo(350, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 8;

        doc.fontSize(11).fillColor('#1a1a1a').font('Helvetica-Bold').text('Total', 350, y);
        doc.text(`₹${data.totalAmount.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
        y += 18;

        doc.fontSize(9).font('Helvetica').fillColor('#059669').text('Paid', 350, y);
        doc.text(`₹${data.paidAmount.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
        y += 16;

        const balance = data.totalAmount - data.paidAmount;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(balance > 0 ? '#dc2626' : '#059669').text('Balance Due', 350, y);
        doc.text(`₹${balance.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
        y += 25;

        // Notes
        if (data.notes) {
            doc.font('Helvetica').fontSize(8).fillColor('#666').text('Notes:', 50, y);
            y += 12;
            doc.fillColor('#1a1a1a').text(data.notes, 50, y, { width: 300 });
        }

        // Footer
        doc.fontSize(8).fillColor('#999').text('Generated by SIDAZ Subscription Management System', 50, 770, { align: 'center', width: 495 });

    doc.end();

    const buffer = await generatePDFBuffer(doc);
    const url = await uploadToFirebase(buffer, filename);
    return url;
}

interface QuotationPDFData {
    templateName: string;
    planName: string;
    validityDays: number;
    recurringPeriod?: string;
    description?: string;
    notes?: string;
    termsAndConditions?: string;
    lines: Array<{
        product: string;
        quantity: number;
        unitPrice: number;
        discount: number;
    }>;
    totalAmount: number;
}

export async function generateQuotationPDF(data: QuotationPDFData): Promise<string> {
    const filename = `quotation_${data.templateName.replace(/[^a-zA-Z0-9-]/g, '_')}_${Date.now()}.pdf`;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Header
        doc.fontSize(24).fillColor('#1E40AF').text('SIDAZ', 50, 50);
        doc.fontSize(10).fillColor('#666').text('Subscription Management System', 50, 78);
        doc.fontSize(20).fillColor('#1a1a1a').text('QUOTATION', 400, 50, { align: 'right' });

        doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e5e7eb').stroke();

        let y = 115;
        doc.fontSize(14).fillColor('#1a1a1a').text(data.templateName, 50, y);
        y += 22;

        doc.fontSize(9).fillColor('#666');
        doc.text(`Plan: ${data.planName}`, 50, y);
        doc.text(`Validity: ${data.validityDays} days`, 250, y);
        if (data.recurringPeriod) doc.text(`Billing: ${data.recurringPeriod}`, 400, y);
        y += 20;

        if (data.description) {
            doc.text(data.description, 50, y, { width: 495 });
            y += 20;
        }

        // Table
        y += 10;
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 8;

        doc.fontSize(8).fillColor('#666');
        doc.text('PRODUCT', 50, y);
        doc.text('QTY', 300, y, { width: 50, align: 'right' });
        doc.text('UNIT PRICE', 360, y, { width: 70, align: 'right' });
        doc.text('DISCOUNT', 435, y, { width: 50, align: 'right' });
        doc.text('SUBTOTAL', 490, y, { width: 55, align: 'right' });
        y += 15;
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 8;

        doc.fontSize(9).fillColor('#1a1a1a');
        for (const line of data.lines) {
            doc.text(line.product, 50, y);
            doc.text(String(line.quantity), 300, y, { width: 50, align: 'right' });
            doc.text(`₹${line.unitPrice.toFixed(2)}`, 360, y, { width: 70, align: 'right' });
            doc.text(line.discount > 0 ? `₹${line.discount.toFixed(2)}` : '-', 435, y, { width: 50, align: 'right' });
            doc.text(`₹${(line.quantity * line.unitPrice - line.discount).toFixed(2)}`, 490, y, { width: 55, align: 'right' });
            y += 18;
        }

        y += 5;
        doc.moveTo(400, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 10;
        doc.fontSize(12).font('Helvetica-Bold').text('Total:', 400, y);
        doc.text(`₹${data.totalAmount.toFixed(2)}`, 490, y, { width: 55, align: 'right' });
        y += 30;

        // Terms
        if (data.termsAndConditions) {
            doc.font('Helvetica').fontSize(10).fillColor('#1a1a1a').text('Terms & Conditions', 50, y);
            y += 15;
            doc.fontSize(8).fillColor('#666').text(data.termsAndConditions, 50, y, { width: 495 });
            y += 30;
        }

        if (data.notes) {
            doc.font('Helvetica').fontSize(10).fillColor('#1a1a1a').text('Notes', 50, y);
            y += 15;
            doc.fontSize(8).fillColor('#666').text(data.notes, 50, y, { width: 495 });
        }

        doc.fontSize(8).fillColor('#999').text('Generated by SIDAZ Subscription Management System', 50, 770, { align: 'center', width: 495 });

    doc.end();

    const buffer = await generatePDFBuffer(doc);
    const url = await uploadToFirebase(buffer, filename);
    return url;
}
