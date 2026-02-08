import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/recurring_plan.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class CartItem {
  final RecurringPlan plan;
  int quantity;

  CartItem({required this.plan, this.quantity = 1});

  double get total => plan.price * quantity;

  Map<String, dynamic> toJson() => {
        'planId': plan.id,
        'planName': plan.name,
        'price': plan.price,
        'quantity': quantity,
      };
}

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  // Discount state
  String? _discountCode;
  String? _discountId;
  String? _discountName;
  String? _discountType;
  double? _discountValue;
  double _discountAmount = 0;
  bool _isValidatingDiscount = false;
  String? _discountError;

  List<CartItem> get items => _items;
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalAmount => _items.fold(0.0, (sum, item) => sum + item.total);
  bool get isEmpty => _items.isEmpty;

  // Discount getters
  String? get discountCode => _discountCode;
  String? get discountId => _discountId;
  double get discountAmount => _discountAmount;
  bool get hasDiscount => _discountCode != null && _discountAmount > 0;
  bool get isValidatingDiscount => _isValidatingDiscount;
  String? get discountError => _discountError;
  String? get discountDisplayLabel {
    if (_discountName == null) return null;
    if (_discountType == 'PERCENTAGE') {
      return '$_discountName (${_discountValue?.toStringAsFixed(0)}% off)';
    }
    return '$_discountName (\u20b9${_discountValue?.toStringAsFixed(0)} off)';
  }

  double get finalAmount {
    final total = totalAmount - _discountAmount;
    return total > 0 ? total : 0;
  }

  void addItem(RecurringPlan plan) {
    final index = _items.indexWhere((item) => item.plan.id == plan.id);
    if (index >= 0) {
      _items[index].quantity++;
    } else {
      _items.add(CartItem(plan: plan));
    }
    // Re-validate discount when cart changes
    if (_discountCode != null) {
      _revalidateDiscount();
    }
    notifyListeners();
  }

  void removeItem(String planId) {
    _items.removeWhere((item) => item.plan.id == planId);
    if (_discountCode != null) {
      _revalidateDiscount();
    }
    notifyListeners();
  }

  void incrementQuantity(String planId) {
    final index = _items.indexWhere((item) => item.plan.id == planId);
    if (index >= 0) {
      _items[index].quantity++;
      if (_discountCode != null) {
        _revalidateDiscount();
      }
      notifyListeners();
    }
  }

  void decrementQuantity(String planId) {
    final index = _items.indexWhere((item) => item.plan.id == planId);
    if (index >= 0) {
      if (_items[index].quantity > 1) {
        _items[index].quantity--;
      } else {
        _items.removeAt(index);
      }
      if (_discountCode != null) {
        _revalidateDiscount();
      }
      notifyListeners();
    }
  }

  Future<bool> applyDiscount(String code) async {
    if (code.trim().isEmpty) {
      _discountError = 'Please enter a discount code';
      notifyListeners();
      return false;
    }

    _isValidatingDiscount = true;
    _discountError = null;
    notifyListeners();

    try {
      final res = await ApiService.instance.post(
        ApiConfig.discountValidate,
        data: {
          'code': code.trim(),
          'totalAmount': totalAmount,
        },
      );

      final data = Map<String, dynamic>.from(res.data);
      final discount = data['discount'] as Map<String, dynamic>;

      _discountCode = code.trim();
      _discountId = discount['id'];
      _discountName = discount['name'];
      _discountType = discount['type'];
      _discountValue = (discount['value'] as num?)?.toDouble();
      _discountAmount = (data['discountAmount'] as num?)?.toDouble() ?? 0;
      _discountError = null;
      _isValidatingDiscount = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _discountCode = null;
      _discountId = null;
      _discountName = null;
      _discountType = null;
      _discountValue = null;
      _discountAmount = 0;
      _isValidatingDiscount = false;

      // Extract error message from API response
      String errorMsg = 'Invalid discount code';
      final responseData = e.response?.data;
      if (responseData is Map && responseData['error'] != null) {
        errorMsg = responseData['error'];
      }
      _discountError = errorMsg;
      notifyListeners();
      return false;
    } catch (_) {
      _discountCode = null;
      _discountId = null;
      _discountName = null;
      _discountType = null;
      _discountValue = null;
      _discountAmount = 0;
      _isValidatingDiscount = false;
      _discountError = 'Failed to validate discount code';
      notifyListeners();
      return false;
    }
  }

  void removeDiscount() {
    _discountCode = null;
    _discountId = null;
    _discountName = null;
    _discountType = null;
    _discountValue = null;
    _discountAmount = 0;
    _discountError = null;
    notifyListeners();
  }

  Future<void> _revalidateDiscount() async {
    if (_discountCode == null || _items.isEmpty) {
      if (_items.isEmpty) removeDiscount();
      return;
    }
    // Silently re-calculate discount for new total
    try {
      final res = await ApiService.instance.post(
        ApiConfig.discountValidate,
        data: {
          'code': _discountCode,
          'totalAmount': totalAmount,
        },
      );
      final data = Map<String, dynamic>.from(res.data);
      _discountAmount = (data['discountAmount'] as num?)?.toDouble() ?? 0;
    } catch (_) {
      // If revalidation fails (e.g. min purchase no longer met), remove discount
      removeDiscount();
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    removeDiscount();
    notifyListeners();
  }

  List<Map<String, dynamic>> toJsonList() =>
      _items.map((item) => item.toJson()).toList();
}
