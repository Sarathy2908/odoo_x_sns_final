import 'package:flutter/material.dart';
import '../utils/currency_formatter.dart';

class CurrencyText extends StatelessWidget {
  final num amount;
  final bool compact;
  final TextStyle? style;

  const CurrencyText({
    super.key,
    required this.amount,
    this.compact = false,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      compact ? CurrencyFormatter.formatCompact(amount) : CurrencyFormatter.format(amount),
      style: style,
    );
  }
}
