import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/subscriptions_provider.dart';
import '../../models/subscription.dart';
import '../../utils/enums.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/responsive.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/app_button.dart';
import '../../widgets/confirm_dialog.dart';

class SubscriptionDetailScreen extends StatefulWidget {
  final String subscriptionId;

  const SubscriptionDetailScreen({super.key, required this.subscriptionId});

  @override
  State<SubscriptionDetailScreen> createState() => _SubscriptionDetailScreenState();
}

class _SubscriptionDetailScreenState extends State<SubscriptionDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => context.read<SubscriptionsProvider>().fetchOne(widget.subscriptionId),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription Details'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Consumer<SubscriptionsProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.selected == null) {
            return const LoadingSpinner();
          }

          final sub = provider.selected;
          if (sub == null) {
            return const Center(child: Text('Subscription not found'));
          }

          final padding = Responsive.horizontalPadding(context);

          return ListView(
            padding: EdgeInsets.all(padding),
            children: [
              _buildInfoCard(sub),
              const SizedBox(height: 16),
              _buildLinesTable(sub),
              const SizedBox(height: 16),
              _buildStatusActions(sub, provider),
              if (sub.history.isNotEmpty) ...[
                const SizedBox(height: 24),
                _buildHistoryTimeline(sub),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _buildInfoCard(Subscription sub) {
    final startStr =
        '${sub.startDate.day}/${sub.startDate.month}/${sub.startDate.year}';
    final endStr = sub.expirationDate != null
        ? '${sub.expirationDate!.day}/${sub.expirationDate!.month}/${sub.expirationDate!.year}'
        : 'Ongoing';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    sub.contactName ?? sub.customerName ?? 'N/A',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ),
                StatusBadge(status: sub.status.name),
              ],
            ),
            const Divider(height: 24),
            _infoRow('Plan', sub.planName ?? 'N/A'),
            _infoRow('Email', sub.customerEmail ?? 'N/A'),
            _infoRow('Start Date', startStr),
            _infoRow('End Date', endStr),
            _infoRow('Total', CurrencyFormatter.format(sub.recurringTotal)),
            if (sub.internalNotes != null && sub.internalNotes!.isNotEmpty)
              _infoRow('Notes', sub.internalNotes!),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinesTable(Subscription sub) {
    if (sub.lines.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No line items',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Line Items',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(
                  AppColors.primary.withValues(alpha: 0.05),
                ),
                columnSpacing: 20,
                columns: const [
                  DataColumn(label: Text('Product', style: TextStyle(fontWeight: FontWeight.w600))),
                  DataColumn(label: Text('Qty', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                  DataColumn(label: Text('Unit Price', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                  DataColumn(label: Text('Discount', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                  DataColumn(label: Text('Amount', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                ],
                rows: sub.lines.map((line) {
                  return DataRow(cells: [
                    DataCell(Text(line.productName ?? 'N/A')),
                    DataCell(Text('${line.quantity}')),
                    DataCell(Text(CurrencyFormatter.format(line.unitPrice))),
                    DataCell(Text(line.discount > 0 ? '${line.discount.toStringAsFixed(1)}%' : '-')),
                    DataCell(Text(
                      CurrencyFormatter.format(line.amount),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    )),
                  ]);
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusActions(Subscription sub, SubscriptionsProvider provider) {
    Widget? actionButton;

    switch (sub.status) {
      case SubscriptionStatus.DRAFT:
        actionButton = AppButton(
          label: 'Send Quotation',
          icon: Icons.send,
          color: AppColors.warning,
          onPressed: () => _updateStatus(provider, sub.id, 'QUOTATION'),
        );
        break;
      case SubscriptionStatus.QUOTATION:
        actionButton = AppButton(
          label: 'Confirm',
          icon: Icons.check_circle,
          color: AppColors.accent,
          onPressed: () => _updateStatus(provider, sub.id, 'CONFIRMED'),
        );
        break;
      case SubscriptionStatus.CONFIRMED:
        actionButton = AppButton(
          label: 'Activate',
          icon: Icons.play_arrow,
          color: AppColors.success,
          onPressed: () => _updateStatus(provider, sub.id, 'ACTIVE'),
        );
        break;
      case SubscriptionStatus.ACTIVE:
        actionButton = AppButton(
          label: 'Close',
          icon: Icons.stop_circle,
          color: AppColors.danger,
          onPressed: () async {
            final confirmed = await ConfirmDialog.show(
              context,
              title: 'Close Subscription',
              message: 'Are you sure you want to close this subscription?',
              confirmText: 'Close',
              confirmColor: AppColors.danger,
            );
            if (confirmed == true) {
              _updateStatus(provider, sub.id, 'CLOSED');
            }
          },
        );
        break;
      case SubscriptionStatus.CLOSED:
        actionButton = null;
        break;
    }

    if (actionButton == null) return const SizedBox.shrink();

    return actionButton;
  }

  Future<void> _updateStatus(
    SubscriptionsProvider provider,
    String id,
    String status,
  ) async {
    final success = await provider.updateStatus(id, status);
    if (success && mounted) {
      await provider.fetchOne(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to $status'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }

  Widget _buildHistoryTimeline(Subscription sub) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'History',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            ...sub.history.map((h) {
              final dateStr =
                  '${h.createdAt.day}/${h.createdAt.month}/${h.createdAt.year} ${h.createdAt.hour}:${h.createdAt.minute.toString().padLeft(2, '0')}';
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        if (sub.history.last != h)
                          Container(
                            width: 2,
                            height: 30,
                            color: AppColors.border,
                          ),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            h.action,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          if (h.description != null)
                            Text(
                              h.description!,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                          Text(
                            dateStr,
                            style: TextStyle(
                              color: AppColors.textSecondary.withValues(alpha: 0.7),
                              fontSize: 11,
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
        ),
      ),
    );
  }
}
