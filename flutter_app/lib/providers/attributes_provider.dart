import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/attribute.dart';

class AttributesProvider extends ChangeNotifier {
  List<Attribute> _items = [];
  bool _isLoading = false;
  String? _error;
  Attribute? _selected;

  List<Attribute> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Attribute? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.attributes);
      _items = (res.data as List).map((j) => Attribute.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load attributes';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.attributes}/$id');
      _selected = Attribute.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load attribute';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.attributes, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create attribute';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.attributes}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update attribute';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.attributes}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete attribute';
      notifyListeners();
      return false;
    }
  }
}
