import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/reports_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/responsive.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/currency_text.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<ReportsProvider>().fetchDashboard());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ReportsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.dashboardData == null) {
          return const LoadingSpinner();
        }

        final data = provider.dashboardData ?? {};
        final padding = Responsive.horizontalPadding(context);
        final columns = Responsive.gridColumns(context, mobile: 2, tablet: 2, desktop: 4);

        return RefreshIndicator(
          onRefresh: () => provider.fetchDashboard(),
          child: ListView(
            padding: EdgeInsets.all(padding),
            children: [
              _buildStatGrid(data, columns),
              const SizedBox(height: 24),
              _buildSectionTitle('Recent Subscriptions'),
              const SizedBox(height: 12),
              _buildRecentSubscriptions(data),
              const SizedBox(height: 24),
              _buildSectionTitle('Recent Invoices'),
              const SizedBox(height: 12),
              _buildRecentInvoices(data),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatGrid(Map<String, dynamic> data, int columns) {
    final stats = [
      _StatItem(
        'Active Subscriptions',
        '${data['activeSubscriptions'] ?? 0}',
        Icons.subscriptions,
        AppColors.accent,
      ),
      _StatItem(
        'Total Revenue',
        CurrencyFormatter.formatCompact(data['totalRevenue'] ?? 0),
        Icons.trending_up,
        AppColors.success,
      ),
      _StatItem(
        'Pending Invoices',
        '${data['pendingInvoices'] ?? 0}',
        Icons.receipt_long,
        AppColors.warning,
      ),
      _StatItem(
        'Total Customers',
        '${data['totalCustomers'] ?? 0}',
        Icons.people,
        AppColors.primary,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.8,
      ),
      itemCount: stats.length,
      itemBuilder: (context, index) {
        final stat = stats[index];
        return StatCard(
          title: stat.title,
          value: stat.value,
          icon: stat.icon,
          iconColor: stat.color,
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      ),
    );
  }

  Widget _buildRecentSubscriptions(Map<String, dynamic> data) {
    final subscriptions = data['recentSubscriptions'] as List<dynamic>? ?? [];

    if (subscriptions.isEmpty) {
      return _buildEmptySection('No recent subscriptions');
    }

    return Column(
      children: subscriptions.map((sub) {
        final s = sub as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(
              s['contact']?['name'] ?? s['customer']?['name'] ?? 'N/A',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            subtitle: Text(
              s['plan']?['name'] ?? 'No plan',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                StatusBadge(status: s['status'] ?? 'DRAFT'),
                const SizedBox(height: 4),
                CurrencyText(
                  amount: (s['recurringTotal'] as num?) ?? 0,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRecentInvoices(Map<String, dynamic> data) {
    final invoices = data['recentInvoices'] as List<dynamic>? ?? [];

    if (invoices.isEmpty) {
      return _buildEmptySection('No recent invoices');
    }

    return Column(
      children: invoices.map((inv) {
        final i = inv as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(
              i['invoiceNumber'] ?? 'N/A',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            subtitle: Text(
              i['customer']?['name'] ?? i['contact']?['name'] ?? 'N/A',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                StatusBadge(status: i['status'] ?? 'DRAFT'),
                const SizedBox(height: 4),
                CurrencyText(
                  amount: (i['totalAmount'] as num?) ?? 0,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildEmptySection(String message) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: Text(
          message,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
      ),
    );
  }
}

class _StatItem {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  _StatItem(this.title, this.value, this.icon, this.color);
}
