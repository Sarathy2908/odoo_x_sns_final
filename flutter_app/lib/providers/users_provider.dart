import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/user.dart';

class UsersProvider extends ChangeNotifier {
  List<User> _items = [];
  bool _isLoading = false;
  String? _error;
  User? _selected;

  List<User> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  User? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.users);
      _items = (res.data as List).map((j) => User.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load users';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.users}/$id');
      _selected = User.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load user';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.users, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create user';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.users}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update user';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.users}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete user';
      notifyListeners();
      return false;
    }
  }
}
