import '../utils/enums.dart';

class Contact {
  final String id;
  final String name;
  final String? displayName;
  final ContactType type;
  final String? email;
  final String? phone;
  final String? mobile;
  final String? website;
  final String? street;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final String? companyName;
  final String? taxId;
  final bool isCustomer;
  final bool isVendor;
  final String? notes;
  final DateTime createdAt;

  Contact({
    required this.id,
    required this.name,
    this.displayName,
    required this.type,
    this.email,
    this.phone,
    this.mobile,
    this.website,
    this.street,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.companyName,
    this.taxId,
    this.isCustomer = true,
    this.isVendor = false,
    this.notes,
    required this.createdAt,
  });

  factory Contact.fromJson(Map<String, dynamic> json) => Contact(
        id: json['id'],
        name: json['name'] ?? '',
        displayName: json['displayName'],
        type: ContactType.values.firstWhere(
          (e) => e.name == json['contactType'],
          orElse: () => ContactType.INDIVIDUAL,
        ),
        email: json['email'],
        phone: json['phone'],
        mobile: json['mobile'],
        website: json['website'],
        street: json['street'],
        city: json['city'],
        state: json['state'],
        country: json['country'],
        postalCode: json['postalCode'],
        companyName: json['companyName'],
        taxId: json['taxId'],
        isCustomer: json['isCustomer'] ?? true,
        isVendor: json['isVendor'] ?? false,
        notes: json['notes'],
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'displayName': displayName,
        'contactType': type.name,
        'email': email,
        'phone': phone,
        'mobile': mobile,
        'website': website,
        'street': street,
        'city': city,
        'state': state,
        'country': country,
        'postalCode': postalCode,
        'companyName': companyName,
        'taxId': taxId,
        'isCustomer': isCustomer,
        'isVendor': isVendor,
        'notes': notes,
      };

  String get displayAddress {
    final parts = [street, city, state, postalCode, country]
        .where((p) => p != null && p.isNotEmpty)
        .toList();
    return parts.join(', ');
  }
}
