class DeliveryModel {
  final String id;
  final String saleId;
  final String customerName;
  final String address;
  final String? phone;
  final DateTime expectedDate;
  final String status;
  final DateTime? deliveredAt;
  final DateTime createdAt;

  DeliveryModel({
    required this.id,
    required this.saleId,
    required this.customerName,
    required this.address,
    this.phone,
    required this.expectedDate,
    required this.status,
    this.deliveredAt,
    required this.createdAt,
  });

  factory DeliveryModel.fromJson(Map<String, dynamic> json) {
    return DeliveryModel(
      id: json['id'] as String,
      saleId: json['sale_id'] as String,
      customerName: json['customer_name'] as String,
      address: json['address'] as String,
      phone: json['phone'] as String?,
      expectedDate: DateTime.parse(json['expected_date'] as String),
      status: json['status'] as String,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.parse(json['delivered_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
