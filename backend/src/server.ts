import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import plansRoutes from './routes/plans.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import quotationsRoutes from './routes/quotations.routes';
import invoicesRoutes from './routes/invoices.routes';
import paymentsRoutes from './routes/payments.routes';
import discountsRoutes from './routes/discounts.routes';
import taxesRoutes from './routes/taxes.routes';
import usersRoutes from './routes/users.routes';
import reportsRoutes from './routes/reports.routes';
import razorpayRoutes from './routes/razorpay.routes';
import contactsRoutes from './routes/contacts.routes';
import attributesRoutes from './routes/attributes.routes';
import pdfRoutes from './routes/pdf.routes';
import portalRoutes from './routes/portal.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001',
    ],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Subscription Management System API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/taxes', taxesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/attributes', attributesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/portal', portalRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   Subscription Management System API                  ║
║   Server running on http://localhost:${PORT}           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
