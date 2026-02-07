import '../utils/enums.dart';

class Discount {
  final String id;
  final String name;
  final String? description;
  final DiscountType type;
  final double value;
  final double? minPurchase;
  final int? minQuantity;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? limitUsage;
  final int usageCount;
  final DateTime createdAt;

  Discount({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.value,
    this.minPurchase,
    this.minQuantity,
    this.startDate,
    this.endDate,
    this.limitUsage,
    this.usageCount = 0,
    required this.createdAt,
  });

  factory Discount.fromJson(Map<String, dynamic> json) => Discount(
        id: json['id'],
        name: json['name'] ?? '',
        description: json['description'],
        type: DiscountType.values.firstWhere(
          (e) => e.name == json['type'],
          orElse: () => DiscountType.PERCENTAGE,
        ),
        value: (json['value'] as num?)?.toDouble() ?? 0,
        minPurchase: (json['minPurchase'] as num?)?.toDouble(),
        minQuantity: json['minQuantity'],
        startDate: json['startDate'] != null
            ? DateTime.parse(json['startDate'])
            : null,
        endDate:
            json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
        limitUsage: json['limitUsage'],
        usageCount: json['usageCount'] ?? 0,
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'type': type.name,
        'value': value,
        'minPurchase': minPurchase,
        'minQuantity': minQuantity,
      };

  String get displayValue => type == DiscountType.PERCENTAGE
      ? '${value.toStringAsFixed(0)}%'
      : '\u20b9${value.toStringAsFixed(2)}';
}
