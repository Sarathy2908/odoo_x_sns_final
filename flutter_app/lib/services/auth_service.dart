import '../config/api_config.dart';
import 'api_service.dart';

class AuthService {
  final _api = ApiService.instance;

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _api.post(
      ApiConfig.login,
      data: {'email': email, 'password': password},
    );
    return response.data;
  }

  Future<Map<String, dynamic>> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      ApiConfig.signup,
      data: {'name': name, 'email': email, 'password': password},
    );
    return response.data;
  }

  Future<void> requestPasswordReset(String email) async {
    await _api.post(
      ApiConfig.resetPasswordRequest,
      data: {'email': email},
    );
  }

  Future<void> resetPassword(String token, String newPassword) async {
    await _api.post(
      ApiConfig.resetPassword,
      data: {'token': token, 'newPassword': newPassword},
    );
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _api.get(ApiConfig.me);
    return response.data;
  }
}
