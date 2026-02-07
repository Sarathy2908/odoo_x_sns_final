import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/product.dart';

class ProductsProvider extends ChangeNotifier {
  List<Product> _items = [];
  bool _isLoading = false;
  String? _error;
  Product? _selected;

  List<Product> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Product? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.products);
      _items = (res.data as List).map((j) => Product.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load products';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.products}/$id');
      _selected = Product.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load product';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.products, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create product';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.products}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update product';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.products}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete product';
      notifyListeners();
      return false;
    }
  }
}
