import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/portal_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';

class PortalSubscriptionsScreen extends StatefulWidget {
  const PortalSubscriptionsScreen({super.key});

  @override
  State<PortalSubscriptionsScreen> createState() =>
      _PortalSubscriptionsScreenState();
}

class _PortalSubscriptionsScreenState extends State<PortalSubscriptionsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchSubscriptions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final portalProvider = context.watch<PortalProvider>();
    final dateFormat = DateFormat('dd MMM yyyy');

    if (portalProvider.isLoading && portalProvider.subscriptions.isEmpty) {
      return const LoadingSpinner(message: 'Loading subscriptions...');
    }

    if (portalProvider.error != null && portalProvider.subscriptions.isEmpty) {
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
              onPressed: () => portalProvider.fetchSubscriptions(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (portalProvider.subscriptions.isEmpty) {
      return EmptyState(
        icon: Icons.subscriptions_outlined,
        title: 'No Subscriptions',
        subtitle: 'You don\'t have any subscriptions yet.',
        actionLabel: 'Browse Plans',
        onAction: () => Navigator.pushNamed(context, '/portal/catalog'),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => portalProvider.fetchSubscriptions(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: portalProvider.subscriptions.length,
        itemBuilder: (context, index) {
          final sub = portalProvider.subscriptions[index];
          return GestureDetector(
            onTap: () => Navigator.pushNamed(
              context,
              '/portal/subscription-detail',
              arguments: sub.id,
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
                      Expanded(
                        child: Text(
                          sub.planName ?? 'Subscription',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      StatusBadge(status: sub.status.name),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today,
                          size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        'Start: ${dateFormat.format(sub.startDate)}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  if (sub.expirationDate != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.event,
                            size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 6),
                        Text(
                          'End: ${dateFormat.format(sub.expirationDate!)}',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        CurrencyFormatter.format(sub.recurringTotal),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const Icon(Icons.chevron_right,
                          color: AppColors.textSecondary),
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
