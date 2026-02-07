import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/quotations_provider.dart';
import '../../providers/plans_provider.dart';
import '../../providers/subscriptions_provider.dart';
import '../../providers/contacts_provider.dart';
import '../../models/quotation_template.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/currency_text.dart';

class QuotationsScreen extends StatefulWidget {
  const QuotationsScreen({super.key});

  @override
  State<QuotationsScreen> createState() => _QuotationsScreenState();
}

class _QuotationsScreenState extends State<QuotationsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<QuotationsProvider>().fetchAll();
      context.read<PlansProvider>().fetchAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<QuotationsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.request_quote,
            title: 'No quotation templates yet',
            subtitle: 'Create a template to quickly generate subscriptions',
            actionLabel: 'Add Template',
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
            heroTag: 'fab_quotations',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(QuotationTemplate template) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showForm(context, item: template),
        onLongPress: () => _confirmDelete(template),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      template.name,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${template.validityDays} days',
                      style: const TextStyle(
                        color: AppColors.accent,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.event_repeat, size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    template.planName ?? 'No plan',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const Spacer(),
                  CurrencyText(
                    amount: template.totalAmount,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              if (template.lines.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  '${template.lines.length} line item${template.lines.length > 1 ? 's' : ''}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _createSubscriptionFromTemplate(template),
                  icon: const Icon(Icons.add_circle_outline, size: 18),
                  label: const Text('Create Subscription from Template'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {QuotationTemplate? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final descCtrl = TextEditingController(text: item?.description ?? '');
    final validityCtrl = TextEditingController(
      text: item != null ? item.validityDays.toString() : '30',
    );
    final notesCtrl = TextEditingController(text: item?.notes ?? '');
    final termsCtrl = TextEditingController(text: item?.termsAndConditions ?? '');
    String? selectedPlanId = item?.planId;

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Quotation Template' : 'Edit Template',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: 'Template Name',
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
              Consumer<PlansProvider>(
                builder: (context, plansProvider, _) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Plan',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: selectedPlanId,
                        hint: const Text('Select plan'),
                        items: plansProvider.items.map((p) {
                          return DropdownMenuItem(
                            value: p.id,
                            child: Text('${p.name} (${p.periodLabel})'),
                          );
                        }).toList(),
                        onChanged: (v) => setSheetState(() => selectedPlanId = v),
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Validity (Days)',
                controller: validityCtrl,
                keyboardType: TextInputType.number,
                validator: (v) => Validators.number(v, 'Validity'),
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Notes',
                controller: notesCtrl,
                maxLines: 2,
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Terms & Conditions',
                controller: termsCtrl,
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || selectedPlanId == null) return;
                  final provider = context.read<QuotationsProvider>();
                  final data = {
                    'name': nameCtrl.text.trim(),
                    'description': descCtrl.text.trim(),
                    'planId': selectedPlanId,
                    'validityDays': int.tryParse(validityCtrl.text) ?? 30,
                    'notes': notesCtrl.text.trim(),
                    'termsAndConditions': termsCtrl.text.trim(),
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

  void _createSubscriptionFromTemplate(QuotationTemplate template) async {
    final contacts = context.read<ContactsProvider>();
    if (contacts.items.isEmpty) {
      await contacts.fetchAll();
    }

    if (!mounted) return;

    String? selectedContactId;

    FormBottomSheet.show(
      context,
      title: 'Create Subscription',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'From template: ${template.name}',
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 16),
              Consumer<ContactsProvider>(
                builder: (context, contactsProvider, _) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Customer',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: selectedContactId,
                        hint: const Text('Select customer'),
                        items: contactsProvider.items.map((c) {
                          return DropdownMenuItem(value: c.id, child: Text(c.name));
                        }).toList(),
                        onChanged: (v) => setSheetState(() => selectedContactId = v),
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 20),
              AppButton(
                label: 'Create Subscription',
                onPressed: () async {
                  if (selectedContactId == null) return;
                  final provider = context.read<SubscriptionsProvider>();
                  final success = await provider.createFromTemplate(
                    template.id,
                    {'contactId': selectedContactId},
                  );
                  if (success && context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Subscription created from template'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }

  void _confirmDelete(QuotationTemplate template) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Template',
      message: 'Are you sure you want to delete "${template.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<QuotationsProvider>().delete(template.id);
    }
  }
}
