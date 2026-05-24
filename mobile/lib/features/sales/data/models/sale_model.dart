double _parsePrice(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

class SaleItemModel {
  final String id;
  final String stockItemId;
  final String itemName;
  final int quantity;
  final double unitPrice;
  final double subtotal;

  SaleItemModel({
    required this.id,
    required this.stockItemId,
    required this.itemName,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
  });

  factory SaleItemModel.fromJson(Map<String, dynamic> json) {
    return SaleItemModel(
      id: json['id'] as String? ?? '',
      stockItemId:
          json['stock_item_id'] as String? ?? json['item_id'] as String? ?? '',
      itemName: json['item_name'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
      unitPrice: _parsePrice(json['unit_price']),
      subtotal: _parsePrice(json['subtotal']),
    );
  }

  Map<String, dynamic> toJson() => {
    'stock_item_id': stockItemId,
    'item_name': itemName,
    'quantity': quantity,
    'unit_price': unitPrice,
    'subtotal': subtotal,
  };
}

class SaleModel {
  final String id;
  final String invoiceNumber;
  final String? customerName;
  final String paymentMethod;
  final double subtotal;
  final double discount;
  final double total;
  final double profit;
  final List<SaleItemModel> items;
  final String? deliveryAddress;
  final String? status;
  final String? userId;
  final DateTime saleDate;

  SaleModel({
    required this.id,
    required this.invoiceNumber,
    this.customerName,
    required this.paymentMethod,
    required this.subtotal,
    this.discount = 0,
    required this.total,
    required this.profit,
    required this.items,
    this.deliveryAddress,
    this.status,
    this.userId,
    required this.saleDate,
  });

  factory SaleModel.fromJson(Map<String, dynamic> json) {
    return SaleModel(
      id: json['id'] as String? ?? '',
      invoiceNumber: json['invoice_number'] as String? ?? '',
      customerName: json['customer_name'] as String?,
      paymentMethod: json['payment_method'] as String? ?? 'cash',
      subtotal: _parsePrice(json['subtotal']),
      discount: _parsePrice(json['discount']),
      total: _parsePrice(json['total']),
      profit: _parsePrice(json['profit']),
      items:
          (json['items'] as List?)
              ?.map((e) => SaleItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      deliveryAddress: json['delivery_address'] as String?,
      status: json['status'] as String?,
      userId: json['user_id'] as String?,
      saleDate: json['sale_date'] != null
          ? DateTime.parse(json['sale_date'] as String)
          : DateTime.now(),
    );
  }
}

class CreateSaleRequest {
  final String? customerName;
  final String? customerPhone;
  final String paymentMethod;
  final double discount;
  final String? deliveryAddress;
  final List<SaleItemModel> items;

  CreateSaleRequest({
    this.customerName,
    this.customerPhone,
    required this.paymentMethod,
    this.discount = 0,
    this.deliveryAddress,
    required this.items,
  });

  Map<String, dynamic> toJson() => {
    'customer_name': customerName,
    'customer_phone': customerPhone,
    'payment_method': paymentMethod,
    'discount': discount,
    'delivery_address': deliveryAddress,
    'items': items.map((e) => e.toJson()).toList(),
  };
}
