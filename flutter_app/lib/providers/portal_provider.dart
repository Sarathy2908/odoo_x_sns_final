import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/subscription.dart';
import '../models/invoice.dart';
import '../models/payment.dart';
import '../models/product.dart';
import '../models/recurring_plan.dart';

class PortalProvider extends ChangeNotifier {
  Map<String, dynamic>? _dashboardData;
  List<Product> _catalogProducts = [];
  List<RecurringPlan> _catalogPlans = [];
  List<Subscription> _subscriptions = [];
  List<Invoice> _invoices = [];
  List<Payment> _payments = [];
  Subscription? _selectedSubscription;
  Invoice? _selectedInvoice;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get dashboardData => _dashboardData;
  List<Product> get catalogProducts => _catalogProducts;
  List<RecurringPlan> get catalogPlans => _catalogPlans;
  List<Subscription> get subscriptions => _subscriptions;
  List<Invoice> get invoices => _invoices;
  List<Payment> get payments => _payments;
  Subscription? get selectedSubscription => _selectedSubscription;
  Invoice? get selectedInvoice => _selectedInvoice;
  bool get isLoading => _isLoading;
  String? get error => _error;

  final _api = ApiService.instance;

  Future<void> fetchDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.portalDashboard);
      _dashboardData = Map<String, dynamic>.from(res.data);
    } catch (e) {
      _error = 'Failed to load portal dashboard';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchCatalog() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.portalCatalog);
      final data = Map<String, dynamic>.from(res.data);
      _catalogProducts = (data['products'] as List? ?? [])
          .map((j) => Product.fromJson(j))
          .toList();
      _catalogPlans = (data['plans'] as List? ?? [])
          .map((j) => RecurringPlan.fromJson(j))
          .toList();
    } catch (e) {
      _error = 'Failed to load catalog';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchSubscriptions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.portalSubscriptions);
      _subscriptions = (res.data as List)
          .map((j) => Subscription.fromJson(j))
          .toList();
    } catch (e) {
      _error = 'Failed to load subscriptions';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchSubscription(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.portalSubscriptions}/$id');
      _selectedSubscription = Subscription.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load subscription';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchInvoices() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.portalInvoices);
      _invoices = (res.data as List)
          .map((j) => Invoice.fromJson(j))
          .toList();
    } catch (e) {
      _error = 'Failed to load invoices';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchInvoice(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get('${ApiConfig.portalInvoices}/$id');
      _selectedInvoice = Invoice.fromJson(res.data);
    } catch (e) {
      _error = 'Failed to load invoice';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchPayments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConfig.portalPayments);
      _payments = (res.data as List)
          .map((j) => Payment.fromJson(j))
          .toList();
    } catch (e) {
      _error = 'Failed to load payments';
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> subscribe(Map<String, dynamic> data) async {
    try {
      final res = await _api.post(ApiConfig.portalSubscribe, data: data);
      return Map<String, dynamic>.from(res.data);
    } catch (e) {
      throw Exception('Failed to create subscription order');
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      await _api.put(ApiConfig.portalProfile, data: data);
      return true;
    } catch (e) {
      _error = 'Failed to update profile';
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
