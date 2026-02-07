import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../config/api_config.dart';
import '../../providers/cart_provider.dart';
import '../../providers/portal_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/app_button.dart';
import '../../widgets/loading_spinner.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String? _orderId;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _initiatePayment() async {
    final cartProvider = context.read<CartProvider>();
    final portalProvider = context.read<PortalProvider>();

    if (cartProvider.isEmpty) return;

    setState(() => _isProcessing = true);

    try {
      final result = await portalProvider.subscribe({
        'items': cartProvider.toJsonList(),
        'totalAmount': cartProvider.totalAmount,
      });

      _orderId = result['orderId']?.toString();
      final amount = (result['amount'] as num?)?.toDouble() ??
          cartProvider.totalAmount;

      if (_orderId != null && mounted) {
        _openRazorpay(_orderId!, amount);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to create order. Please try again.'),
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
      'description': 'Subscription Payment',
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
        context.read<CartProvider>().clear();
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/portal/confirmation',
          (route) => route.settings.name == '/portal',
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment verification failed. Please contact support.'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Payment failed: ${response.message ?? 'Unknown error'}'),
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

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: cartProvider.isEmpty
          ? const Center(
              child: Text(
                'Your cart is empty',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Order Summary',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Items list
                        ...cartProvider.items.map((item) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.plan.name,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Qty: ${item.quantity} x ${CurrencyFormatter.format(item.plan.price)}',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  CurrencyFormatter.format(item.total),
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 16),
                        // Total
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color:
                                    AppColors.primary.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Total Amount',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                CurrencyFormatter.format(
                                    cartProvider.totalAmount),
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Pay button
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    border: Border(
                      top: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: SafeArea(
                    child: _isProcessing
                        ? const LoadingSpinner(
                            message: 'Processing payment...')
                        : AppButton(
                            label: 'Pay with Razorpay',
                            icon: Icons.payment,
                            onPressed: _initiatePayment,
                          ),
                  ),
                ),
              ],
            ),
    );
  }
}
