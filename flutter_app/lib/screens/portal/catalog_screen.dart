import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/portal_provider.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/responsive.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortalProvider>().fetchCatalog();
    });
  }

  @override
  Widget build(BuildContext context) {
    final portalProvider = context.watch<PortalProvider>();
    final cartProvider = context.watch<CartProvider>();
    final columns = Responsive.gridColumns(context, mobile: 1, tablet: 2, desktop: 3);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse Plans'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart),
                onPressed: () =>
                    Navigator.pushNamed(context, '/portal/cart'),
              ),
              if (cartProvider.itemCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.danger,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${cartProvider.itemCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: portalProvider.isLoading
          ? const LoadingSpinner(message: 'Loading plans...')
          : portalProvider.error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: AppColors.danger),
                      const SizedBox(height: 12),
                      Text(portalProvider.error!,
                          style:
                              const TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => portalProvider.fetchCatalog(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : portalProvider.catalogPlans.isEmpty
                  ? const EmptyState(
                      icon: Icons.storefront,
                      title: 'No Plans Available',
                      subtitle:
                          'There are currently no subscription plans available.',
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () => portalProvider.fetchCatalog(),
                      child: GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: columns,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.85,
                        ),
                        itemCount: portalProvider.catalogPlans.length,
                        itemBuilder: (context, index) {
                          final plan = portalProvider.catalogPlans[index];
                          return Container(
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Plan icon
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary
                                          .withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                      Icons.card_membership,
                                      color: AppColors.primary,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Plan name
                                  Text(
                                    plan.name,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  // Description
                                  Expanded(
                                    child: Text(
                                      plan.description ?? 'No description',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textSecondary,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // Price and period
                                  Text(
                                    CurrencyFormatter.format(plan.price),
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  Text(
                                    'per ${plan.periodLabel}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Subscribe button
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        cartProvider.addItem(plan);
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                '${plan.name} added to cart'),
                                            backgroundColor: AppColors.success,
                                            duration:
                                                const Duration(seconds: 1),
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                      ),
                                      child: const Text('Subscribe'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
