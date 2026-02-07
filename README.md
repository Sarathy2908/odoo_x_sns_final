# Subscription Management System

A comprehensive ERP-style subscription management platform with recurring billing, invoice automation, payment tracking, and analytics.

## Features

- **Authentication**: JWT-based authentication with role-based access control (Admin, Internal User, Portal User)
- **Products Management**: Product catalog with variants and pricing
- **Recurring Plans**: Flexible billing periods (Daily/Weekly/Monthly/Yearly)
- **Subscriptions**: Complete subscription lifecycle management
- **Invoices**: Automated invoice generation with tax calculation
- **Payments**: Payment tracking and settlement
- **Discounts**: Admin-only discount management
- **Taxes**: AI-powered tax suggestions based on location and product type
- **Users**: Role-based user management
- **Reports**: Analytics dashboard with metrics and insights

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Bcrypt password hashing
- Nodemailer for emails

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Premium UI with glassmorphism effects

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and SMTP settings
```

4. Run database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Default Credentials

After setting up, you'll need to create an admin user via signup. The first user can be manually set to ADMIN role in the database.

## API Documentation

The backend exposes RESTful APIs at `http://localhost:5000/api`:

- `/auth` - Authentication endpoints
- `/products` - Product management
- `/plans` - Recurring plans
- `/subscriptions` - Subscription management
- `/invoices` - Invoice operations
- `/payments` - Payment tracking
- `/taxes` - Tax management with AI suggestions
- `/discounts` - Discount rules
- `/users` - User management
- `/reports` - Analytics and reports

## Role-Based Access Control

- **Admin**: Full system control, can create internal users, manage all configurations
- **Internal User**: Operational staff managing subscriptions, invoices, and customers
- **Portal User**: Customers who can view their own subscriptions and invoices

## License

MIT
