import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/subscription.dart';

class SubscriptionsProvider extends ChangeNotifier {
  List<Subscription> _items = [];
  bool _isLoading = false;
  String? _error;
  Subscription? _selected;

  List<Subscription> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Subscription? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.subscriptions);
      _items = (res.data as List).map((j) => Subscription.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load subscriptions';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.subscriptions}/$id');
      _selected = Subscription.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load subscription';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.subscriptions, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create subscription';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.subscriptions}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update subscription';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.subscriptions}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete subscription';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateStatus(String id, String status) async {
    try {
      await _api.put('${ApiConfig.subscriptions}/$id/status', data: {'status': status});
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update subscription status';
      notifyListeners();
      return false;
    }
  }

  Future<bool> createFromTemplate(String templateId, Map<String, dynamic> data) async {
    try {
      await _api.post('${ApiConfig.subscriptions}/from-template/$templateId', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create subscription from template';
      notifyListeners();
      return false;
    }
  }
}
