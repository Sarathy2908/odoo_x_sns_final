import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../widgets/app_button.dart';

class ConfirmationScreen extends StatelessWidget {
  const ConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Successful'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Success icon
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: AppColors.success,
                  size: 80,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Your subscription is now active!',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'Thank you for your purchase. Your subscription has been activated successfully.',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    _InfoRow(
                      label: 'Status',
                      value: 'Active',
                      valueColor: AppColors.success,
                    ),
                    const Divider(height: 20),
                    _InfoRow(
                      label: 'Payment',
                      value: 'Completed',
                      valueColor: AppColors.success,
                    ),
                  ],
                ),
              ),
              const Spacer(),
              AppButton(
                label: 'Go to Subscriptions',
                icon: Icons.subscriptions,
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/portal',
                    (route) => false,
                  );
                },
              ),
              const SizedBox(height: 12),
              AppButton(
                label: 'Back to Home',
                isOutlined: true,
                icon: Icons.home,
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/portal',
                    (route) => false,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
