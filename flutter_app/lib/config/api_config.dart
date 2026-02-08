class ApiConfig {
  static const String baseUrl = 'https://odoo-x-sns-final.vercel.app/api';

  // Auth
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';
  static const String resetPasswordRequest = '/auth/reset-password-request';
  static const String resetPassword = '/auth/reset-password';
  static const String me = '/auth/me';

  // Products
  static const String products = '/products';

  // Plans
  static const String plans = '/plans';

  // Subscriptions
  static const String subscriptions = '/subscriptions';

  // Quotations
  static const String quotations = '/quotations';

  // Invoices
  static const String invoices = '/invoices';

  // Payments
  static const String payments = '/payments';

  // Discounts
  static const String discounts = '/discounts';
  static const String discountValidate = '/discounts/validate';

  // Taxes
  static const String taxes = '/taxes';

  // Users
  static const String users = '/users';

  // Contacts
  static const String contacts = '/contacts';

  // Attributes
  static const String attributes = '/attributes';

  // Reports
  static const String reportsDashboard = '/reports/dashboard';
  static const String reportsSubscriptions = '/reports/subscriptions';
  static const String reportsRevenue = '/reports/revenue';
  static const String reportsPayments = '/reports/payments';
  static const String reportsOverdue = '/reports/overdue-invoices';

  // Razorpay
  static const String razorpayCreateOrder = '/razorpay/create-order';
  static const String razorpayVerifyPayment = '/razorpay/verify-payment';

  // PDF
  static const String pdfInvoice = '/pdf/invoice';
  static const String pdfQuotation = '/pdf/quotation';

  // Portal
  static const String portalDashboard = '/portal/dashboard';
  static const String portalCatalog = '/portal/catalog';
  static const String portalSubscriptions = '/portal/subscriptions';
  static const String portalInvoices = '/portal/invoices';
  static const String portalPayments = '/portal/payments';
  static const String portalProfile = '/portal/profile';
  static const String portalSubscribe = '/portal/subscribe';
}
