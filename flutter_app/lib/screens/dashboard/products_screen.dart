import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/products_provider.dart';
import '../../models/product.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/currency_text.dart';
import '../../widgets/status_badge.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<ProductsProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ProductsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.inventory_2,
            title: 'No products yet',
            subtitle: 'Create your first product to get started',
            actionLabel: 'Add Product',
            onAction: () => _showForm(context),
          );
        }

        final filtered = provider.items.where((p) {
          if (_searchQuery.isEmpty) return true;
          return p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (p.description ?? '').toLowerCase().contains(_searchQuery.toLowerCase());
        }).toList();

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: () => provider.fetchAll(),
            child: Column(
              children: [
                _buildSearchBar(),
                Expanded(
                  child: ListView.builder(
                    padding: EdgeInsets.all(Responsive.horizontalPadding(context)),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return _buildCard(filtered[index]);
                    },
                  ),
                ),
              ],
            ),
          ),
          floatingActionButton: FloatingActionButton(
            heroTag: 'fab_products',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search products...',
          prefixIcon: const Icon(Icons.search, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 20),
                  onPressed: () => setState(() => _searchQuery = ''),
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        onChanged: (v) => setState(() => _searchQuery = v),
      ),
    );
  }

  Widget _buildCard(Product product) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showForm(context, item: product),
        onLongPress: () => _confirmDelete(product),
        title: Row(
          children: [
            Expanded(
              child: Text(
                product.name,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
            StatusBadge(status: product.productType),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (product.description != null && product.description!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                product.description!,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 6),
            CurrencyText(
              amount: product.salesPrice,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {Product? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final descCtrl = TextEditingController(text: item?.description ?? '');
    final priceCtrl = TextEditingController(
      text: item != null ? item.salesPrice.toStringAsFixed(2) : '',
    );
    final costPriceCtrl = TextEditingController(
      text: item != null ? item.costPrice.toStringAsFixed(2) : '',
    );
    String productType = item?.productType ?? 'Service';

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Product' : 'Edit Product',
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
                maxLines: 3,
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Sale Price',
                controller: priceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => Validators.number(v, 'Sale Price'),
                prefixIcon: Icons.currency_rupee,
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Cost Price',
                controller: costPriceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                prefixIcon: Icons.currency_rupee,
              ),
              const SizedBox(height: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Product Type',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: productType,
                    items: ['Service', 'Consumable', 'Storable'].map((t) {
                      return DropdownMenuItem(value: t, child: Text(t));
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) setSheetState(() => productType = v);
                    },
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty) return;
                  final provider = context.read<ProductsProvider>();
                  final data = {
                    'name': nameCtrl.text.trim(),
                    'description': descCtrl.text.trim(),
                    'salesPrice': double.tryParse(priceCtrl.text) ?? 0,
                    'costPrice': double.tryParse(costPriceCtrl.text) ?? 0,
                    'productType': productType,
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

  void _confirmDelete(Product product) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Product',
      message: 'Are you sure you want to delete "${product.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<ProductsProvider>().delete(product.id);
    }
  }
}
