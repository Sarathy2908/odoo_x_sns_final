import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/payments_provider.dart';
import '../../providers/invoices_provider.dart';
import '../../models/payment.dart';
import '../../utils/enums.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/currency_text.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<PaymentsProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PaymentsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.payment,
            title: 'No payments yet',
            subtitle: 'Payments will appear here once recorded',
            actionLabel: 'Record Payment',
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
            heroTag: 'fab_payments',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(Payment payment) {
    final dateStr =
        '${payment.paymentDate.day}/${payment.paymentDate.month}/${payment.paymentDate.year}';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    payment.invoiceNumber ?? 'Direct Payment',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                StatusBadge(status: payment.status.name),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              payment.customerName ?? 'N/A',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                CurrencyText(
                  amount: payment.amount,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    payment.paymentMethod.name.replaceAll('_', ' '),
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.calendar_today, size: 13, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  dateStr,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showForm(BuildContext context) {
    final amountCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    PaymentMethod selectedMethod = PaymentMethod.NET_BANKING;
    String? selectedInvoiceId;

    // Fetch invoices for the dropdown
    Future.microtask(() => context.read<InvoicesProvider>().fetchAll());

    FormBottomSheet.show(
      context,
      title: 'Record Payment',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Consumer<InvoicesProvider>(
                builder: (context, invoicesProvider, _) {
                  final unpaidInvoices = invoicesProvider.items
                      .where((i) =>
                          i.status == InvoiceStatus.CONFIRMED && i.balanceDue > 0)
                      .toList();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Invoice',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: selectedInvoiceId,
                        hint: const Text('Select invoice'),
                        items: unpaidInvoices.map((inv) {
                          return DropdownMenuItem(
                            value: inv.id,
                            child: Text(
                              '${inv.invoiceNumber} - Balance: ${inv.balanceDue.toStringAsFixed(2)}',
                            ),
                          );
                        }).toList(),
                        onChanged: (v) {
                          setSheetState(() {
                            selectedInvoiceId = v;
                            if (v != null) {
                              final inv =
                                  unpaidInvoices.firstWhere((i) => i.id == v);
                              amountCtrl.text = inv.balanceDue.toStringAsFixed(2);
                            }
                          });
                        },
                        decoration: const InputDecoration(
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Amount',
                controller: amountCtrl,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => Validators.number(v, 'Amount'),
                prefixIcon: Icons.currency_rupee,
              ),
              const SizedBox(height: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<PaymentMethod>(
                    value: selectedMethod,
                    items: PaymentMethod.values.map((m) {
                      return DropdownMenuItem(
                        value: m,
                        child: Text(m.name.replaceAll('_', ' ')),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) setSheetState(() => selectedMethod = v);
                    },
                    decoration: const InputDecoration(
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Notes',
                controller: notesCtrl,
                maxLines: 2,
              ),
              const SizedBox(height: 20),
              AppButton(
                label: 'Record Payment',
                onPressed: () async {
                  if (amountCtrl.text.trim().isEmpty || selectedInvoiceId == null) {
                    return;
                  }
                  final provider = context.read<PaymentsProvider>();
                  final data = {
                    'invoiceId': selectedInvoiceId,
                    'amount': double.tryParse(amountCtrl.text) ?? 0,
                    'paymentMethod': selectedMethod.name,
                    'notes': notesCtrl.text.trim(),
                    'paymentDate': DateTime.now().toIso8601String(),
                  };
                  final success = await provider.create(data);
                  if (success && context.mounted) Navigator.pop(context);
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
