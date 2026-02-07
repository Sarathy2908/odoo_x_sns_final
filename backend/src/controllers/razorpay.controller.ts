import { Response } from 'express';
import { PrismaClient, SubscriptionStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { AuthRequest } from '../types';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.service';
import { sendInvoiceEmail } from '../services/email.service';

const prisma = new PrismaClient();

export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { lines: true, plan: true },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (subscription.status !== SubscriptionStatus.DRAFT) {
            return res.status(400).json({ error: 'Only DRAFT subscriptions can initiate payment' });
        }

        // Compute amount: sum of line amounts, or plan price if no lines
        let amount = subscription.lines.reduce((sum, line) => sum + line.amount, 0);
        if (amount === 0 && subscription.plan) {
            amount = subscription.plan.price;
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Subscription has no payable amount' });
        }

        const order = await createRazorpayOrder(
            amount,
            'INR',
            subscription.subscriptionNumber,
            { subscriptionId: subscription.id }
        );

        // Set expiry to 24 hours from now
        const paymentLinkExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                razorpayOrderId: order.id,
                amountDue: amount,
                status: SubscriptionStatus.CONFIRMED,
                paymentLinkExpiry,
            },
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_TEST_API,
            subscriptionNumber: subscription.subscriptionNumber,
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'All payment verification fields are required' });
        }

        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        const subscription = await prisma.subscription.findFirst({
            where: { razorpayOrderId: razorpay_order_id },
        });

        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found for this order' });
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                razorpayPaymentId: razorpay_payment_id,
                status: SubscriptionStatus.ACTIVE,
                amountDue: 0,
            },
            include: {
                plan: true,
                customer: { select: { id: true, name: true, email: true } },
                lines: { include: { product: true, tax: true } },
            },
        });

        // Log history
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: subscription.id,
                action: 'payment',
                fromStatus: subscription.status,
                toStatus: 'ACTIVE',
                description: `Payment completed. Razorpay Payment ID: ${razorpay_payment_id}`,
            },
        });

        // Auto-create invoice
        try {
            const invoiceCount = await prisma.invoice.count();
            const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

            // Build invoice lines from subscription lines, or use plan price
            let subtotal = 0;
            let taxAmount = 0;
            const invoiceLines: any[] = [];

            if (updatedSubscription.lines.length > 0) {
                for (const line of updatedSubscription.lines) {
                    const lineDiscount = line.discount || 0;
                    const lineSubtotal = (line.quantity * line.unitPrice) - lineDiscount;
                    const lineTax = line.tax ? (lineSubtotal * line.tax.rate) / 100 : 0;
                    subtotal += lineSubtotal;
                    taxAmount += lineTax;
                    invoiceLines.push({
                        productId: line.productId,
                        description: line.product.name,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        discount: lineDiscount,
                        taxId: line.taxId,
                        taxAmount: lineTax,
                        amount: lineSubtotal + lineTax,
                    });
                }
            } else if (updatedSubscription.plan) {
                subtotal = updatedSubscription.plan.price;
                // Find or create a default product for plan subscriptions
                let defaultProduct = await prisma.product.findFirst({
                    where: { name: 'Subscription Plan', productType: 'Service' },
                });
                if (!defaultProduct) {
                    defaultProduct = await prisma.product.create({
                        data: {
                            name: 'Subscription Plan',
                            productType: 'Service',
                            salesPrice: 0,
                            costPrice: 0,
                            description: 'Auto-created product for plan-based subscriptions',
                        },
                    });
                }
                invoiceLines.push({
                    productId: defaultProduct.id,
                    description: updatedSubscription.plan.name,
                    quantity: 1,
                    unitPrice: updatedSubscription.plan.price,
                    discount: 0,
                    taxAmount: 0,
                    amount: updatedSubscription.plan.price,
                });
            }

            const totalAmount = subtotal + taxAmount;

            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber,
                    customerId: updatedSubscription.customerId,
                    contactId: updatedSubscription.contactId,
                    subscriptionId: updatedSubscription.id,
                    invoiceDate: new Date(),
                    dueDate: new Date(),
                    status: InvoiceStatus.PAID,
                    subtotal,
                    taxAmount,
                    totalAmount,
                    paidAmount: totalAmount,
                    notes: `Auto-generated on payment. Razorpay Payment ID: ${razorpay_payment_id}`,
                    lines: { create: invoiceLines },
                },
            });

            // Create payment record
            await prisma.payment.create({
                data: {
                    invoiceId: invoice.id,
                    customerId: updatedSubscription.customerId,
                    amount: totalAmount,
                    paymentMethod: PaymentMethod.OTHER,
                    status: PaymentStatus.COMPLETED,
                    reference: razorpay_payment_id,
                    notes: `Razorpay Order: ${razorpay_order_id}`,
                },
            });

            // Send invoice email (non-blocking)
            if (updatedSubscription.customer?.email) {
                sendInvoiceEmail({
                    customerName: updatedSubscription.customer.name,
                    customerEmail: updatedSubscription.customer.email,
                    invoiceNumber,
                    subscriptionNumber: updatedSubscription.subscriptionNumber,
                    planName: updatedSubscription.plan?.name || 'Subscription',
                    amount: totalAmount,
                    paymentId: razorpay_payment_id,
                    invoiceDate: new Date().toLocaleDateString('en-IN'),
                }).catch(err => console.error('Invoice email error:', err));
            }

            console.log('Auto-created invoice:', invoiceNumber, 'for subscription:', updatedSubscription.subscriptionNumber);
        } catch (invoiceErr) {
            console.error('Auto-invoice creation failed (payment still succeeded):', invoiceErr);
        }

        res.json({ message: 'Payment verified successfully', subscriptionId: subscription.id });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
};
