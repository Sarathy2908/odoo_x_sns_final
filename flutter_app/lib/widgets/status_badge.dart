import 'package:flutter/material.dart';
import '../config/theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final colors = _getColors();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.$1.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: colors.$1,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  (Color,) _getColors() {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'COMPLETED':
        return (AppColors.success,);
      case 'DRAFT':
        return (AppColors.textSecondary,);
      case 'QUOTATION':
      case 'PENDING':
        return (AppColors.warning,);
      case 'CONFIRMED':
        return (AppColors.accent,);
      case 'CLOSED':
      case 'CANCELLED':
      case 'FAILED':
        return (AppColors.danger,);
      default:
        return (AppColors.textSecondary,);
    }
  }
}
