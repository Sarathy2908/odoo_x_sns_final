class Tax {
  final String id;
  final String name;
  final String? description;
  final double rate;
  final String? taxType;
  final String? country;
  final String? state;
  final bool isActive;
  final DateTime createdAt;

  Tax({
    required this.id,
    required this.name,
    this.description,
    required this.rate,
    this.taxType,
    this.country,
    this.state,
    this.isActive = true,
    required this.createdAt,
  });

  factory Tax.fromJson(Map<String, dynamic> json) => Tax(
        id: json['id'],
        name: json['name'] ?? '',
        description: json['description'],
        rate: (json['rate'] as num?)?.toDouble() ?? 0,
        taxType: json['taxType'],
        country: json['country'],
        state: json['state'],
        isActive: json['isActive'] ?? true,
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'rate': rate,
        'taxType': taxType,
        'country': country,
        'state': state,
        'isActive': isActive,
      };

  String get displayRate => '${rate.toStringAsFixed(1)}%';
}
