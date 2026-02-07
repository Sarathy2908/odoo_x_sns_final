import '../utils/enums.dart';

class Payment {
  final String id;
  final String? invoiceId;
  final String? invoiceNumber;
  final double? invoiceTotalAmount;
  final String? customerId;
  final String? customerName;
  final double amount;
  final PaymentMethod paymentMethod;
  final PaymentStatus status;
  final String? reference;
  final String? notes;
  final DateTime paymentDate;
  final DateTime createdAt;

  Payment({
    required this.id,
    this.invoiceId,
    this.invoiceNumber,
    this.invoiceTotalAmount,
    this.customerId,
    this.customerName,
    required this.amount,
    required this.paymentMethod,
    required this.status,
    this.reference,
    this.notes,
    required this.paymentDate,
    required this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: json['id'],
        invoiceId: json['invoiceId'],
        invoiceNumber: json['invoice']?['invoiceNumber'],
        invoiceTotalAmount:
            (json['invoice']?['totalAmount'] as num?)?.toDouble(),
        customerId: json['customerId'],
        customerName: json['customer']?['name'],
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        paymentMethod: PaymentMethod.values.firstWhere(
          (e) => e.name == json['paymentMethod'],
          orElse: () => PaymentMethod.OTHER,
        ),
        status: PaymentStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => PaymentStatus.PENDING,
        ),
        reference: json['reference'],
        notes: json['notes'],
        paymentDate: DateTime.parse(json['paymentDate']),
        createdAt: DateTime.parse(json['createdAt']),
      );

  Map<String, dynamic> toJson() => {
        'invoiceId': invoiceId,
        'amount': amount,
        'paymentMethod': paymentMethod.name,
        'reference': reference,
        'notes': notes,
        'paymentDate': paymentDate.toIso8601String(),
      };
}
