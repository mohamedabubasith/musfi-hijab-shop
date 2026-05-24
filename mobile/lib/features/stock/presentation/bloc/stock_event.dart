import 'package:equatable/equatable.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';

abstract class StockEvent extends Equatable {
  const StockEvent();

  @override
  List<Object?> get props => [];
}

class LoadStockEvent extends StockEvent {
  final String? search;
  final String? category;
  final String? origin;
  final int page;

  const LoadStockEvent({
    this.search,
    this.category,
    this.origin,
    this.page = 1,
  });

  @override
  List<Object?> get props => [search, category, origin, page];
}

class LoadMoreStockEvent extends StockEvent {}

class LoadStockItemEvent extends StockEvent {
  final String id;
  const LoadStockItemEvent({required this.id});
}

class CreateStockEvent extends StockEvent {
  final StockItemModel item;
  const CreateStockEvent({required this.item});
}

class UpdateStockEvent extends StockEvent {
  final String id;
  final StockItemModel item;
  const UpdateStockEvent({required this.id, required this.item});
}

class DeleteStockEvent extends StockEvent {
  final String id;
  const DeleteStockEvent({required this.id});
}

class RestockEvent extends StockEvent {
  final String id;
  final int quantity;
  final String? note;
  const RestockEvent({required this.id, required this.quantity, this.note});
}

class LoadLowStockEvent extends StockEvent {}

class LoadMovementsEvent extends StockEvent {
  final String itemId;
  const LoadMovementsEvent({required this.itemId});
}

class ClearStockErrorEvent extends StockEvent {}
