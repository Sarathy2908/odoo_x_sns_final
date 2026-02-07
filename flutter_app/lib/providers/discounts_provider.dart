import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/discount.dart';

class DiscountsProvider extends ChangeNotifier {
  List<Discount> _items = [];
  bool _isLoading = false;
  String? _error;
  Discount? _selected;

  List<Discount> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Discount? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.discounts);
      _items = (res.data as List).map((j) => Discount.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load discounts';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.discounts}/$id');
      _selected = Discount.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load discount';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.discounts, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create discount';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.discounts}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update discount';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.discounts}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete discount';
      notifyListeners();
      return false;
    }
  }
}
