import '../utils/enums.dart';

class User {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? phone;
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'],
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        role: UserRole.values.firstWhere(
          (e) => e.name == json['role'],
          orElse: () => UserRole.PORTAL_USER,
        ),
        phone: json['phone'],
        address: json['address'],
        city: json['city'],
        state: json['state'],
        country: json['country'],
        postalCode: json['postalCode'],
        createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role.name,
        'phone': phone,
        'address': address,
        'city': city,
        'state': state,
        'country': country,
        'postalCode': postalCode,
      };

  bool get isAdmin => role == UserRole.ADMIN;
  bool get isInternal => role == UserRole.INTERNAL_USER;
  bool get isPortal => role == UserRole.PORTAL_USER;
  bool get isDashboardUser => isAdmin || isInternal;
}
