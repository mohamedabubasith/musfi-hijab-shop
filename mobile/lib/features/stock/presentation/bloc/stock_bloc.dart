import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:musfi_shop_mobile/features/stock/data/repositories/stock_repository.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_event.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_state.dart';

class StockBloc extends Bloc<StockEvent, StockState> {
  final StockRepository _repository;

  StockBloc({required StockRepository repository})
    : _repository = repository,
      super(const StockState()) {
    on<LoadStockEvent>(_onLoadStock);
    on<LoadMoreStockEvent>(_onLoadMore);
    on<LoadStockItemEvent>(_onLoadItem);
    on<CreateStockEvent>(_onCreate);
    on<UpdateStockEvent>(_onUpdate);
    on<DeleteStockEvent>(_onDelete);
    on<RestockEvent>(_onRestock);
    on<LoadLowStockEvent>(_onLoadLowStock);
    on<LoadMovementsEvent>(_onLoadMovements);
    on<ClearStockErrorEvent>(
      (_, emit) => emit(state.copyWith(errorMessage: null)),
    );
  }

  Future<void> _onLoadStock(
    LoadStockEvent event,
    Emitter<StockState> emit,
  ) async {
    emit(
      state.copyWith(status: StockStatus.loading, searchQuery: event.search),
    );
    try {
      final items = await _repository.getStock(
        search: event.search,
        page: event.page,
      );
      emit(
        state.copyWith(
          status: StockStatus.loaded,
          items: items,
          currentPage: event.page,
          hasMore: items.length >= 20,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: StockStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onLoadMore(
    LoadMoreStockEvent event,
    Emitter<StockState> emit,
  ) async {
    if (!state.hasMore || state.status == StockStatus.loading) return;
    final nextPage = state.currentPage + 1;
    try {
      final items = await _repository.getStock(
        page: nextPage,
        search: state.searchQuery,
      );
      emit(
        state.copyWith(
          items: [...state.items, ...items],
          currentPage: nextPage,
          hasMore: items.length >= 20,
        ),
      );
    } catch (_) {}
  }

  Future<void> _onLoadItem(
    LoadStockItemEvent event,
    Emitter<StockState> emit,
  ) async {
    emit(state.copyWith(status: StockStatus.loading));
    try {
      final item = await _repository.getStockItem(event.id);
      emit(state.copyWith(status: StockStatus.loaded, selectedItem: item));
    } catch (e) {
      emit(
        state.copyWith(status: StockStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onCreate(
    CreateStockEvent event,
    Emitter<StockState> emit,
  ) async {
    try {
      await _repository.createStock(event.item);
      final items = await _repository.getStock();
      emit(state.copyWith(items: items));
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onUpdate(
    UpdateStockEvent event,
    Emitter<StockState> emit,
  ) async {
    try {
      await _repository.updateStock(event.id, event.item);
      final items = await _repository.getStock();
      emit(state.copyWith(items: items));
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onDelete(
    DeleteStockEvent event,
    Emitter<StockState> emit,
  ) async {
    try {
      await _repository.deleteStock(event.id);
      final items = await _repository.getStock();
      emit(state.copyWith(items: items));
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onRestock(RestockEvent event, Emitter<StockState> emit) async {
    try {
      final updated = await _repository.restock(
        event.id,
        event.quantity,
        note: event.note,
      );
      final items = state.items
          .map((i) => i.id == event.id ? updated : i)
          .toList();
      emit(state.copyWith(items: items, selectedItem: updated));
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }

  Future<void> _onLoadLowStock(
    LoadLowStockEvent event,
    Emitter<StockState> emit,
  ) async {
    try {
      final items = await _repository.getLowStockAlerts();
      emit(state.copyWith(lowStockItems: items));
    } catch (_) {}
  }

  Future<void> _onLoadMovements(
    LoadMovementsEvent event,
    Emitter<StockState> emit,
  ) async {
    try {
      final movements = await _repository.getMovements(event.itemId);
      emit(state.copyWith(movements: movements));
    } catch (e) {
      emit(state.copyWith(errorMessage: e.toString()));
    }
  }
}
