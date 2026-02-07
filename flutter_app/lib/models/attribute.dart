class Attribute {
  final String id;
  final String name;
  final String? displayType;
  final List<AttributeValue> values;
  final DateTime createdAt;

  Attribute({
    required this.id,
    required this.name,
    this.displayType,
    this.values = const [],
    required this.createdAt,
  });

  factory Attribute.fromJson(Map<String, dynamic> json) => Attribute(
        id: json['id'],
        name: json['name'] ?? '',
        displayType: json['displayType'],
        values: (json['values'] as List<dynamic>?)
                ?.map((v) => AttributeValue.fromJson(v))
                .toList() ??
            [],
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'displayType': displayType,
      };
}

class AttributeValue {
  final String id;
  final String value;
  final double extraPrice;

  AttributeValue({required this.id, required this.value, this.extraPrice = 0});

  factory AttributeValue.fromJson(Map<String, dynamic> json) =>
      AttributeValue(
        id: json['id'],
        value: json['value'] ?? '',
        extraPrice: (json['extraPrice'] as num?)?.toDouble() ?? 0,
      );
}
