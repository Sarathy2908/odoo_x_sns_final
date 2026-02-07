import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/tax.dart';

class TaxesProvider extends ChangeNotifier {
  List<Tax> _items = [];
  bool _isLoading = false;
  String? _error;
  Tax? _selected;

  List<Tax> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Tax? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.taxes);
      _items = (res.data as List).map((j) => Tax.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load taxes';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.taxes}/$id');
      _selected = Tax.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load tax';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.taxes, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create tax';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.taxes}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update tax';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.taxes}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete tax';
      notifyListeners();
      return false;
    }
  }
}
