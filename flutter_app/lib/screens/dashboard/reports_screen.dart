import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/reports_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/responsive.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/currency_text.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _tabs = ['Overview', 'Subscriptions', 'Revenue', 'Payments'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadTab(0));
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      _loadTab(_tabController.index);
    }
  }

  void _loadTab(int index) {
    final provider = context.read<ReportsProvider>();
    switch (index) {
      case 0:
        provider.fetchDashboard();
        break;
      case 1:
        provider.fetchSubscriptionReport();
        break;
      case 2:
        provider.fetchRevenueReport();
        break;
      case 3:
        provider.fetchPaymentReport();
        provider.fetchOverdueInvoices();
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: AppColors.card,
          child: TabBar(
            controller: _tabController,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            tabs: _tabs.map((t) => Tab(text: t)).toList(),
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(),
              _buildSubscriptionsTab(),
              _buildRevenueTab(),
              _buildPaymentsTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOverviewTab() {
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
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: columns,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.8,
                children: [
                  StatCard(
                    title: 'Active Subscriptions',
                    value: '${data['activeSubscriptions'] ?? 0}',
                    icon: Icons.subscriptions,
                    iconColor: AppColors.accent,
                  ),
                  StatCard(
                    title: 'Total Revenue',
                    value: CurrencyFormatter.formatCompact(data['totalRevenue'] ?? 0),
                    icon: Icons.trending_up,
                    iconColor: AppColors.success,
                  ),
                  StatCard(
                    title: 'Pending Invoices',
                    value: '${data['pendingInvoices'] ?? 0}',
                    icon: Icons.receipt_long,
                    iconColor: AppColors.warning,
                  ),
                  StatCard(
                    title: 'Total Customers',
                    value: '${data['totalCustomers'] ?? 0}',
                    icon: Icons.people,
                    iconColor: AppColors.primary,
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubscriptionsTab() {
    return Consumer<ReportsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.subscriptionStats == null) {
          return const LoadingSpinner();
        }

        final stats = provider.subscriptionStats ?? [];
        final padding = Responsive.horizontalPadding(context);

        if (stats.isEmpty) {
          return _buildEmptyReport('No subscription data available');
        }

        return RefreshIndicator(
          onRefresh: () => provider.fetchSubscriptionReport(),
          child: ListView(
            padding: EdgeInsets.all(padding),
            children: [
              const Text(
                'Subscription Statistics',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...stats.map((item) {
                final s = item as Map<String, dynamic>;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(
                      s['status'] ?? s['name'] ?? 'N/A',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: s['description'] != null
                        ? Text(
                            s['description'],
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                          )
                        : null,
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${s['count'] ?? s['_count'] ?? 0}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 18,
                            color: AppColors.primary,
                          ),
                        ),
                        if (s['recurringTotal'] != null || s['_sum'] != null)
                          CurrencyText(
                            amount: (s['recurringTotal'] ?? s['_sum']?['recurringTotal'] ?? 0) as num,
                            compact: true,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRevenueTab() {
    return Consumer<ReportsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.revenueData == null) {
          return const LoadingSpinner();
        }

        final data = provider.revenueData ?? [];
        final padding = Responsive.horizontalPadding(context);

        if (data.isEmpty) {
          return _buildEmptyReport('No revenue data available');
        }

        return RefreshIndicator(
          onRefresh: () => provider.fetchRevenueReport(),
          child: ListView(
            padding: EdgeInsets.all(padding),
            children: [
              const Text(
                'Revenue Breakdown',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...data.map((item) {
                final r = item as Map<String, dynamic>;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r['period'] ?? r['month'] ?? r['label'] ?? 'N/A',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              if (r['invoiceCount'] != null || r['count'] != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  '${r['invoiceCount'] ?? r['count'] ?? 0} invoices',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        CurrencyText(
                          amount: (r['revenue'] ?? r['total'] ?? r['amount'] ?? 0) as num,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentsTab() {
    return Consumer<ReportsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading &&
            provider.paymentData == null &&
            provider.overdueInvoices == null) {
          return const LoadingSpinner();
        }

        final payments = provider.paymentData ?? [];
        final overdue = provider.overdueInvoices ?? [];
        final padding = Responsive.horizontalPadding(context);

        return RefreshIndicator(
          onRefresh: () async {
            await provider.fetchPaymentReport();
            await provider.fetchOverdueInvoices();
          },
          child: ListView(
            padding: EdgeInsets.all(padding),
            children: [
              if (payments.isNotEmpty) ...[
                const Text(
                  'Payment Statistics',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                ...payments.map((item) {
                  final p = item as Map<String, dynamic>;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(
                        (p['paymentMethod'] ?? p['status'] ?? p['label'] ?? 'N/A')
                            .toString()
                            .replaceAll('_', ' '),
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${p['count'] ?? p['_count'] ?? 0}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: AppColors.primary,
                            ),
                          ),
                          CurrencyText(
                            amount: (p['total'] ?? p['amount'] ?? p['_sum']?['amount'] ?? 0) as num,
                            compact: true,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
              if (payments.isEmpty && overdue.isEmpty)
                _buildEmptyReport('No payment data available'),
              if (overdue.isNotEmpty) ...[
                const SizedBox(height: 24),
                Row(
                  children: [
                    const Icon(Icons.warning_amber, color: AppColors.danger, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Overdue Invoices',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.danger,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${overdue.length}',
                        style: const TextStyle(
                          color: AppColors.danger,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...overdue.map((item) {
                  final inv = item as Map<String, dynamic>;
                  final dueDateStr = inv['dueDate'] != null
                      ? _formatDate(inv['dueDate'])
                      : 'N/A';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(
                        inv['invoiceNumber'] ?? 'N/A',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            inv['customer']?['name'] ?? inv['contact']?['name'] ?? 'N/A',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            'Due: $dueDateStr',
                            style: const TextStyle(
                              color: AppColors.danger,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      trailing: CurrencyText(
                        amount: ((inv['totalAmount'] as num?) ?? 0) -
                            ((inv['paidAmount'] as num?) ?? 0),
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: AppColors.danger,
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyReport(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.bar_chart,
              size: 64,
              color: AppColors.textSecondary.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
