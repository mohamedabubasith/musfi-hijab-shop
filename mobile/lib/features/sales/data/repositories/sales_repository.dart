import 'package:dio/dio.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/features/sales/data/models/sale_model.dart';

class SalesRepository {
  final ApiClient _apiClient;

  SalesRepository(this._apiClient);

  Future<List<SaleModel>> getSales({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    try {
      final params = <String, dynamic>{'page': page, 'page_size': pageSize};
      if (search != null) params['search'] = search;
      final response = await _apiClient.get(
        ApiConstants.sales,
        queryParameters: params,
      );
      final data = response.data['items'] as List;
      return data
          .map((e) => SaleModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<SaleModel> createSale(CreateSaleRequest request) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.sales,
        data: request.toJson(),
      );
      return SaleModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<SaleModel> getSale(String id) async {
    try {
      final response = await _apiClient.get('${ApiConstants.sales}/$id');
      return SaleModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteSale(String id) async {
    try {
      await _apiClient.delete('${ApiConstants.sales}/$id');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    final message = e.response?.data?['detail']?['message'] as String?;
    if (message != null) return message;
    return 'Failed to process sale';
  }
}
