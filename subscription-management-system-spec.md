# Subscription Management System - Development Specification

## Project Overview
Build a production-grade Subscription Management System for recurring revenue businesses. This is a full-stack web application handling the complete subscription lifecycle: product configuration, recurring billing plans, subscription management, automated invoicing, payment tracking, tax/discount application, and analytics reporting.

## Technical Architecture Requirements

### Stack Specifications
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with proper indexing and foreign key constraints
- **Frontend**: Next.js with TypeScript
- **Authentication**: JWT-based with httpOnly cookies
- **API Design**: RESTful with proper status codes and error handling
- **Validation**: Server-side validation for all inputs
- **Logging**: Structured logging for all operations
- **Error Handling**: Centralized error handling with appropriate error codes

### Database Schema Design

**Users Table**
- id (UUID, primary key)
- email (unique, not null)
- password_hash (not null)
- role (enum: 'admin', 'internal_user', 'portal_user')
- created_at, updated_at
- is_active (boolean)

**Products Table**
- id (UUID, primary key)
- product_name (not null)
- product_type (not null)
- sales_price (decimal, not null)
- cost_price (decimal, not null)
- supports_recurring (boolean, default true)
- created_by (foreign key → users.id)
- created_at, updated_at

**Product_Variants Table**
- id (UUID, primary key)
- product_id (foreign key → products.id, cascade delete)
- attribute (not null)
- value (not null)
- extra_price (decimal, not null)
- created_at, updated_at

**Recurring_Plans Table**
- id (UUID, primary key)
- plan_name (not null)
- price (decimal, not null)
- billing_period (enum: 'daily', 'weekly', 'monthly', 'yearly')
- minimum_quantity (integer, default 1)
- start_date (date, not null)
- end_date (date, nullable)
- auto_close (boolean, default false)
- closable (boolean, default true)
- pausable (boolean, default true)
- renewable (boolean, default true)
- created_at, updated_at

**Subscriptions Table**
- id (UUID, primary key)
- subscription_number (unique, auto-generated)
- customer_id (foreign key → users.id)
- plan_id (foreign key → recurring_plans.id)
- start_date (date, not null)
- expiration_date (date, nullable)
- payment_terms (text)
- status (enum: 'draft', 'quotation', 'confirmed', 'active', 'closed')
- created_at, updated_at

**Subscription_Lines Table**
- id (UUID, primary key)
- subscription_id (foreign key → subscriptions.id, cascade delete)
- product_id (foreign key → products.id)
- quantity (integer, not null)
- unit_price (decimal, not null)
- tax_amount (decimal, default 0)
- total_amount (decimal, computed)
- created_at, updated_at

**Quotation_Templates Table**
- id (UUID, primary key)
- template_name (not null)
- validity_days (integer, not null)
- recurring_plan_id (foreign key → recurring_plans.id)
- created_at, updated_at

**Template_Lines Table**
- id (UUID, primary key)
- template_id (foreign key → quotation_templates.id, cascade delete)
- product_id (foreign key → products.id)
- quantity (integer, not null)
- created_at, updated_at

**Invoices Table**
- id (UUID, primary key)
- invoice_number (unique, auto-generated)
- subscription_id (foreign key → subscriptions.id)
- customer_id (foreign key → users.id)
- invoice_date (date, not null)
- due_date (date, not null)
- subtotal (decimal, not null)
- tax_total (decimal, not null)
- discount_total (decimal, default 0)
- grand_total (decimal, not null)
- status (enum: 'draft', 'confirmed', 'paid')
- created_at, updated_at

**Invoice_Lines Table**
- id (UUID, primary key)
- invoice_id (foreign key → invoices.id, cascade delete)
- product_id (foreign key → products.id)
- quantity (integer, not null)
- unit_price (decimal, not null)
- tax_amount (decimal, default 0)
- line_total (decimal, computed)
- created_at, updated_at

**Payments Table**
- id (UUID, primary key)
- invoice_id (foreign key → invoices.id)
- payment_method (not null)
- amount (decimal, not null)
- payment_date (date, not null)
- reference_number (unique)
- created_at, updated_at

**Discounts Table**
- id (UUID, primary key)
- discount_name (not null)
- type (enum: 'fixed', 'percentage')
- value (decimal, not null)
- minimum_purchase (decimal, nullable)
- minimum_quantity (integer, nullable)
- start_date (date, not null)
- end_date (date, nullable)
- limit_usage (integer, nullable)
- usage_count (integer, default 0)
- applies_to (enum: 'products', 'subscriptions')
- created_by (foreign key → users.id)
- created_at, updated_at

**Discount_Products Table** (many-to-many)
- discount_id (foreign key → discounts.id)
- product_id (foreign key → products.id)
- primary key (discount_id, product_id)

**Taxes Table**
- id (UUID, primary key)
- tax_name (not null)
- tax_type (not null)
- percentage (decimal, not null)
- is_active (boolean, default true)
- created_at, updated_at

## Business Logic Requirements

### Authentication & Authorization
- Password validation: minimum 8 characters, uppercase, lowercase, special character
- Email uniqueness enforcement
- Password reset with email verification and expiring tokens
- Role-based access control:
  - Admin: full CRUD on all entities
  - Internal User: read/update limited entities
  - Portal User: view own subscriptions and invoices
- JWT token expiration: 24 hours
- Refresh token mechanism

### Product Management
- CRUD operations for products (Admin only for create/delete)
- Product variants with attribute-value-price mapping
- Validation: sales_price must be greater than cost_price
- Support for recurring pricing configuration

### Recurring Plan Management
- CRUD operations for plans
- Validation: end_date must be after start_date
- Billing period calculation logic
- Plan status checks (active vs expired based on dates)

