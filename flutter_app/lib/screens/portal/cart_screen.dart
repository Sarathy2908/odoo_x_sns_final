import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/cart_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _discountController = TextEditingController();

  @override
  void dispose() {
    _discountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Cart'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          if (!cartProvider.isEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Clear Cart'),
                    content: const Text(
                        'Are you sure you want to remove all items?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          cartProvider.clear();
                          Navigator.pop(ctx);
                        },
                        child: const Text('Clear',
                            style: TextStyle(color: AppColors.danger)),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
      body: cartProvider.isEmpty
          ? EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Your Cart is Empty',
              subtitle:
                  'Browse our plans and add subscriptions to get started.',
              actionLabel: 'Browse Plans',
              onAction: () =>
                  Navigator.pushNamed(context, '/portal/catalog'),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Cart items
                      ...cartProvider.items.map((item) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              // Plan info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.plan.name,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${CurrencyFormatter.format(item.plan.price)} / ${item.plan.periodLabel}',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      CurrencyFormatter.format(item.total),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Quantity controls
                              Column(
                                children: [
                                  Row(
                                    children: [
                                      _QuantityButton(
                                        icon: Icons.remove,
                                        onPressed: () => cartProvider
                                            .decrementQuantity(
                                                item.plan.id),
                                      ),
                                      Padding(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                horizontal: 12),
                                        child: Text(
                                          '${item.quantity}',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                      _QuantityButton(
                                        icon: Icons.add,
                                        onPressed: () => cartProvider
                                            .incrementQuantity(
                                                item.plan.id),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  GestureDetector(
                                    onTap: () => cartProvider
                                        .removeItem(item.plan.id),
                                    child: const Text(
                                      'Remove',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.danger,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),

                      const SizedBox(height: 8),

                      // Discount code section
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Discount Code',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Have a discount code? Enter it below (optional)',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            if (cartProvider.hasDiscount) ...[
                              // Applied discount display
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.success
                                      .withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppColors.success
                                        .withValues(alpha: 0.3),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.check_circle,
                                      color: AppColors.success,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            cartProvider
                                                    .discountDisplayLabel ??
                                                'Discount applied',
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.success,
                                            ),
                                          ),
                                          Text(
                                            'You save ${CurrencyFormatter.format(cartProvider.discountAmount)}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.success
                                                  .withValues(alpha: 0.8),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        cartProvider.removeDiscount();
                                        _discountController.clear();
                                      },
                                      child: const Icon(
                                        Icons.close,
                                        color: AppColors.textSecondary,
                                        size: 20,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ] else ...[
                              // Discount input
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _discountController,
                                      decoration: InputDecoration(
                                        hintText: 'Enter discount code',
                                        contentPadding:
                                            const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 12),
                                        border: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          borderSide: const BorderSide(
                                              color: AppColors.border),
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          borderSide: const BorderSide(
                                              color: AppColors.border),
                                        ),
                                        errorText:
                                            cartProvider.discountError,
                                        errorMaxLines: 2,
                                      ),
                                      textCapitalization:
                                          TextCapitalization.characters,
                                      onSubmitted: (_) => _applyDiscount(),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  SizedBox(
                                    height: 48,
                                    child: ElevatedButton(
                                      onPressed:
                                          cartProvider.isValidatingDiscount
                                              ? null
                                              : _applyDiscount,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.accent,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                      ),
                                      child:
                                          cartProvider.isValidatingDiscount
                                              ? const SizedBox(
                                                  width: 20,
                                                  height: 20,
                                                  child:
                                                      CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                    color: Colors.white,
                                                  ),
                                                )
                                              : const Text('Apply'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Bottom total and checkout
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    border: Border(
                      top: BorderSide(color: AppColors.border),
                    ),
                  ),
                  child: SafeArea(
                    child: Column(
                      children: [
                        // Subtotal
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Subtotal',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            Text(
                              CurrencyFormatter.format(
                                  cartProvider.totalAmount),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        // Discount row (if applied)
                        if (cartProvider.hasDiscount) ...[
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Discount (${cartProvider.discountCode})',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.success,
                                ),
                              ),
                              Text(
                                '- ${CurrencyFormatter.format(cartProvider.discountAmount)}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.success,
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 8),
                        const Divider(height: 1),
                        const SizedBox(height: 8),
                        // Total
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              CurrencyFormatter.format(
                                  cartProvider.finalAmount),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        AppButton(
                          label: 'Proceed to Checkout',
                          icon: Icons.payment,
                          onPressed: () => Navigator.pushNamed(
                              context, '/portal/checkout'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  void _applyDiscount() {
    final cartProvider = context.read<CartProvider>();
    cartProvider.applyDiscount(_discountController.text);
  }
}

class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;

  const _QuantityButton({required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 16, color: AppColors.textPrimary),
      ),
    );
  }
}
