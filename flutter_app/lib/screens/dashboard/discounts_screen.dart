import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/discounts_provider.dart';
import '../../models/discount.dart';
import '../../utils/enums.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/status_badge.dart';

class DiscountsScreen extends StatefulWidget {
  const DiscountsScreen({super.key});

  @override
  State<DiscountsScreen> createState() => _DiscountsScreenState();
}

class _DiscountsScreenState extends State<DiscountsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<DiscountsProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DiscountsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.local_offer,
            title: 'No discounts yet',
            subtitle: 'Create discount rules for your subscriptions',
            actionLabel: 'Add Discount',
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
            heroTag: 'fab_discounts',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(Discount discount) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showForm(context, item: discount),
        onLongPress: () => _confirmDelete(discount),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.warning.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.local_offer, color: AppColors.warning, size: 22),
        ),
        title: Text(
          discount.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: StatusBadge(status: discount.type.name),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            discount.displayValue,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: AppColors.primary,
            ),
          ),
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {Discount? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final valueCtrl = TextEditingController(
      text: item != null ? item.value.toStringAsFixed(2) : '',
    );
    DiscountType selectedType = item?.type ?? DiscountType.PERCENTAGE;

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Discount' : 'Edit Discount',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: 'Name',
                controller: nameCtrl,
                validator: (v) => Validators.required(v, 'Name'),
                hintText: 'e.g. Early Bird Discount',
              ),
              const SizedBox(height: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Type',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<DiscountType>(
                    value: selectedType,
                    items: DiscountType.values.map((t) {
                      return DropdownMenuItem(value: t, child: Text(t.name));
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) setSheetState(() => selectedType = v);
                    },
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: selectedType == DiscountType.PERCENTAGE ? 'Value (%)' : 'Value (Amount)',
                controller: valueCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => Validators.number(v, 'Value'),
                prefixIcon: selectedType == DiscountType.PERCENTAGE
                    ? Icons.percent
                    : Icons.currency_rupee,
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || valueCtrl.text.trim().isEmpty) return;
                  final provider = context.read<DiscountsProvider>();
                  final data = {
                    'name': nameCtrl.text.trim(),
                    'type': selectedType.name,
                    'value': double.tryParse(valueCtrl.text) ?? 0,
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

  void _confirmDelete(Discount discount) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Discount',
      message: 'Are you sure you want to delete "${discount.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<DiscountsProvider>().delete(discount.id);
    }
  }
}
