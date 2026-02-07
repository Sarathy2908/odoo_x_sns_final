import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/invoices_provider.dart';
import '../../providers/payments_provider.dart';
import '../../models/invoice.dart';
import '../../utils/enums.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';

class InvoiceDetailScreen extends StatefulWidget {
  final String invoiceId;

  const InvoiceDetailScreen({super.key, required this.invoiceId});

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => context.read<InvoicesProvider>().fetchOne(widget.invoiceId),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice Details'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Consumer<InvoicesProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.selected == null) {
            return const LoadingSpinner();
          }

          final invoice = provider.selected;
          if (invoice == null) {
            return const Center(child: Text('Invoice not found'));
          }

          final padding = Responsive.horizontalPadding(context);

          return ListView(
            padding: EdgeInsets.all(padding),
            children: [
              _buildInfoCard(invoice),
              const SizedBox(height: 16),
              _buildLinesTable(invoice),
              const SizedBox(height: 16),
              _buildTotalsSection(invoice),
              const SizedBox(height: 16),
              _buildActions(invoice, provider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInfoCard(Invoice invoice) {
    final invoiceDateStr =
        '${invoice.invoiceDate.day}/${invoice.invoiceDate.month}/${invoice.invoiceDate.year}';
    final dueDateStr = invoice.dueDate != null
        ? '${invoice.dueDate!.day}/${invoice.dueDate!.month}/${invoice.dueDate!.year}'
        : 'N/A';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    invoice.invoiceNumber,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ),
                StatusBadge(status: invoice.status.name),
              ],
            ),
            const Divider(height: 24),
            _infoRow('Customer', invoice.contactName ?? invoice.customerName ?? 'N/A'),
            _infoRow('Invoice Date', invoiceDateStr),
            _infoRow('Due Date', dueDateStr),
            if (invoice.notes != null && invoice.notes!.isNotEmpty)
              _infoRow('Notes', invoice.notes!),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinesTable(Invoice invoice) {
    if (invoice.lines.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No line items',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Line Items',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowColor: WidgetStateProperty.all(
                  AppColors.primary.withValues(alpha: 0.05),
                ),
                columnSpacing: 16,
                columns: const [
                  DataColumn(label: Text('Product', style: TextStyle(fontWeight: FontWeight.w600))),
                  DataColumn(label: Text('Desc', style: TextStyle(fontWeight: FontWeight.w600))),
                  DataColumn(label: Text('Qty', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                  DataColumn(label: Text('Price', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                  DataColumn(label: Text('Tax', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                  DataColumn(label: Text('Amount', style: TextStyle(fontWeight: FontWeight.w600)), numeric: true),
                ],
                rows: invoice.lines.map((line) {
                  return DataRow(cells: [
                    DataCell(Text(line.productName ?? 'N/A')),
                    DataCell(Text(line.description ?? '-', overflow: TextOverflow.ellipsis)),
                    DataCell(Text('${line.quantity}')),
                    DataCell(Text(CurrencyFormatter.format(line.unitPrice))),
                    DataCell(Text(
                      line.taxName != null
                          ? '${line.taxName} (${line.taxRate?.toStringAsFixed(1) ?? '0'}%)'
                          : '-',
                    )),
                    DataCell(Text(
                      CurrencyFormatter.format(line.amount),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    )),
                  ]);
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTotalsSection(Invoice invoice) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _totalRow('Subtotal', CurrencyFormatter.format(invoice.subtotal)),
            _totalRow('Tax', CurrencyFormatter.format(invoice.taxAmount)),
            const Divider(height: 16),
            _totalRow(
              'Total',
              CurrencyFormatter.format(invoice.totalAmount),
              isBold: true,
              color: AppColors.textPrimary,
            ),
            _totalRow(
              'Paid',
              CurrencyFormatter.format(invoice.paidAmount),
              color: AppColors.success,
            ),
            const Divider(height: 16),
            _totalRow(
              'Balance Due',
              CurrencyFormatter.format(invoice.balanceDue),
              isBold: true,
              color: invoice.balanceDue > 0 ? AppColors.danger : AppColors.success,
            ),
          ],
        ),
      ),
    );
  }

  Widget _totalRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isBold ? 15 : 14,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isBold ? 16 : 14,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
              color: color ?? AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(Invoice invoice, InvoicesProvider provider) {
    return Column(
      children: [
        if (invoice.status == InvoiceStatus.DRAFT)
          AppButton(
            label: 'Confirm Invoice',
            icon: Icons.check_circle,
            color: AppColors.accent,
            onPressed: () async {
              final success = await provider.confirm(invoice.id);
              if (success && mounted) {
                await provider.fetchOne(invoice.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Invoice confirmed'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              }
            },
          ),
        if (invoice.status == InvoiceStatus.CONFIRMED) ...[
          AppButton(
            label: 'Record Payment',
            icon: Icons.payment,
            color: AppColors.success,
            onPressed: () => _showPaymentForm(invoice),
          ),
          const SizedBox(height: 10),
          AppButton(
            label: 'Cancel Invoice',
            icon: Icons.cancel,
            color: AppColors.danger,
            isOutlined: true,
            onPressed: () async {
              final confirmed = await ConfirmDialog.show(
                context,
                title: 'Cancel Invoice',
                message: 'Are you sure you want to cancel this invoice?',
                confirmText: 'Cancel Invoice',
                confirmColor: AppColors.danger,
              );
              if (confirmed == true) {
                final success = await provider.cancel(invoice.id);
                if (success && mounted) {
                  await provider.fetchOne(invoice.id);
                }
              }
            },
          ),
        ],
        if (invoice.pdfUrl != null && invoice.pdfUrl!.isNotEmpty) ...[
          const SizedBox(height: 10),
          AppButton(
            label: 'Download PDF',
            icon: Icons.picture_as_pdf,
            isOutlined: true,
            onPressed: () async {
              final uri = Uri.parse(invoice.pdfUrl!);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
        ],
      ],
    );
  }

  void _showPaymentForm(Invoice invoice) {
    final amountCtrl = TextEditingController(
      text: invoice.balanceDue.toStringAsFixed(2),
    );
    final notesCtrl = TextEditingController();
    PaymentMethod selectedMethod = PaymentMethod.NET_BANKING;

    FormBottomSheet.show(
      context,
      title: 'Record Payment',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Invoice: ${invoice.invoiceNumber}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Amount',
                controller: amountCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
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
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
                  if (amountCtrl.text.trim().isEmpty) return;
                  final paymentsProvider = context.read<PaymentsProvider>();
                  final data = {
                    'invoiceId': invoice.id,
                    'amount': double.tryParse(amountCtrl.text) ?? 0,
                    'paymentMethod': selectedMethod.name,
                    'notes': notesCtrl.text.trim(),
                    'paymentDate': DateTime.now().toIso8601String(),
                  };
                  final success = await paymentsProvider.create(data);
                  if (success && context.mounted) {
                    Navigator.pop(context);
                    // Refresh invoice detail
                    context.read<InvoicesProvider>().fetchOne(invoice.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Payment recorded successfully'),
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
}