### Subscription Lifecycle
- Status transitions with validation:
  - Draft → Quotation (requires customer and plan)
  - Quotation → Confirmed (requires approval)
  - Confirmed → Active (requires payment or grace period)
  - Active → Closed (manual or auto-close based on plan)
- Prevent backward status transitions
- Auto-generate unique subscription_number
- Calculate subscription line totals including taxes

### Invoice Generation
- Automatic invoice creation from active subscriptions based on billing period
- Auto-generate unique invoice_number
- Calculate subtotal, tax_total, discount_total, grand_total
- Apply applicable discounts during invoice generation
- Apply tax rules to invoice lines
- Invoice confirmation validation
- Track invoice payment status

### Payment Processing
- Record payments against invoices
- Update invoice status to 'paid' when full amount received
- Support partial payments
- Track outstanding amounts
- Prevent overpayment

### Discount Management
- Admin-only creation
- Validation: end_date after start_date
- Check minimum purchase and quantity requirements
- Enforce usage limits
- Auto-increment usage_count on application
- Calculate fixed vs percentage discounts correctly

### Tax Management
- Auto-calculate taxes on invoice lines
- Support multiple tax types
- Tax percentage validation (0-100)
- Apply active taxes only

### Reporting Module
- Active subscriptions count and list
- Total revenue calculation
- Payment tracking (received vs pending)
- Overdue invoices identification
- Date range filtering
- Export capabilities (CSV)

## API Endpoint Structure

### Authentication
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/reset-password-request
- POST /api/auth/reset-password

### Products
- GET /api/products (with pagination, search, filter)
- POST /api/products (admin only)
- GET /api/products/:id
- PUT /api/products/:id (admin only)
- DELETE /api/products/:id (admin only)
- POST /api/products/:id/variants
- GET /api/products/:id/variants

### Recurring Plans
- GET /api/recurring-plans
- POST /api/recurring-plans
- GET /api/recurring-plans/:id
- PUT /api/recurring-plans/:id
- DELETE /api/recurring-plans/:id

### Subscriptions
- GET /api/subscriptions
- POST /api/subscriptions
- GET /api/subscriptions/:id
- PUT /api/subscriptions/:id
- PATCH /api/subscriptions/:id/status
- POST /api/subscriptions/:id/lines
- DELETE /api/subscriptions/:id

### Quotation Templates
- GET /api/quotation-templates
- POST /api/quotation-templates
- GET /api/quotation-templates/:id
- PUT /api/quotation-templates/:id
- DELETE /api/quotation-templates/:id

### Invoices
- GET /api/invoices
- POST /api/invoices/generate/:subscriptionId
- GET /api/invoices/:id
- PATCH /api/invoices/:id/confirm
- PATCH /api/invoices/:id/cancel
- POST /api/invoices/:id/send
- GET /api/invoices/:id/pdf

### Payments
- GET /api/payments
- POST /api/payments
- GET /api/payments/:id

### Discounts
- GET /api/discounts
- POST /api/discounts (admin only)
- GET /api/discounts/:id
- PUT /api/discounts/:id (admin only)
- DELETE /api/discounts/:id (admin only)

### Taxes
- GET /api/taxes
- POST /api/taxes
- GET /api/taxes/:id
- PUT /api/taxes/:id
- DELETE /api/taxes/:id

### Reports
- GET /api/reports/dashboard
- GET /api/reports/subscriptions
- GET /api/reports/revenue
- GET /api/reports/payments
- GET /api/reports/overdue-invoices

## Frontend Requirements

### Component Structure
- Modular component architecture
- Reusable form components with validation
- Data tables with pagination, sorting, filtering
- Modal dialogs for create/edit operations
- Toast notifications for user feedback
- Loading states and error boundaries

### Key Pages
- Login/Signup/Reset Password
- Dashboard (analytics overview)
- Products List/Create/Edit
- Recurring Plans List/Create/Edit
- Subscriptions List/Create/Edit/View
- Invoices List/View/Print
- Payments List/Create
- Discounts List/Create/Edit (admin)
- Taxes List/Create/Edit
- Reports (multiple views)
- User Management (admin)

### UX Requirements
- Responsive design (mobile, tablet, desktop)
- Form validation with inline error messages
- Confirmation dialogs for destructive actions
- Search and filter functionality on list pages
- Export functionality for reports
- Breadcrumb navigation
- Clear status indicators for subscriptions/invoices

## Performance Requirements
- API response time: under 2 seconds for all endpoints
- Database queries: use indexes on frequently queried fields
- Pagination: default 25 items per page
- Caching: implement Redis for frequently accessed data
- Connection pooling for database connections

## Security Requirements
- SQL injection prevention (use parameterized queries)
- XSS prevention (sanitize inputs)
- CSRF protection
- Rate limiting on API endpoints
- Secure password hashing (bcrypt with salt rounds 10+)
- Input validation on both client and server
- HTTPS enforcement
- Secure session management

## Testing Requirements
- Unit tests for business logic functions
- Integration tests for API endpoints
- Validation tests for all input constraints
- Authentication and authorization tests
- Database transaction rollback on errors

## Development Guidelines
- Use environment variables for configuration
- Implement proper error logging
- Follow consistent naming conventions
- Add database migrations for schema changes
- Document complex business logic
- Use transaction management for multi-table operations
- Implement soft deletes where appropriate
- Add created_at/updated_at timestamps to all tables

## Deliverables
1. Complete backend API with all endpoints
2. Database schema with migrations
3. Frontend application with all required pages
4. Authentication and authorization system
5. Business logic implementation for all modules
6. Basic reporting dashboard
7. README with setup instructions
8. Environment configuration template

Build this as a production-ready system with proper error handling, validation, security, and scalability considerations.
