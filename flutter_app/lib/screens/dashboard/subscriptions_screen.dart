import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/subscriptions_provider.dart';
import '../../models/subscription.dart';
import '../../utils/responsive.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/currency_text.dart';
import 'subscription_detail_screen.dart';
import 'subscription_form_screen.dart';

class SubscriptionsScreen extends StatefulWidget {
  const SubscriptionsScreen({super.key});

  @override
  State<SubscriptionsScreen> createState() => _SubscriptionsScreenState();
}

class _SubscriptionsScreenState extends State<SubscriptionsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _tabs = ['All', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    Future.microtask(() => context.read<SubscriptionsProvider>().fetchAll());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<Subscription> _filterByTab(List<Subscription> items, int tabIndex) {
    if (tabIndex == 0) return items;
    final statusName = _tabs[tabIndex].toUpperCase();
    return items.where((s) => s.status.name == statusName).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<SubscriptionsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        return Scaffold(
          body: Column(
            children: [
              Container(
                color: AppColors.card,
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  indicatorColor: AppColors.primary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  tabAlignment: TabAlignment.start,
                  tabs: _tabs.map((t) => Tab(text: t)).toList(),
                  onTap: (_) => setState(() {}),
                ),
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: _tabs.asMap().entries.map((entry) {
                    final filtered = _filterByTab(provider.items, entry.key);
                    if (filtered.isEmpty) {
                      return EmptyState(
                        icon: Icons.subscriptions,
                        title: 'No subscriptions',
                        subtitle: entry.key == 0
                            ? 'Create your first subscription'
                            : 'No ${_tabs[entry.key].toLowerCase()} subscriptions',
                      );
                    }
                    return RefreshIndicator(
                      onRefresh: () => provider.fetchAll(),
                      child: ListView.builder(
                        padding: EdgeInsets.all(Responsive.horizontalPadding(context)),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          return _buildCard(filtered[index]);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          floatingActionButton: FloatingActionButton(
            heroTag: 'fab_subscriptions',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SubscriptionFormScreen()),
              );
            },
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(Subscription subscription) {
    final dateStr =
        '${subscription.startDate.day}/${subscription.startDate.month}/${subscription.startDate.year}';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => SubscriptionDetailScreen(subscriptionId: subscription.id),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      subscription.contactName ?? subscription.customerName ?? 'N/A',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  StatusBadge(status: subscription.status.name),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.event_repeat, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    subscription.planName ?? 'No plan',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const Spacer(),
                  Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    dateStr,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              CurrencyText(
                amount: subscription.recurringTotal,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
