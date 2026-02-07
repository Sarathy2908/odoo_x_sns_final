import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/plans_provider.dart';
import '../../models/recurring_plan.dart';
import '../../utils/enums.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/currency_text.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<PlansProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PlansProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.event_repeat,
            title: 'No plans yet',
            subtitle: 'Create a recurring plan to get started',
            actionLabel: 'Add Plan',
            onAction: () => _showForm(context),
          );
        }

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: () => provider.fetchAll(),
            child: ListView.builder(
              padding: EdgeInsets.all(Responsive.horizontalPadding(context)),
              itemCount: provider.items.length,
              itemBuilder: (context, index) {
                return _buildCard(provider.items[index]);
              },
            ),
          ),
          floatingActionButton: FloatingActionButton(
            heroTag: 'fab_plans',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(RecurringPlan plan) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showForm(context, item: plan),
        onLongPress: () => _confirmDelete(plan),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.event_repeat, color: AppColors.accent, size: 22),
        ),
        title: Text(
          plan.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            'Every ${plan.periodLabel}',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        ),
        trailing: CurrencyText(
          amount: plan.price,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {RecurringPlan? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final descCtrl = TextEditingController(text: item?.description ?? '');
    final priceCtrl = TextEditingController(
      text: item != null ? item.price.toStringAsFixed(2) : '',
    );
    final minQtyCtrl = TextEditingController(
      text: item != null ? item.minQuantity.toString() : '1',
    );
    BillingPeriod selectedPeriod = item?.billingPeriod ?? BillingPeriod.MONTHLY;

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Plan' : 'Edit Plan',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: 'Name',
                controller: nameCtrl,
                validator: (v) => Validators.required(v, 'Name'),
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Description',
                controller: descCtrl,
                maxLines: 2,
              ),
              const SizedBox(height: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Billing Period',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<BillingPeriod>(
                    value: selectedPeriod,
                    items: BillingPeriod.values.map((p) {
                      return DropdownMenuItem(value: p, child: Text(p.name));
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) setSheetState(() => selectedPeriod = v);
                    },
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Min Quantity',
                controller: minQtyCtrl,
                keyboardType: TextInputType.number,
                validator: (v) => Validators.number(v, 'Min Quantity'),
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Price',
                controller: priceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => Validators.number(v, 'Price'),
                prefixIcon: Icons.currency_rupee,
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty) return;
                  final provider = context.read<PlansProvider>();
                  final data = {
                    'name': nameCtrl.text.trim(),
                    'description': descCtrl.text.trim(),
                    'billingPeriod': selectedPeriod.name,
                    'minQuantity': int.tryParse(minQtyCtrl.text) ?? 1,
                    'price': double.tryParse(priceCtrl.text) ?? 0,
                  };
                  bool success;
                  if (item == null) {
                    success = await provider.create(data);
                  } else {
                    success = await provider.update(item.id, data);
                  }
                  if (success && context.mounted) Navigator.pop(context);
                },
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmDelete(RecurringPlan plan) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Plan',
      message: 'Are you sure you want to delete "${plan.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<PlansProvider>().delete(plan.id);
    }
  }
}
