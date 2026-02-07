import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/portal_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/status_badge.dart';

class PortalSubscriptionDetailScreen extends StatefulWidget {
  final String subscriptionId;

  const PortalSubscriptionDetailScreen({
    super.key,
    required this.subscriptionId,
  });

  @override
  State<PortalSubscriptionDetailScreen> createState() =>
      _PortalSubscriptionDetailScreenState();
}

class _PortalSubscriptionDetailScreenState
    extends State<PortalSubscriptionDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchSubscription(widget.subscriptionId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final portalProvider = context.watch<PortalProvider>();
    final sub = portalProvider.selectedSubscription;
    final dateFormat = DateFormat('dd MMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription Details'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: portalProvider.isLoading
          ? const LoadingSpinner(message: 'Loading details...')
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
                            .fetchSubscription(widget.subscriptionId),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : sub == null
                  ? const Center(
                      child: Text('Subscription not found'),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header card
                          Container(
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
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        sub.planName ?? 'Subscription',
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ),
                                    StatusBadge(status: sub.status.name),
                                  ],
                                ),
                                const Divider(height: 24),
                                _DetailRow(
                                  label: 'Start Date',
                                  value: dateFormat.format(sub.startDate),
                                ),
                                if (sub.expirationDate != null)
                                  _DetailRow(
                                    label: 'End Date',
                                    value: dateFormat.format(sub.expirationDate!),
                                  ),
                                _DetailRow(
                                  label: 'Total Amount',
                                  value: CurrencyFormatter.format(
                                      sub.recurringTotal),
                                  isBold: true,
                                ),
                                if (sub.internalNotes != null &&
                                    sub.internalNotes!.isNotEmpty)
                                  _DetailRow(
                                    label: 'Notes',
                                    value: sub.internalNotes!,
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Lines
                          if (sub.lines.isNotEmpty) ...[
                            const Text(
                              'Subscription Lines',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ...sub.lines.map((line) {
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(10),
                                  border:
                                      Border.all(color: AppColors.border),
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
                                            line.productName ??
                                                'Product',
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color:
                                                  AppColors.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Qty: ${line.quantity} x ${CurrencyFormatter.format(line.unitPrice)}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color:
                                                  AppColors.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      CurrencyFormatter.format(
                                          line.amount),
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],

                          // History
                          if (sub.history.isNotEmpty) ...[
                            const SizedBox(height: 20),
                            const Text(
                              'History',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ...sub.history.map((h) {
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(10),
                                  border:
                                      Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            h.action,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                              color:
                                                  AppColors.textPrimary,
                                            ),
                                          ),
                                          if (h.description != null)
                                            Text(
                                              h.description!,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors
                                                    .textSecondary,
                                              ),
                                            ),
                                          Text(
                                            dateFormat.format(h.createdAt),
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color:
                                                  AppColors.textSecondary,
                                            ),
                                          ),
                                        ],
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
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
                color: isBold ? AppColors.primary : AppColors.textPrimary,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
