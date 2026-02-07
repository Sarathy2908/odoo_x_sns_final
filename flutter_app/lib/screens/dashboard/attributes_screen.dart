import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/attributes_provider.dart';
import '../../models/attribute.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';

class AttributesScreen extends StatefulWidget {
  const AttributesScreen({super.key});

  @override
  State<AttributesScreen> createState() => _AttributesScreenState();
}

class _AttributesScreenState extends State<AttributesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<AttributesProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AttributesProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.tune,
            title: 'No attributes yet',
            subtitle: 'Create attributes to define product variants',
            actionLabel: 'Add Attribute',
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
            heroTag: 'fab_attributes',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(Attribute attribute) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showForm(context, item: attribute),
        onLongPress: () => _confirmDelete(attribute),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.tune, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      attribute.name,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  Text(
                    '${attribute.values.length} value${attribute.values.length != 1 ? 's' : ''}',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              if (attribute.values.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: attribute.values.map((v) {
                    return Chip(
                      label: Text(
                        v.value,
                        style: const TextStyle(fontSize: 12),
                      ),
                      backgroundColor: AppColors.accent.withValues(alpha: 0.1),
                      labelStyle: const TextStyle(color: AppColors.accent),
                      side: BorderSide.none,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {Attribute? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final valueCtrl = TextEditingController();
    List<String> values = item?.values.map((v) => v.value).toList() ?? [];

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Attribute' : 'Edit Attribute',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: 'Attribute Name',
                controller: nameCtrl,
                validator: (v) => Validators.required(v, 'Name'),
                hintText: 'e.g. Color, Size',
              ),
              const SizedBox(height: 16),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Values',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              if (values.isNotEmpty) ...[
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: values.asMap().entries.map((entry) {
                    return Chip(
                      label: Text(entry.value, style: const TextStyle(fontSize: 12)),
                      backgroundColor: AppColors.accent.withValues(alpha: 0.1),
                      labelStyle: const TextStyle(color: AppColors.accent),
                      deleteIcon: const Icon(Icons.close, size: 16),
                      deleteIconColor: AppColors.danger,
                      onDeleted: () {
                        setSheetState(() => values.removeAt(entry.key));
                      },
                      side: BorderSide.none,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    );
                  }).toList(),
                ),
                const SizedBox(height: 8),
              ],
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: valueCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Add a value...',
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onSubmitted: (v) {
                        if (v.trim().isNotEmpty) {
                          setSheetState(() {
                            values.add(v.trim());
                            valueCtrl.clear();
                          });
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      if (valueCtrl.text.trim().isNotEmpty) {
                        setSheetState(() {
                          values.add(valueCtrl.text.trim());
                          valueCtrl.clear();
                        });
                      }
                    },
                    icon: const Icon(Icons.add_circle, color: AppColors.primary),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  final provider = context.read<AttributesProvider>();
                  final data = {
                    'name': nameCtrl.text.trim(),
                    'values': values,
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

  void _confirmDelete(Attribute attribute) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Attribute',
      message: 'Are you sure you want to delete "${attribute.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<AttributesProvider>().delete(attribute.id);
    }
  }
}
