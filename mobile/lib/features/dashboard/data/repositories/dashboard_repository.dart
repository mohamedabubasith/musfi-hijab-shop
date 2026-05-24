import 'package:dio/dio.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/models/dashboard_model.dart';

class DashboardRepository {
  final ApiClient _apiClient;

  DashboardRepository(this._apiClient);

  Future<DashboardModel> getDashboard() async {
    try {
      final response = await _apiClient.get(ApiConstants.dashboardSummary);
      return DashboardModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    final message = e.response?.data?['detail']?['message'] as String?;
    if (message != null) return message;
    return 'Failed to load dashboard data';
  }
}
