import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;
  bool get isInitialized => _isInitialized;

  final AuthService _authService = AuthService();

  Future<void> initialize() async {
    final storage = await StorageService.getInstance();
    final userJson = storage.getUser();
    final token = storage.getToken();

    if (userJson != null && token != null) {
      try {
        _user = User.fromJson(jsonDecode(userJson));
      } catch (_) {
        await storage.clear();
      }
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.login(email, password);
      final storage = await StorageService.getInstance();

      await storage.saveToken(data['token']);
      _user = User.fromJson(data['user']);
      await storage.saveUser(jsonEncode(data['user']));
      await storage.saveRole(_user!.role.name);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup(String name, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.signup(
        name: name,
        email: email,
        password: password,
      );
      final storage = await StorageService.getInstance();

      await storage.saveToken(data['token']);
      _user = User.fromJson(data['user']);
      await storage.saveUser(jsonEncode(data['user']));
      await storage.saveRole(_user!.role.name);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestPasswordReset(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.requestPasswordReset(email);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final storage = await StorageService.getInstance();
    await storage.clear();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      // Extract backend error message from response
      if (e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          if (data['error'] != null) return data['error'].toString();
          if (data['message'] != null) return data['message'].toString();
        }
      }
      switch (e.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Request timed out. Please try again.';
        case DioExceptionType.connectionError:
          return 'Unable to connect to server. Check your internet.';
        case DioExceptionType.badResponse:
          final code = e.response?.statusCode;
          if (code == 401) return 'Invalid email or password';
          if (code == 403) return 'Access denied';
          if (code == 404) return 'Not found';
          if (code == 409) return 'User already exists';
          return 'Server error ($code)';
        default:
          return 'Something went wrong. Please try again.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
