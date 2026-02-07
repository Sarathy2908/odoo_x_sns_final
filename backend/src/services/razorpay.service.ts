import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_TEST_API || '',
    key_secret: process.env.RAZORPAY_TEST_SECRET || '',
});

export const createRazorpayOrder = async (
    amount: number,
    currency: string = 'INR',
    receipt: string,
    notes: Record<string, string> = {}
) => {
    const options = {
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency,
        receipt,
        notes,
    };
    const order = await razorpay.orders.create(options);
    return order;
};

export const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_TEST_SECRET || '')
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
};
