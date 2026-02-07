import '../utils/enums.dart';

class RecurringPlan {
  final String id;
  final String name;
  final String? description;
  final double price;
  final BillingPeriod billingPeriod;
  final int minQuantity;
  final bool autoClose;
  final bool closable;
  final bool pausable;
  final bool renewable;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime createdAt;

  RecurringPlan({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.billingPeriod,
    this.minQuantity = 1,
    this.autoClose = false,
    this.closable = true,
    this.pausable = false,
    this.renewable = true,
    this.startDate,
    this.endDate,
    required this.createdAt,
  });

  factory RecurringPlan.fromJson(Map<String, dynamic> json) => RecurringPlan(
        id: json['id'],
        name: json['name'] ?? '',
        description: json['description'],
        price: (json['price'] as num?)?.toDouble() ?? 0,
        billingPeriod: BillingPeriod.values.firstWhere(
          (e) => e.name == json['billingPeriod'],
          orElse: () => BillingPeriod.MONTHLY,
        ),
        minQuantity: json['minQuantity'] ?? 1,
        autoClose: json['autoClose'] ?? false,
        closable: json['closable'] ?? true,
        pausable: json['pausable'] ?? false,
        renewable: json['renewable'] ?? true,
        startDate: json['startDate'] != null
            ? DateTime.parse(json['startDate'])
            : null,
        endDate:
            json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'price': price,
        'billingPeriod': billingPeriod.name,
        'minQuantity': minQuantity,
        'autoClose': autoClose,
        'closable': closable,
        'pausable': pausable,
        'renewable': renewable,
      };

  String get periodLabel {
    switch (billingPeriod) {
      case BillingPeriod.DAILY:
        return 'Daily';
      case BillingPeriod.WEEKLY:
        return 'Weekly';
      case BillingPeriod.MONTHLY:
        return 'Monthly';
      case BillingPeriod.YEARLY:
        return 'Yearly';
    }
  }
}
