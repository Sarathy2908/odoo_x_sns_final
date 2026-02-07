import 'package:flutter/material.dart';
import '../models/recurring_plan.dart';

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

  List<CartItem> get items => _items;
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalAmount => _items.fold(0.0, (sum, item) => sum + item.total);
  bool get isEmpty => _items.isEmpty;

  void addItem(RecurringPlan plan) {
    final index = _items.indexWhere((item) => item.plan.id == plan.id);
    if (index >= 0) {
      _items[index].quantity++;
    } else {
      _items.add(CartItem(plan: plan));
    }
    notifyListeners();
  }

  void removeItem(String planId) {
    _items.removeWhere((item) => item.plan.id == planId);
    notifyListeners();
  }

  void incrementQuantity(String planId) {
    final index = _items.indexWhere((item) => item.plan.id == planId);
    if (index >= 0) {
      _items[index].quantity++;
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
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }

  List<Map<String, dynamic>> toJsonList() =>
      _items.map((item) => item.toJson()).toList();
}
