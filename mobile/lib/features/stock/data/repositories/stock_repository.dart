import 'package:dio/dio.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';

class StockRepository {
  final ApiClient _apiClient;

  StockRepository(this._apiClient);

  Future<List<StockItemModel>> getStock({
    String? category,
    String? originCountry,
    String? search,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final params = <String, dynamic>{'page': page, 'page_size': pageSize};
      if (category != null) params['category'] = category;
      if (originCountry != null) params['origin_country'] = originCountry;
      if (search != null) params['search'] = search;

      final response = await _apiClient.get(
        ApiConstants.stock,
        queryParameters: params,
      );
      final data = response.data['items'] as List;
      return data
          .map((e) => StockItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<StockItemModel> getStockItem(String id) async {
    try {
      final response = await _apiClient.get('${ApiConstants.stock}/$id');
      return StockItemModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<StockItemModel> getBySku(String sku) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.stock}/by-sku/$sku',
      );
      return StockItemModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<StockItemModel> createStock(StockItemModel item) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.stock,
        data: item.toJson(),
      );
      return StockItemModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<StockItemModel> updateStock(String id, StockItemModel item) async {
    try {
      final response = await _apiClient.patch(
        '${ApiConstants.stock}/$id',
        data: item.toJson(),
      );
      return StockItemModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteStock(String id) async {
    try {
      await _apiClient.delete('${ApiConstants.stock}/$id');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<StockItemModel> restock(
    String id,
    int quantity, {
    String? note,
  }) async {
    try {
      final response = await _apiClient.post(
        '${ApiConstants.stock}/$id/restock',
        data: {'quantity': quantity, 'note': note},
      );
      return StockItemModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<StockItemModel>> getLowStockAlerts() async {
    try {
      final response = await _apiClient.get(ApiConstants.stockAlerts);
      final data = response.data as List;
      return data
          .map((e) => StockItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<StockMovementModel>> getMovements(String itemId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.stock}/movements/$itemId',
      );
      final data = response.data as List;
      return data
          .map((e) => StockMovementModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    final message = e.response?.data?['detail']?['message'] as String?;
    if (message != null) return message;
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out';
      case DioExceptionType.connectionError:
        return 'Unable to connect to server';
      default:
        return 'Something went wrong';
    }
  }
}
