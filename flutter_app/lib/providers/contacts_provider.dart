import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/contact.dart';

class ContactsProvider extends ChangeNotifier {
  List<Contact> _items = [];
  bool _isLoading = false;
  String? _error;
  Contact? _selected;

  List<Contact> get items => _items;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Contact? get selected => _selected;

  final _api = ApiService.instance;

  Future<void> fetchAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.contacts);
      _items = (res.data as List).map((j) => Contact.fromJson(j)).toList();
    } catch (e) {
      _error = 'Failed to load contacts';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOne(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.contacts}/$id');
      _selected = Contact.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load contact';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> create(Map<String, dynamic> data) async {
    try {
      await _api.post(ApiConfig.contacts, data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to create contact';
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(String id, Map<String, dynamic> data) async {
    try {
      await _api.put('${ApiConfig.contacts}/$id', data: data);
      await fetchAll();
      return true;
    } catch (e) {
      _error = 'Failed to update contact';
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(String id) async {
    try {
      await _api.delete('${ApiConfig.contacts}/$id');
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed to delete contact';
      notifyListeners();
      return false;
    }
  }
}
