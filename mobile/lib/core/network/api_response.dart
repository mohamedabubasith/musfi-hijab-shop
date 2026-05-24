class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? totalCount;
  final int? currentPage;
  final int? pageSize;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.totalCount,
    this.currentPage,
    this.pageSize,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse(
      success: true,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : null,
      message: json['message'] as String?,
      totalCount: json['total'] as int?,
      currentPage: json['page'] as int?,
      pageSize: json['page_size'] as int?,
    );
  }

  factory ApiResponse.error(String message) {
    return ApiResponse(success: false, message: message);
  }
}
