import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/taxes_provider.dart';
import '../../models/tax.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';

class TaxesScreen extends StatefulWidget {
  const TaxesScreen({super.key});

  @override
  State<TaxesScreen> createState() => _TaxesScreenState();
}

class _TaxesScreenState extends State<TaxesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<TaxesProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<TaxesProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.account_balance,
            title: 'No taxes yet',
            subtitle: 'Configure tax rates for your invoices',
            actionLabel: 'Add Tax',
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
            heroTag: 'fab_taxes',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(Tax tax) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showForm(context, item: tax),
        onLongPress: () => _confirmDelete(tax),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.account_balance, color: AppColors.accent, size: 22),
        ),
        title: Text(
          tax.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            tax.displayRate,
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

  void _showForm(BuildContext context, {Tax? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final rateCtrl = TextEditingController(
      text: item != null ? item.rate.toStringAsFixed(1) : '',
    );

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Tax' : 'Edit Tax',
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppTextField(
            label: 'Name',
            controller: nameCtrl,
            validator: (v) => Validators.required(v, 'Name'),
            hintText: 'e.g. GST 18%',
          ),
          const SizedBox(height: 14),
          AppTextField(
            label: 'Rate (%)',
            controller: rateCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (v) => Validators.number(v, 'Rate'),
            prefixIcon: Icons.percent,
          ),
          const SizedBox(height: 20),
          AppButton(
            label: item == null ? 'Create' : 'Update',
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty || rateCtrl.text.trim().isEmpty) return;
              final provider = context.read<TaxesProvider>();
              final data = {
                'name': nameCtrl.text.trim(),
                'rate': double.tryParse(rateCtrl.text) ?? 0,
                'isActive': true,
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
      ),
    );
  }

  void _confirmDelete(Tax tax) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Tax',
      message: 'Are you sure you want to delete "${tax.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<TaxesProvider>().delete(tax.id);
    }
  }
}
