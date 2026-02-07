import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/recurring_plan.dart';

class PlansProvider extends ChangeNotifier {
  List<RecurringPlan> _items = [];
  bool _isLoading = false;
  String? _error;
  RecurringPlan? _selected;

  List<RecurringPlan> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  RecurringPlan? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.plans);
      _items = (res.data as List).map((j) => RecurringPlan.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load plans';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.plans}/$id');
      _selected = RecurringPlan.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load plan';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.plans, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create plan';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.plans}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update plan';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.plans}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete plan';
      notifyListeners();
      return false;
    }
  }
}
