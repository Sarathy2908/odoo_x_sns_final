import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/subscriptions_provider.dart';
import '../../providers/contacts_provider.dart';
import '../../providers/plans_provider.dart';
import '../../providers/products_provider.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class SubscriptionFormScreen extends StatefulWidget {
  const SubscriptionFormScreen({super.key});

  @override
  State<SubscriptionFormScreen> createState() => _SubscriptionFormScreenState();
}

class _SubscriptionFormScreenState extends State<SubscriptionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesCtrl = TextEditingController();

  String? _selectedContactId;
  String? _selectedPlanId;
  DateTime _startDate = DateTime.now();
  DateTime? _endDate;
  bool _isSubmitting = false;

  final List<_LineItem> _lines = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<ContactsProvider>().fetchAll();
      context.read<PlansProvider>().fetchAll();
      context.read<ProductsProvider>().fetchAll();
    });
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    for (final line in _lines) {
      line.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final padding = Responsive.horizontalPadding(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Subscription'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(padding),
          children: [
            _buildCustomerDropdown(),
            const SizedBox(height: 16),
            _buildPlanDropdown(),
            const SizedBox(height: 16),
            _buildDatePickers(),
            const SizedBox(height: 24),
            _buildLinesSection(),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Notes',
              controller: _notesCtrl,
              maxLines: 3,
              hintText: 'Optional notes...',
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Create Subscription',
              isLoading: _isSubmitting,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerDropdown() {
    return Consumer<ContactsProvider>(
      builder: (context, provider, _) {
        final contacts = provider.items;
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
              value: _selectedContactId,
              hint: const Text('Select customer'),
              items: contacts.map((c) {
                return DropdownMenuItem(value: c.id, child: Text(c.name));
              }).toList(),
              onChanged: (v) => setState(() => _selectedContactId = v),
              validator: (v) => v == null ? 'Customer is required' : null,
              decoration: const InputDecoration(
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPlanDropdown() {
    return Consumer<PlansProvider>(
      builder: (context, provider, _) {
        final plans = provider.items;
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
              value: _selectedPlanId,
              hint: const Text('Select plan'),
              items: plans.map((p) {
                return DropdownMenuItem(
                  value: p.id,
                  child: Text('${p.name} (${p.periodLabel})'),
                );
              }).toList(),
              onChanged: (v) => setState(() => _selectedPlanId = v),
              validator: (v) => v == null ? 'Plan is required' : null,
              decoration: const InputDecoration(
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDatePickers() {
    return Row(
      children: [
        Expanded(
          child: _buildDateField(
            label: 'Start Date',
            date: _startDate,
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _startDate,
                firstDate: DateTime(2020),
                lastDate: DateTime(2030),
              );
              if (picked != null) setState(() => _startDate = picked);
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildDateField(
            label: 'End Date (optional)',
            date: _endDate,
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _endDate ?? _startDate.add(const Duration(days: 30)),
                firstDate: _startDate,
                lastDate: DateTime(2030),
              );
              if (picked != null) setState(() => _endDate = picked);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDateField({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    final dateStr = date != null
        ? '${date.day}/${date.month}/${date.year}'
        : 'Not set';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(8),
              color: Colors.white,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    dateStr,
                    style: TextStyle(
                      fontSize: 14,
                      color: date != null ? AppColors.textPrimary : AppColors.textSecondary,
                    ),
                  ),
                ),
                const Icon(Icons.calendar_today, size: 18, color: AppColors.textSecondary),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLinesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Line Items',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: _addLine,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Line'),
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_lines.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Center(
              child: Text(
                'No lines added yet. Tap "Add Line" to add products.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ..._lines.asMap().entries.map((entry) {
          return _buildLineCard(entry.key, entry.value);
        }),
      ],
    );
  }

  Widget _buildLineCard(int index, _LineItem line) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Text(
                  'Line ${index + 1}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.delete, color: AppColors.danger, size: 20),
                  onPressed: () {
                    setState(() {
                      _lines[index].dispose();
                      _lines.removeAt(index);
                    });
                  },
                ),
              ],
            ),
            Consumer<ProductsProvider>(
              builder: (context, provider, _) {
                return DropdownButtonFormField<String>(
                  value: line.productId,
                  hint: const Text('Select product'),
                  items: provider.items.map((p) {
                    return DropdownMenuItem(value: p.id, child: Text(p.name));
                  }).toList(),
                  onChanged: (v) {
                    setState(() {
                      line.productId = v;
                      final product = provider.items.firstWhere((p) => p.id == v);
                      line.unitPriceCtrl.text = product.salesPrice.toStringAsFixed(2);
                    });
                  },
                  decoration: const InputDecoration(
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    label: 'Quantity',
                    controller: line.qtyCtrl,
                    keyboardType: TextInputType.number,
                    validator: (v) => Validators.number(v, 'Quantity'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppTextField(
                    label: 'Unit Price',
                    controller: line.unitPriceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (v) => Validators.number(v, 'Unit Price'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _addLine() {
    setState(() {
      _lines.add(_LineItem());
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final lines = _lines
        .where((l) => l.productId != null)
        .map((l) => {
              'productId': l.productId,
              'quantity': int.tryParse(l.qtyCtrl.text) ?? 1,
              'unitPrice': double.tryParse(l.unitPriceCtrl.text) ?? 0,
              'discount': 0,
            })
        .toList();

    final data = {
      'contactId': _selectedContactId,
      'planId': _selectedPlanId,
      'startDate': _startDate.toIso8601String(),
      if (_endDate != null) 'expirationDate': _endDate!.toIso8601String(),
      'internalNotes': _notesCtrl.text.trim(),
      'lines': lines,
    };

    final success = await context.read<SubscriptionsProvider>().create(data);

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Subscription created successfully'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    }
  }
}

class _LineItem {
  String? productId;
  final TextEditingController qtyCtrl;
  final TextEditingController unitPriceCtrl;

  _LineItem()
      : qtyCtrl = TextEditingController(text: '1'),
        unitPriceCtrl = TextEditingController();

  void dispose() {
    qtyCtrl.dispose();
    unitPriceCtrl.dispose();
  }
}
