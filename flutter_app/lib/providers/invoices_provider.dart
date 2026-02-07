import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/invoice.dart';

class InvoicesProvider extends ChangeNotifier {
  List<Invoice> _items = [];
  bool _isLoading = false;
  String? _error;
  Invoice? _selected;

  List<Invoice> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Invoice? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.invoices);
      _items = (res.data as List).map((j) => Invoice.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load invoices';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.invoices}/$id');
      _selected = Invoice.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load invoice';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.invoices, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create invoice';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.invoices}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update invoice';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.invoices}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete invoice';
      notifyListeners();
      return false;
    }
  }

  Future<bool> confirm(String id) async {
    try {
      await _api.put('${ApiConfig.invoices}/$id/confirm');
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to confirm invoice';
      notifyListeners();
      return false;
    }
  }

  Future<bool> cancel(String id) async {
    try {
      await _api.put('${ApiConfig.invoices}/$id/cancel');
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to cancel invoice';
      notifyListeners();
      return false;
    }
  }
}
