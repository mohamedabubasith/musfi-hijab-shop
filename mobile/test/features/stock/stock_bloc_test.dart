import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';
import 'package:musfi_shop_mobile/features/stock/data/repositories/stock_repository.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_bloc.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_event.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_state.dart';

class MockStockRepository implements StockRepository {
  @override
  Future<List<StockItemModel>> getStock({
    String? category,
    String? originCountry,
    String? search,
    int page = 1,
    int pageSize = 20,
  }) async {
    return [
      StockItemModel(
        id: '1',
        name: 'Silk Hijab',
        category: 'hijab',
        sku: 'MUS001',
        costPrice: 150,
        sellingPrice: 299,
        quantity: 50,
      ),
      StockItemModel(
        id: '2',
        name: 'Cotton Scarf',
        category: 'scarf',
        sku: 'MUS002',
        costPrice: 80,
        sellingPrice: 199,
        quantity: 100,
      ),
    ];
  }

  @override
  Future<StockItemModel> getStockItem(String id) async => StockItemModel(
    id: id,
    name: 'Silk Hijab',
    category: 'hijab',
    sku: 'MUS001',
    costPrice: 150,
    sellingPrice: 299,
    quantity: 50,
  );

  @override
  Future<StockItemModel> getBySku(String sku) async => StockItemModel(
    id: '1',
    name: 'A',
    category: 'hijab',
    sku: sku,
    costPrice: 10,
    sellingPrice: 20,
    quantity: 50,
  );

  @override
  Future<StockItemModel> createStock(StockItemModel item) async => item;

  @override
  Future<StockItemModel> updateStock(String id, StockItemModel item) async =>
      item;

  @override
  Future<void> deleteStock(String id) async {}

  @override
  Future<StockItemModel> restock(
    String id,
    int quantity, {
    String? note,
  }) async => StockItemModel(
    id: id,
    name: 'A',
    category: 'hijab',
    sku: 'SKU',
    costPrice: 10,
    sellingPrice: 20,
    quantity: quantity,
  );

  @override
  Future<List<StockItemModel>> getLowStockAlerts() async => [];

  @override
  Future<List<StockMovementModel>> getMovements(String itemId) async => [];
}

void main() {
  late StockBloc stockBloc;

  setUp(() {
    stockBloc = StockBloc(repository: MockStockRepository());
  });

  tearDown(() {
    stockBloc.close();
  });

  group('StockBloc', () {
    test('initial state is initial', () {
      expect(stockBloc.state.status, StockStatus.initial);
      expect(stockBloc.state.items, isEmpty);
    });

    test('emits loading then loaded on LoadStockEvent', () {
      expectLater(
        stockBloc.stream,
        emitsInOrder([
          const StockState(status: StockStatus.loading),
          predicate<StockState>(
            (state) =>
                state.status == StockStatus.loaded &&
                state.items.length == 2 &&
                state.items[0].name == 'Silk Hijab',
          ),
        ]),
      );
      stockBloc.add(const LoadStockEvent());
    });

    test('load low stock items', () {
      expectLater(
        stockBloc.stream,
        emits(predicate<StockState>((state) => state.lowStockItems.isEmpty)),
      );
      stockBloc.add(LoadLowStockEvent());
    });

    test('load stock item by id', () async {
      stockBloc.add(const LoadStockItemEvent(id: '1'));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(stockBloc.state.status, StockStatus.loaded);
      expect(stockBloc.state.selectedItem?.name, 'Silk Hijab');
    });

    test('restock updates item quantity', () async {
      stockBloc.add(const LoadStockEvent());
      await Future.delayed(const Duration(milliseconds: 10));
      stockBloc.add(const RestockEvent(id: '1', quantity: 20));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(stockBloc.state.status, StockStatus.loaded);
      expect(stockBloc.state.items.firstWhere((i) => i.id == '1').quantity, 20);
    });

    test('load movements', () async {
      stockBloc.add(const LoadMovementsEvent(itemId: '1'));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(stockBloc.state.movements, isEmpty);
    });
  });
}
