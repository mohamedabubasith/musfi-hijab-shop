import 'package:equatable/equatable.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';

enum StockStatus { initial, loading, loaded, error }

class StockState extends Equatable {
  final StockStatus status;
  final List<StockItemModel> items;
  final StockItemModel? selectedItem;
  final List<StockMovementModel> movements;
  final List<StockItemModel> lowStockItems;
  final String? errorMessage;
  final int currentPage;
  final bool hasMore;
  final String? searchQuery;

  const StockState({
    this.status = StockStatus.initial,
    this.items = const [],
    this.selectedItem,
    this.movements = const [],
    this.lowStockItems = const [],
    this.errorMessage,
    this.currentPage = 1,
    this.hasMore = true,
    this.searchQuery,
  });

  StockState copyWith({
    StockStatus? status,
    List<StockItemModel>? items,
    StockItemModel? selectedItem,
    List<StockMovementModel>? movements,
    List<StockItemModel>? lowStockItems,
    String? errorMessage,
    int? currentPage,
    bool? hasMore,
    String? searchQuery,
  }) {
    return StockState(
      status: status ?? this.status,
      items: items ?? this.items,
      selectedItem: selectedItem ?? this.selectedItem,
      movements: movements ?? this.movements,
      lowStockItems: lowStockItems ?? this.lowStockItems,
      errorMessage: errorMessage ?? this.errorMessage,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  @override
  List<Object?> get props => [
    status,
    items,
    selectedItem,
    movements,
    lowStockItems,
    errorMessage,
    currentPage,
    hasMore,
    searchQuery,
  ];
}
