import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class ReportsProvider extends ChangeNotifier {
  Map<String, dynamic>? _dashboardData;
  List<dynamic>? _subscriptionStats;
  List<dynamic>? _revenueData;
  List<dynamic>? _paymentData;
  List<dynamic>? _overdueInvoices;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get dashboardData => _dashboardData;
  List<dynamic>? get subscriptionStats => _subscriptionStats;
  List<dynamic>? get revenueData => _revenueData;
  List<dynamic>? get paymentData => _paymentData;
  List<dynamic>? get overdueInvoices => _overdueInvoices;
  bool get isLoading => _isLoading;
  String? get error => _error;

  final _api = ApiService.instance;

  Future<void> fetchDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.reportsDashboard);
      _dashboardData = res.data as Map<String, dynamic>;
    } catch (e) {
      _error = 'Failed to load dashboard data';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchSubscriptionReport() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.reportsSubscriptions);
      _subscriptionStats = res.data as List<dynamic>;
    } catch (e) {
      _error = 'Failed to load subscription report';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchRevenueReport() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.reportsRevenue);
      _revenueData = res.data as List<dynamic>;
    } catch (e) {
      _error = 'Failed to load revenue report';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchPaymentReport() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.reportsPayments);
      _paymentData = res.data as List<dynamic>;
    } catch (e) {
      _error = 'Failed to load payment report';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchOverdueInvoices() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.reportsOverdue);
      _overdueInvoices = res.data as List<dynamic>;
    } catch (e) {
      _error = 'Failed to load overdue invoices';
    }
    _isLoading = false;
    notifyListeners();
  }
}
