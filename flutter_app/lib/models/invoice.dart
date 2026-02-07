import '../utils/enums.dart';

class Invoice {
  final String id;
  final String invoiceNumber;
  final String? customerId;
  final String? customerName;
  final String? customerEmail;
  final String? contactId;
  final String? contactName;
  final String? subscriptionId;
  final InvoiceStatus status;
  final DateTime invoiceDate;
  final DateTime? dueDate;
  final double subtotal;
  final double taxAmount;
  final double totalAmount;
  final double paidAmount;
  final String? notes;
  final String? pdfUrl;
  final List<InvoiceLine> lines;
  final DateTime createdAt;

  Invoice({
    required this.id,
    required this.invoiceNumber,
    this.customerId,
    this.customerName,
    this.customerEmail,
    this.contactId,
    this.contactName,
    this.subscriptionId,
    required this.status,
    required this.invoiceDate,
    this.dueDate,
    required this.subtotal,
    required this.taxAmount,
    required this.totalAmount,
    required this.paidAmount,
    this.notes,
    this.pdfUrl,
    this.lines = const [],
    required this.createdAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id: json['id'],
        invoiceNumber: json['invoiceNumber'],
        customerId: json['customerId'],
        customerName: json['customer']?['name'],
        customerEmail: json['customer']?['email'],
        contactId: json['contactId'],
        contactName: json['contact']?['name'],
        subscriptionId: json['subscriptionId'],
        status: InvoiceStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => InvoiceStatus.DRAFT,
        ),
        invoiceDate: DateTime.parse(json['invoiceDate']),
        dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate']) : null,
        subtotal: (json['subtotal'] as num).toDouble(),
        taxAmount: (json['taxAmount'] as num).toDouble(),
        totalAmount: (json['totalAmount'] as num).toDouble(),
        paidAmount: (json['paidAmount'] as num).toDouble(),
        notes: json['notes'],
        pdfUrl: json['pdfUrl'],
        lines: (json['lines'] as List<dynamic>?)
                ?.map((l) => InvoiceLine.fromJson(l))
                .toList() ??
            [],
        createdAt: DateTime.parse(json['createdAt']),
      );

  double get balanceDue => totalAmount - paidAmount;
  bool get isPaid => status == InvoiceStatus.PAID;
}

class InvoiceLine {
  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final int quantity;
  final double unitPrice;
  final double? discount;
  final String? taxId;
  final String? taxName;
  final double? taxRate;
  final double taxAmount;
  final double amount;

  InvoiceLine({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    required this.quantity,
    required this.unitPrice,
    this.discount,
    this.taxId,
    this.taxName,
    this.taxRate,
    required this.taxAmount,
    required this.amount,
  });

  factory InvoiceLine.fromJson(Map<String, dynamic> json) => InvoiceLine(
        id: json['id'],
        productId: json['productId'],
        productName: json['product']?['name'],
        description: json['description'],
        quantity: json['quantity'],
        unitPrice: (json['unitPrice'] as num).toDouble(),
        discount: (json['discount'] as num?)?.toDouble(),
        taxId: json['taxId'],
        taxName: json['tax']?['name'],
        taxRate: (json['tax']?['rate'] as num?)?.toDouble(),
        taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? 0,
        amount: (json['amount'] as num).toDouble(),
      );
}
