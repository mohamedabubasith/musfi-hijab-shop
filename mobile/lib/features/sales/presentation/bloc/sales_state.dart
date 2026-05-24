import 'package:equatable/equatable.dart';
import 'package:musfi_shop_mobile/features/sales/data/models/sale_model.dart';

enum SalesStatus { initial, loading, loaded, error }

class SalesState extends Equatable {
  final SalesStatus status;
  final List<SaleModel> sales;
  final SaleModel? currentSale;
  final String? errorMessage;

  // Cart
  final List<CartItem> cart;
  final String? customerName;
  final String? customerPhone;
  final String paymentMethod;
  final double discount;

  const SalesState({
    this.status = SalesStatus.initial,
    this.sales = const [],
    this.currentSale,
    this.errorMessage,
    this.cart = const [],
    this.customerName,
    this.customerPhone,
    this.paymentMethod = 'cash',
    this.discount = 0,
  });

  double get cartSubtotal => cart.fold(0, (sum, item) => sum + item.subtotal);
  double get cartTotal => cartSubtotal - discount;

  SalesState copyWith({
    SalesStatus? status,
    List<SaleModel>? sales,
    SaleModel? currentSale,
    String? errorMessage,
    List<CartItem>? cart,
    String? customerName,
    String? customerPhone,
    String? paymentMethod,
    double? discount,
  }) {
    return SalesState(
      status: status ?? this.status,
      sales: sales ?? this.sales,
      currentSale: currentSale ?? this.currentSale,
      errorMessage: errorMessage ?? this.errorMessage,
      cart: cart ?? this.cart,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      discount: discount ?? this.discount,
    );
  }

  @override
  List<Object?> get props => [
    status,
    sales,
    currentSale,
    errorMessage,
    cart,
    customerName,
    customerPhone,
    paymentMethod,
    discount,
  ];
}

class CartItem {
  final String itemId;
  final String itemName;
  final double unitPrice;
  int quantity;

  CartItem({
    required this.itemId,
    required this.itemName,
    required this.unitPrice,
    this.quantity = 1,
  });

  double get subtotal => unitPrice * quantity;
  double get profit => subtotal * 0.3; // approximate profit

  Map<String, dynamic> toJson() => {
    'item_id': itemId,
    'item_name': itemName,
    'quantity': quantity,
    'unit_price': unitPrice,
    'subtotal': subtotal,
  };

  CartItem copyWith({int? quantity}) => CartItem(
    itemId: itemId,
    itemName: itemName,
    unitPrice: unitPrice,
    quantity: quantity ?? this.quantity,
  );
}
