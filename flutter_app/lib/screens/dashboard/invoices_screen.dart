import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/invoices_provider.dart';
import '../../models/invoice.dart';
import '../../utils/responsive.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/currency_text.dart';
import 'invoice_detail_screen.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  static const _tabs = ['All', 'Draft', 'Confirmed', 'Paid', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    Future.microtask(() => context.read<InvoicesProvider>().fetchAll());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<Invoice> _filterByTab(List<Invoice> items, int tabIndex) {
    if (tabIndex == 0) return items;
    final statusName = _tabs[tabIndex].toUpperCase();
    return items.where((i) => i.status.name == statusName).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<InvoicesProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        return Column(
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
                      icon: Icons.receipt_long,
                      title: 'No invoices',
                      subtitle: entry.key == 0
                          ? 'Invoices will appear here'
                          : 'No ${_tabs[entry.key].toLowerCase()} invoices',
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
        );
      },
    );
  }

  Widget _buildCard(Invoice invoice) {
    final dueDateStr = invoice.dueDate != null
        ? '${invoice.dueDate!.day}/${invoice.dueDate!.month}/${invoice.dueDate!.year}'
        : 'No due date';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => InvoiceDetailScreen(invoiceId: invoice.id),
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
                      invoice.invoiceNumber,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ),
                  StatusBadge(status: invoice.status.name),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                invoice.contactName ?? invoice.customerName ?? 'N/A',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  CurrencyText(
                    amount: invoice.totalAmount,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: AppColors.primary,
                    ),
                  ),
                  if (invoice.paidAmount > 0) ...[
                    const SizedBox(width: 8),
                    Text(
                      'Paid: ',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    CurrencyText(
                      amount: invoice.paidAmount,
                      style: const TextStyle(
                        color: AppColors.success,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const Spacer(),
                  Icon(Icons.calendar_today, size: 13, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    dueDateStr,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
