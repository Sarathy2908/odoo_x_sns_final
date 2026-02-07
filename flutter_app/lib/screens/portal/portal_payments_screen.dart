import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/portal_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';

class PortalPaymentsScreen extends StatefulWidget {
  const PortalPaymentsScreen({super.key});

  @override
  State<PortalPaymentsScreen> createState() => _PortalPaymentsScreenState();
}

class _PortalPaymentsScreenState extends State<PortalPaymentsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchPayments();
    });
  }

  @override
  Widget build(BuildContext context) {
    final portalProvider = context.watch<PortalProvider>();
    final dateFormat = DateFormat('dd MMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _buildBody(portalProvider, dateFormat),
    );
  }

  Widget _buildBody(PortalProvider portalProvider, DateFormat dateFormat) {
    if (portalProvider.isLoading && portalProvider.payments.isEmpty) {
      return const LoadingSpinner(message: 'Loading payments...');
    }

    if (portalProvider.error != null && portalProvider.payments.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(portalProvider.error!,
                style: const TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => portalProvider.fetchPayments(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (portalProvider.payments.isEmpty) {
      return const EmptyState(
        icon: Icons.payment_outlined,
        title: 'No Payments',
        subtitle: 'You haven\'t made any payments yet.',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => portalProvider.fetchPayments(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: portalProvider.payments.length,
        itemBuilder: (context, index) {
          final payment = portalProvider.payments[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        payment.invoiceNumber ?? 'Payment',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge(status: payment.status.name),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          CurrencyFormatter.format(payment.amount),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.credit_card,
                                size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(
                              payment.paymentMethod.name.replaceAll('_', ' '),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_today,
                                size: 12, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(
                              dateFormat.format(payment.paymentDate),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        if (payment.reference != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Txn: ${payment.reference!.length > 12 ? '${payment.reference!.substring(0, 12)}...' : payment.reference!}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
