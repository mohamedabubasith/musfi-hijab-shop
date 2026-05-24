import 'package:equatable/equatable.dart';
import 'package:musfi_shop_mobile/features/sales/data/models/sale_model.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';

abstract class SalesEvent extends Equatable {
  const SalesEvent();

  @override
  List<Object?> get props => [];
}

class LoadSalesEvent extends SalesEvent {}

class AddToCartEvent extends SalesEvent {
  final StockItemModel item;
  const AddToCartEvent({required this.item});
}

class RemoveFromCartEvent extends SalesEvent {
  final String itemId;
  const RemoveFromCartEvent({required this.itemId});
}

class UpdateCartQuantityEvent extends SalesEvent {
  final String itemId;
  final int quantity;
  const UpdateCartQuantityEvent({required this.itemId, required this.quantity});
}

class UpdateCustomerEvent extends SalesEvent {
  final String? name;
  final String? phone;
  const UpdateCustomerEvent({this.name, this.phone});
}

class UpdatePaymentMethodEvent extends SalesEvent {
  final String method;
  const UpdatePaymentMethodEvent({required this.method});
}

class UpdateDiscountEvent extends SalesEvent {
  final double discount;
  const UpdateDiscountEvent({required this.discount});
}

class ConfirmSaleEvent extends SalesEvent {
  final CreateSaleRequest request;
  const ConfirmSaleEvent({required this.request});
}

class ClearCartEvent extends SalesEvent {}
