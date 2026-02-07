import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/portal_provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/app_button.dart';

class PortalHomeScreen extends StatefulWidget {
  const PortalHomeScreen({super.key});

  @override
  State<PortalHomeScreen> createState() => _PortalHomeScreenState();
}

class _PortalHomeScreenState extends State<PortalHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final portalProvider = context.watch<PortalProvider>();
    final userName = authProvider.user?.name ?? 'User';
    final data = portalProvider.dashboardData;
    final stats = data?['stats'] as Map<String, dynamic>?;

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => portalProvider.fetchDashboard(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting
            const Text(
              'Welcome back,',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              userName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),

            // Stats
            if (portalProvider.isLoading && data == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: LoadingSpinner(message: 'Loading dashboard...'),
              )
            else if (portalProvider.error != null && data == null)
              Center(
                child: Column(
                  children: [
                    const SizedBox(height: 48),
                    const Icon(Icons.error_outline,
                        size: 48, color: AppColors.danger),
                    const SizedBox(height: 12),
                    Text(
                      portalProvider.error!,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: 'Retry',
                      width: 120,
                      onPressed: () => portalProvider.fetchDashboard(),
                    ),
                  ],
                ),
              )
            else ...[
              StatCard(
                title: 'Active Subscriptions',
                value: '${stats?['activeSubscriptions'] ?? 0}',
                icon: Icons.subscriptions,
                iconColor: AppColors.success,
              ),
              const SizedBox(height: 12),
              StatCard(
                title: 'Total Invoices',
                value: '${stats?['totalInvoices'] ?? 0}',
                icon: Icons.receipt_long,
                iconColor: AppColors.accent,
              ),
              const SizedBox(height: 12),
              StatCard(
                title: 'Unpaid Invoices',
                value: '${stats?['unpaidInvoices'] ?? 0}',
                icon: Icons.warning_amber_rounded,
                iconColor: AppColors.warning,
              ),
              const SizedBox(height: 12),
              StatCard(
                title: 'Total Paid',
                value: CurrencyFormatter.format(
                    (stats?['totalPaid'] as num?)?.toDouble() ?? 0),
                icon: Icons.check_circle_outline,
                iconColor: AppColors.success,
              ),
              const SizedBox(height: 32),

              // Browse Plans
              AppButton(
                label: 'Browse Plans',
                icon: Icons.explore,
                onPressed: () =>
                    Navigator.pushNamed(context, '/portal/catalog'),
              ),
              const SizedBox(height: 32),

              // Recent Activity
              const Text(
                'Recent Activity',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              ..._buildRecentActivity(data),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _buildRecentActivity(Map<String, dynamic>? data) {
    final List<Map<String, dynamic>> activities = [];
    final dateFormat = DateFormat('dd MMM yyyy');

    // Collect recent subscriptions
    final recentSubs = data?['recentSubscriptions'] as List?;
    if (recentSubs != null) {
      for (final sub in recentSubs) {
        activities.add({
          'type': 'subscription',
          'description':
              '${sub['planName'] ?? sub['plan']?['name'] ?? 'Subscription'} - ${sub['status'] ?? ''}',
          'date': sub['startDate'] ?? sub['createdAt'] ?? '',
        });
      }
    }

    // Collect recent invoices
    final recentInvoices = data?['recentInvoices'] as List?;
    if (recentInvoices != null) {
      for (final inv in recentInvoices) {
        activities.add({
          'type': 'invoice',
          'description':
              '${inv['invoiceNumber'] ?? 'Invoice'} - ${CurrencyFormatter.format((inv['totalAmount'] as num?)?.toDouble() ?? 0)}',
          'date': inv['invoiceDate'] ?? inv['createdAt'] ?? '',
        });
      }
    }

    // Collect recent payments
    final recentPayments = data?['recentPayments'] as List?;
    if (recentPayments != null) {
      for (final pay in recentPayments) {
        activities.add({
          'type': 'payment',
          'description':
              'Payment - ${CurrencyFormatter.format((pay['amount'] as num?)?.toDouble() ?? 0)}',
          'date': pay['paymentDate'] ?? pay['createdAt'] ?? '',
        });
      }
    }

    if (activities.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: const Center(
            child: Text(
              'No recent activity',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ];
    }

    return activities.map((activity) {
      String formattedDate = '';
      try {
        final parsed = DateTime.parse(activity['date']);
        formattedDate = dateFormat.format(parsed);
      } catch (_) {
        formattedDate = activity['date']?.toString() ?? '';
      }

      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _getActivityIcon(activity['type']?.toString() ?? ''),
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activity['description']?.toString() ?? 'Activity',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    formattedDate,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  IconData _getActivityIcon(String type) {
    switch (type.toLowerCase()) {
      case 'subscription':
        return Icons.subscriptions;
      case 'invoice':
        return Icons.receipt_long;
      case 'payment':
        return Icons.payment;
      default:
        return Icons.info_outline;
    }
  }
}
