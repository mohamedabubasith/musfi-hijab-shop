class StockItemModel {
  final String id;
  final String name;
  final String? nameTamil;
  final String category;
  final String? originCountry;
  final String sku;
  final double costPrice;
  final double sellingPrice;
  final int quantity;
  final int lowStockThreshold;
  final String? supplier;
  final String? description;
  final String? imageUrl;
  final bool isActive;
  final DateTime? createdAt;

  StockItemModel({
    required this.id,
    required this.name,
    this.nameTamil,
    required this.category,
    this.originCountry,
    required this.sku,
    required this.costPrice,
    required this.sellingPrice,
    required this.quantity,
    this.lowStockThreshold = 10,
    this.supplier,
    this.description,
    this.imageUrl,
    this.isActive = true,
    this.createdAt,
  });

  factory StockItemModel.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return StockItemModel(
      id: json['id'] as String,
      name: json['name'] as String,
      nameTamil: json['name_ta'] as String?,
      category: json['category'] as String,
      originCountry: json['origin_country'] as String?,
      sku: json['sku'] as String,
      costPrice: parsePrice(json['cost_price']),
      sellingPrice: parsePrice(json['selling_price']),
      quantity: (json['quantity'] as num).toInt(),
      lowStockThreshold: (json['low_stock_threshold'] as num?)?.toInt() ?? 10,
      supplier: json['supplier'] as String?,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'name_tamil': nameTamil,
    'category': category,
    'origin_country': originCountry,
    'sku': sku,
    'cost_price': costPrice,
    'selling_price': sellingPrice,
    'quantity': quantity,
    'low_stock_threshold': lowStockThreshold,
    'supplier': supplier,
    'description': description,
  };
}

class StockMovementModel {
  final String id;
  final String itemId;
  final int quantityChange;
  final int newQuantity;
  final String type;
  final String? note;
  final String? userId;
  final DateTime createdAt;

  StockMovementModel({
    required this.id,
    required this.itemId,
    required this.quantityChange,
    required this.newQuantity,
    required this.type,
    this.note,
    this.userId,
    required this.createdAt,
  });

  factory StockMovementModel.fromJson(Map<String, dynamic> json) {
    return StockMovementModel(
      id: json['id'] as String,
      itemId: json['item_id'] as String,
      quantityChange: (json['quantity_change'] as num).toInt(),
      newQuantity: (json['new_quantity'] as num).toInt(),
      type: json['type'] as String,
      note: json['note'] as String?,
      userId: json['user_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
