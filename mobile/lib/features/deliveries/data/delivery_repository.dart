import 'package:dio/dio.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/features/deliveries/data/delivery_model.dart';

class DeliveryRepository {
  final ApiClient _apiClient;
  DeliveryRepository(this._apiClient);

  Future<List<DeliveryModel>> getDeliveries({String? status}) async {
    try {
      final params = <String, dynamic>{};
      if (status != null) params['status'] = status;
      final response = await _apiClient.get(
        ApiConstants.deliveries,
        queryParameters: params,
      );
      final data = response.data['items'] as List? ?? [];
      return data
          .map((e) => DeliveryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw e.response?.data?['detail']?['message'] ??
          'Failed to load deliveries';
    }
  }

  Future<void> updateStatus(String id, String status) async {
    try {
      await _apiClient.patch(
        '${ApiConstants.deliveries}/$id',
        data: {'status': status},
      );
    } on DioException catch (e) {
      throw e.response?.data?['detail']?['message'] ??
          'Failed to update status';
    }
  }
}
