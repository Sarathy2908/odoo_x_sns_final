import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'storage_service.dart';

class ApiService {
  static ApiService? _instance;
  late Dio _dio;
  StorageService? _storage;

  ApiService._() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        _storage ??= await StorageService.getInstance();
        final token = _storage!.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          _storage?.clear();
        }
        return handler.next(error);
      },
    ));
  }

  static ApiService get instance {
    _instance ??= ApiService._();
    return _instance!;
  }

  Dio get dio => _dio;

  // GET
  Future<Response> get(String path, {Map<String, dynamic>? queryParams}) =>
      _dio.get(path, queryParameters: queryParams);

  // POST
  Future<Response> post(String path, {dynamic data}) =>
      _dio.post(path, data: data);

  // PUT
  Future<Response> put(String path, {dynamic data}) =>
      _dio.put(path, data: data);

  // DELETE
  Future<Response> delete(String path) => _dio.delete(path);
}
