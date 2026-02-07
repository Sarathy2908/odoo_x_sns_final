import '../utils/enums.dart';

class Subscription {
  final String id;
  final String? subscriptionNumber;
  final String? customerId;
  final String? customerName;
  final String? customerEmail;
  final String? contactId;
  final String? contactName;
  final String? planId;
  final String? planName;
  final double? planPrice;
  final String? planBillingPeriod;
  final SubscriptionStatus status;
  final DateTime startDate;
  final DateTime? expirationDate;
  final double recurringTotal;
  final String? paymentTerms;
  final String? internalNotes;
  final List<SubscriptionLine> lines;
  final List<SubscriptionHistory> history;
  final DateTime createdAt;

  Subscription({
    required this.id,
    this.subscriptionNumber,
    this.customerId,
    this.customerName,
    this.customerEmail,
    this.contactId,
    this.contactName,
    this.planId,
    this.planName,
    this.planPrice,
    this.planBillingPeriod,
    required this.status,
    required this.startDate,
    this.expirationDate,
    this.recurringTotal = 0,
    this.paymentTerms,
    this.internalNotes,
    this.lines = const [],
    this.history = const [],
    required this.createdAt,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) => Subscription(
        id: json['id'],
        subscriptionNumber: json['subscriptionNumber'],
        customerId: json['customerId'],
        customerName: json['customer']?['name'],
        customerEmail: json['customer']?['email'],
        contactId: json['contactId'],
        contactName: json['contact']?['name'],
        planId: json['planId'],
        planName: json['plan']?['name'],
        planPrice: (json['plan']?['price'] as num?)?.toDouble(),
        planBillingPeriod: json['plan']?['billingPeriod'],
        status: SubscriptionStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => SubscriptionStatus.DRAFT,
        ),
        startDate: DateTime.parse(json['startDate']),
        expirationDate: json['expirationDate'] != null
            ? DateTime.parse(json['expirationDate'])
            : null,
        recurringTotal: (json['recurringTotal'] as num?)?.toDouble() ?? 0,
        paymentTerms: json['paymentTerms'],
        internalNotes: json['internalNotes'],
        lines: (json['lines'] as List<dynamic>?)
                ?.map((l) => SubscriptionLine.fromJson(l))
                .toList() ??
            [],
        history: (json['history'] as List<dynamic>?)
                ?.map((h) => SubscriptionHistory.fromJson(h))
                .toList() ??
            [],
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'customerId': customerId,
        'contactId': contactId,
        'planId': planId,
        'startDate': startDate.toIso8601String(),
        'expirationDate': expirationDate?.toIso8601String(),
        'paymentTerms': paymentTerms,
        'internalNotes': internalNotes,
      };
}

class SubscriptionLine {
  final String id;
  final String? productId;
  final String? productName;
  final int quantity;
  final double unitPrice;
  final double discount;
  final String? taxId;
  final double amount;

  SubscriptionLine({
    required this.id,
    this.productId,
    this.productName,
    required this.quantity,
    required this.unitPrice,
    this.discount = 0,
    this.taxId,
    required this.amount,
  });

  factory SubscriptionLine.fromJson(Map<String, dynamic> json) =>
      SubscriptionLine(
        id: json['id'],
        productId: json['productId'],
        productName: json['product']?['name'],
        quantity: json['quantity'] ?? 1,
        unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
        discount: (json['discount'] as num?)?.toDouble() ?? 0,
        taxId: json['taxId'],
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'quantity': quantity,
        'unitPrice': unitPrice,
        'discount': discount,
        'taxId': taxId,
      };
}

class SubscriptionHistory {
  final String id;
  final String action;
  final String? description;
  final String? fromStatus;
  final String? toStatus;
  final String? performedBy;
  final DateTime createdAt;

  SubscriptionHistory({
    required this.id,
    required this.action,
    this.description,
    this.fromStatus,
    this.toStatus,
    this.performedBy,
    required this.createdAt,
  });

  factory SubscriptionHistory.fromJson(Map<String, dynamic> json) =>
      SubscriptionHistory(
        id: json['id'],
        action: json['action'] ?? '',
        description: json['description'],
        fromStatus: json['fromStatus'],
        toStatus: json['toStatus'],
        performedBy: json['performedBy'],
        createdAt: DateTime.parse(json['createdAt']),
      );
}
