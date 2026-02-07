import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/portal_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';

class PortalInvoicesScreen extends StatefulWidget {
  const PortalInvoicesScreen({super.key});

  @override
  State<PortalInvoicesScreen> createState() => _PortalInvoicesScreenState();
}

class _PortalInvoicesScreenState extends State<PortalInvoicesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchInvoices();
    });
  }

  @override
  Widget build(BuildContext context) {
    final portalProvider = context.watch<PortalProvider>();
    final dateFormat = DateFormat('dd MMM yyyy');

    if (portalProvider.isLoading && portalProvider.invoices.isEmpty) {
      return const LoadingSpinner(message: 'Loading invoices...');
    }

    if (portalProvider.error != null && portalProvider.invoices.isEmpty) {
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
              onPressed: () => portalProvider.fetchInvoices(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (portalProvider.invoices.isEmpty) {
      return const EmptyState(
        icon: Icons.receipt_long_outlined,
        title: 'No Invoices',
        subtitle: 'You don\'t have any invoices yet.',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => portalProvider.fetchInvoices(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: portalProvider.invoices.length,
        itemBuilder: (context, index) {
          final invoice = portalProvider.invoices[index];
          return GestureDetector(
            onTap: () => Navigator.pushNamed(
              context,
              '/portal/invoice-detail',
              arguments: invoice.id,
            ),
            child: Container(
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
                      Text(
                        invoice.invoiceNumber,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      StatusBadge(status: invoice.status.name),
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
                            'Amount: ${CurrencyFormatter.format(invoice.totalAmount)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Paid: ${CurrencyFormatter.format(invoice.paidAmount)}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (invoice.dueDate != null)
                            Text(
                              'Due: ${dateFormat.format(invoice.dueDate!)}',
                              style: TextStyle(
                                fontSize: 12,
                                color: invoice.dueDate!
                                        .isBefore(DateTime.now())
                                    ? AppColors.danger
                                    : AppColors.textSecondary,
                                fontWeight: invoice.dueDate!
                                        .isBefore(DateTime.now())
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          const SizedBox(height: 4),
                          const Icon(Icons.chevron_right,
                              color: AppColors.textSecondary),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
