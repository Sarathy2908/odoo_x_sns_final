class QuotationTemplate {
  final String id;
  final String name;
  final String? description;
  final String planId;
  final String? planName;
  final int validityDays;
  final String? recurringPeriod;
  final String? notes;
  final String? termsAndConditions;
  final List<QuotationLine> lines;
  final DateTime createdAt;

  QuotationTemplate({
    required this.id,
    required this.name,
    this.description,
    required this.planId,
    this.planName,
    this.validityDays = 30,
    this.recurringPeriod,
    this.notes,
    this.termsAndConditions,
    this.lines = const [],
    required this.createdAt,
  });

  factory QuotationTemplate.fromJson(Map<String, dynamic> json) =>
      QuotationTemplate(
        id: json['id'],
        name: json['name'],
        description: json['description'],
        planId: json['planId'],
        planName: json['plan']?['name'],
        validityDays: json['validityDays'] ?? 30,
        recurringPeriod: json['recurringPeriod'],
        notes: json['notes'],
        termsAndConditions: json['termsAndConditions'],
        lines: (json['lines'] as List<dynamic>?)
                ?.map((l) => QuotationLine.fromJson(l))
                .toList() ??
            [],
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'planId': planId,
        'validityDays': validityDays,
        'recurringPeriod': recurringPeriod,
        'notes': notes,
        'termsAndConditions': termsAndConditions,
      };

  double get totalAmount => lines.fold(
      0, (sum, line) => sum + (line.quantity * line.unitPrice) - (line.discount ?? 0));
}

class QuotationLine {
  final String id;
  final String? productId;
  final String? productName;
  final int quantity;
  final double unitPrice;
  final double? discount;

  QuotationLine({
    required this.id,
    this.productId,
    this.productName,
    required this.quantity,
    required this.unitPrice,
    this.discount,
  });

  factory QuotationLine.fromJson(Map<String, dynamic> json) => QuotationLine(
        id: json['id'],
        productId: json['productId'],
        productName: json['product']?['name'],
        quantity: json['quantity'],
        unitPrice: (json['unitPrice'] as num).toDouble(),
        discount: (json['discount'] as num?)?.toDouble(),
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'quantity': quantity,
        'unitPrice': unitPrice,
        'discount': discount ?? 0,
      };
}
