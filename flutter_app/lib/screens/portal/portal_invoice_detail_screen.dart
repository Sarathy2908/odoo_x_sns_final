import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../config/api_config.dart';
import '../../providers/portal_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/enums.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/app_button.dart';

class PortalInvoiceDetailScreen extends StatefulWidget {
  final String invoiceId;

  const PortalInvoiceDetailScreen({
    super.key,
    required this.invoiceId,
  });

  @override
  State<PortalInvoiceDetailScreen> createState() =>
      _PortalInvoiceDetailScreenState();
}

class _PortalInvoiceDetailScreenState extends State<PortalInvoiceDetailScreen> {
  late Razorpay _razorpay;
  bool _isPaymentProcessing = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchInvoice(widget.invoiceId);
    });
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _payNow() async {
    final portalProvider = context.read<PortalProvider>();
    final invoice = portalProvider.selectedInvoice;
    if (invoice == null) return;

    setState(() => _isPaymentProcessing = true);

    try {
      final result = await ApiService.instance.post(
        ApiConfig.razorpayCreateOrder,
        data: {
          'invoiceId': invoice.id,
          'amount': invoice.balanceDue,
        },
      );

      final orderId = result.data['orderId']?.toString();
      final amount =
          (result.data['amount'] as num?)?.toDouble() ?? invoice.balanceDue;

      if (orderId != null && mounted) {
        _openRazorpay(orderId, amount);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isPaymentProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to create payment order.'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  void _openRazorpay(String orderId, double amount) {
    final authProvider = context.read<AuthProvider>();
    var options = {
      'key': AppConstants.razorpayKey,
      'amount': (amount * 100).toInt(),
      'order_id': orderId,
      'name': AppConstants.appName,
      'description': 'Invoice Payment',
      'prefill': {
        'email': authProvider.user?.email ?? '',
      },
    };
    _razorpay.open(options);
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      await ApiService.instance.post(
        ApiConfig.razorpayVerifyPayment,
        data: {
          'razorpay_payment_id': response.paymentId,
          'razorpay_order_id': response.orderId,
          'razorpay_signature': response.signature,
        },
      );

      if (mounted) {
        setState(() => _isPaymentProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful!'),
            backgroundColor: AppColors.success,
          ),
        );
        context.read<PortalProvider>().fetchInvoice(widget.invoiceId);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isPaymentProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content:
                Text('Payment verification failed. Please contact support.'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() => _isPaymentProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text('Payment failed: ${response.message ?? 'Unknown error'}'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              Text('External wallet selected: ${response.walletName ?? ''}'),
          backgroundColor: AppColors.accent,
        ),
      );
    }
  }

  Future<void> _downloadPdf(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open PDF'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final portalProvider = context.watch<PortalProvider>();
    final invoice = portalProvider.selectedInvoice;
    final dateFormat = DateFormat('dd MMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice Details'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: portalProvider.isLoading
          ? const LoadingSpinner(message: 'Loading invoice...')
          : portalProvider.error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: AppColors.danger),
                      const SizedBox(height: 12),
                      Text(portalProvider.error!,
                          style: const TextStyle(
                              color: AppColors.textSecondary)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => portalProvider
                            .fetchInvoice(widget.invoiceId),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : invoice == null
                  ? const Center(child: Text('Invoice not found'))
                  : Column(
                      children: [
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppColors.card,
                                    borderRadius: BorderRadius.circular(12),
                                    border:
                                        Border.all(color: AppColors.border),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            invoice.invoiceNumber,
                                            style: const TextStyle(
                                              fontSize: 20,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          StatusBadge(
                                              status:
                                                  invoice.status.name),
                                        ],
                                      ),
                                      const Divider(height: 24),
                                      _DetailRow(
                                        label: 'Invoice Date',
                                        value: dateFormat.format(
                                            invoice.invoiceDate),
                                      ),
                                      if (invoice.dueDate != null)
                                        _DetailRow(
                                          label: 'Due Date',
                                          value: dateFormat.format(
                                              invoice.dueDate!),
                                        ),
                                      _DetailRow(
                                        label: 'Subtotal',
                                        value:
                                            CurrencyFormatter.format(
                                                invoice.subtotal),
                                      ),
                                      _DetailRow(
                                        label: 'Tax',
                                        value:
                                            CurrencyFormatter.format(
                                                invoice.taxAmount),
                                      ),
                                      _DetailRow(
                                        label: 'Total',
                                        value:
                                            CurrencyFormatter.format(
                                                invoice.totalAmount),
                                        isBold: true,
                                      ),
                                      _DetailRow(
                                        label: 'Paid',
                                        value:
                                            CurrencyFormatter.format(
                                                invoice.paidAmount),
                                      ),
                                      _DetailRow(
                                        label: 'Balance Due',
                                        value:
                                            CurrencyFormatter.format(
                                                invoice.balanceDue),
                                        isBold: true,
                                        valueColor:
                                            invoice.balanceDue > 0
                                                ? AppColors.danger
                                                : AppColors.success,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 20),

                                // Lines
                                if (invoice.lines.isNotEmpty) ...[
                                  const Text(
                                    'Invoice Lines',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  ...invoice.lines.map((line) {
                                    return Container(
                                      margin:
                                          const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: AppColors.card,
                                        borderRadius:
                                            BorderRadius.circular(10),
                                        border: Border.all(
                                            color: AppColors.border),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment
                                                    .spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  line.productName ??
                                                      'Item',
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    fontWeight:
                                                        FontWeight.w600,
                                                    color: AppColors
                                                        .textPrimary,
                                                  ),
                                                ),
                                              ),
                                              Text(
                                                CurrencyFormatter.format(
                                                    line.amount),
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight:
                                                      FontWeight.w600,
                                                  color: AppColors
                                                      .textPrimary,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Qty: ${line.quantity} x ${CurrencyFormatter.format(line.unitPrice)}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors
                                                  .textSecondary,
                                            ),
                                          ),
                                          if (line.taxName != null)
                                            Text(
                                              'Tax: ${line.taxName} (${CurrencyFormatter.format(line.taxAmount)})',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors
                                                    .textSecondary,
                                              ),
                                            ),
                                        ],
                                      ),
                                    );
                                  }),
                                ],
                              ],
                            ),
                          ),
                        ),
                        // Bottom actions
                        if (invoice.pdfUrl != null ||
                            invoice.status == InvoiceStatus.CONFIRMED)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              border: Border(
                                top: BorderSide(color: AppColors.border),
                              ),
                            ),
                            child: SafeArea(
                              child: Column(
                                children: [
                                  if (invoice.pdfUrl != null) ...[
                                    AppButton(
                                      label: 'Download PDF',
                                      icon: Icons.download,
                                      isOutlined: true,
                                      onPressed: () =>
                                          _downloadPdf(invoice.pdfUrl!),
                                    ),
                                    const SizedBox(height: 10),
                                  ],
                                  if (invoice.status ==
                                      InvoiceStatus.CONFIRMED)
                                    _isPaymentProcessing
                                        ? const LoadingSpinner(
                                            message:
                                                'Processing payment...')
                                        : AppButton(
                                            label: 'Pay Now',
                                            icon: Icons.payment,
                                            onPressed: _payNow,
                                          ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: valueColor ??
                  (isBold ? AppColors.primary : AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}
