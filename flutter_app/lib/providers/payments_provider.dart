import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/payment.dart';

class PaymentsProvider extends ChangeNotifier {
  List<Payment> _items = [];
  bool _isLoading = false;
  String? _error;
  Payment? _selected;

  List<Payment> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Payment? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.payments);
      _items = (res.data as List).map((j) => Payment.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load payments';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.payments}/$id');
      _selected = Payment.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load payment';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.payments, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create payment';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.payments}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update payment';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.payments}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete payment';
      notifyListeners();
      return false;
    }
  }
}
