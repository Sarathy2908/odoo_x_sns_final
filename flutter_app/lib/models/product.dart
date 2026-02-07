class Product {
  final String id;
  final String name;
  final String? description;
  final String productType;
  final double salesPrice;
  final double costPrice;
  final double? recurringPrice;
  final String? recurringPeriod;
  final String? category;
  final List<ProductVariant> variants;
  final DateTime createdAt;

  Product({
    required this.id,
    required this.name,
    this.description,
    this.productType = 'Service',
    required this.salesPrice,
    required this.costPrice,
    this.recurringPrice,
    this.recurringPeriod,
    this.category,
    this.variants = const [],
    required this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'],
        name: json['name'] ?? '',
        description: json['description'],
        productType: json['productType'] ?? 'Service',
        salesPrice: (json['salesPrice'] as num?)?.toDouble() ?? 0,
        costPrice: (json['costPrice'] as num?)?.toDouble() ?? 0,
        recurringPrice: (json['recurringPrice'] as num?)?.toDouble(),
        recurringPeriod: json['recurringPeriod'],
        category: json['category'],
        variants: (json['variants'] as List<dynamic>?)
                ?.map((v) => ProductVariant.fromJson(v))
                .toList() ??
            [],
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'productType': productType,
        'salesPrice': salesPrice,
        'costPrice': costPrice,
        'recurringPrice': recurringPrice,
        'recurringPeriod': recurringPeriod,
        'category': category,
      };
}

class ProductVariant {
  final String id;
  final String attribute;
  final String value;
  final double extraPrice;

  ProductVariant({
    required this.id,
    required this.attribute,
    required this.value,
    this.extraPrice = 0,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        id: json['id'],
        attribute: json['attribute'] ?? '',
        value: json['value'] ?? '',
        extraPrice: (json['extraPrice'] as num?)?.toDouble() ?? 0,
      );
}
