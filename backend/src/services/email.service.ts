import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined,
});

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    };

    try {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
            console.log('Password reset email sent to:', email);
        } else {
            console.log('Email not configured. Reset link:', resetLink);
        }
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send password reset email');
    }
};

interface InvoiceEmailData {
    customerName: string;
    customerEmail: string;
    invoiceNumber: string;
    subscriptionNumber: string;
    planName: string;
    amount: number;
    paymentId: string;
    invoiceDate: string;
}

export const sendInvoiceEmail = async (data: InvoiceEmailData) => {
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"SIDAZ" <noreply@sidaz.com>',
        to: data.customerEmail,
        subject: `Invoice ${data.invoiceNumber} - Payment Confirmed`,
        html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: #714B67; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">SIDAZ</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Subscription Management</p>
        </div>

        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a; margin: 0 0 8px; font-size: 18px;">Payment Confirmed</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">Hi ${data.customerName}, your payment has been received successfully.</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #666;">Invoice No.</td>
                <td style="padding: 6px 0; color: #1a1a1a; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Subscription</td>
                <td style="padding: 6px 0; color: #1a1a1a; text-align: right;">${data.subscriptionNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Plan</td>
                <td style="padding: 6px 0; color: #1a1a1a; text-align: right;">${data.planName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Date</td>
                <td style="padding: 6px 0; color: #1a1a1a; text-align: right;">${data.invoiceDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Payment ID</td>
                <td style="padding: 6px 0; color: #1a1a1a; text-align: right; font-size: 12px;">${data.paymentId}</td>
              </tr>
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 12px 0 6px; color: #1a1a1a; font-weight: 700; font-size: 16px;">Amount Paid</td>
                <td style="padding: 12px 0 6px; color: #059669; font-weight: 700; font-size: 16px; text-align: right;">₹${data.amount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${portalUrl}/portal/subscriptions" style="display: inline-block; padding: 12px 28px; background-color: #714B67; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              View My Subscriptions
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from SIDAZ. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    };

    try {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            await transporter.sendMail(mailOptions);
            console.log('Invoice email sent to:', data.customerEmail);
        } else {
            console.log('Email not configured. Invoice details:', data.invoiceNumber, 'for', data.customerEmail);
        }
    } catch (error) {
        console.error('Error sending invoice email:', error);
        // Don't throw — email failure shouldn't block the payment flow
    }
};
