import 'package:shared_preferences/shared_preferences.dart';
import '../config/constants.dart';

class StorageService {
  static StorageService? _instance;
  late SharedPreferences _prefs;

  StorageService._();

  static Future<StorageService> getInstance() async {
    if (_instance == null) {
      _instance = StorageService._();
      _instance!._prefs = await SharedPreferences.getInstance();
    }
    return _instance!;
  }

  // Token
  Future<void> saveToken(String token) =>
      _prefs.setString(AppConstants.tokenKey, token);

  String? getToken() => _prefs.getString(AppConstants.tokenKey);

  Future<void> removeToken() => _prefs.remove(AppConstants.tokenKey);

  // User JSON
  Future<void> saveUser(String userJson) =>
      _prefs.setString(AppConstants.userKey, userJson);

  String? getUser() => _prefs.getString(AppConstants.userKey);

  Future<void> removeUser() => _prefs.remove(AppConstants.userKey);

  // Role
  Future<void> saveRole(String role) =>
      _prefs.setString(AppConstants.roleKey, role);

  String? getRole() => _prefs.getString(AppConstants.roleKey);

  Future<void> removeRole() => _prefs.remove(AppConstants.roleKey);

  // Clear all
  Future<void> clear() async {
    await removeToken();
    await removeUser();
    await removeRole();
  }
}
