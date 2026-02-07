import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/quotation_template.dart';

class QuotationsProvider extends ChangeNotifier {
  List<QuotationTemplate> _items = [];
  bool _isLoading = false;
  String? _error;
  QuotationTemplate? _selected;

  List<QuotationTemplate> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  QuotationTemplate? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.quotations);
      _items = (res.data as List).map((j) => QuotationTemplate.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load quotation templates';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.quotations}/$id');
      _selected = QuotationTemplate.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load quotation template';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.quotations, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create quotation template';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.quotations}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update quotation template';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.quotations}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete quotation template';
      notifyListeners();
      return false;
    }
  }
}
