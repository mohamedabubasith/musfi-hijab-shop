import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/sales/data/models/sale_model.dart';
import 'package:musfi_shop_mobile/features/sales/data/repositories/sales_repository.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_bloc.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_event.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_state.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';

StockItemModel _item(String id, String name, double price) => StockItemModel(
  id: id,
  name: name,
  category: 'hijab',
  sku: 'SKU$id',
  costPrice: price * 0.5,
  sellingPrice: price,
  quantity: 100,
);

class MockSalesRepository implements SalesRepository {
  @override
  Future<List<SaleModel>> getSales({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async => [];

  @override
  Future<SaleModel> getSale(String id) async => throw UnimplementedError();

  @override
  Future<SaleModel> createSale(CreateSaleRequest request) async {
    return SaleModel(
      id: 'sale-1',
      invoiceNumber: 'INV-001',
      paymentMethod: 'cash',
      subtotal: 598.0,
      total: 598.0,
      profit: 200.0,
      items: [],
      saleDate: DateTime(2025, 6, 1, 10, 30),
    );
  }

  @override
  Future<void> deleteSale(String id) async {}
}

void main() {
  late SalesBloc salesBloc;

  setUp(() {
    salesBloc = SalesBloc(repository: MockSalesRepository());
  });

  tearDown(() {
    salesBloc.close();
  });

  group('SalesBloc', () {
    test('initial state has empty cart', () {
      expect(salesBloc.state.status, SalesStatus.initial);
      expect(salesBloc.state.cart, isEmpty);
      expect(salesBloc.state.paymentMethod, 'cash');
    });

    test('addToCart adds item correctly', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'Silk Hijab', 299)));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cart.length, 1);
      expect(salesBloc.state.cart[0].itemName, 'Silk Hijab');
      expect(salesBloc.state.cart[0].quantity, 1);
    });

    test('addToCart increments quantity for existing item', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'Silk Hijab', 299)));
      salesBloc.add(AddToCartEvent(item: _item('1', 'Silk Hijab', 299)));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cart.length, 1);
      expect(salesBloc.state.cart[0].quantity, 2);
    });

    test('addToCart adds different items separately', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'Silk Hijab', 299)));
      salesBloc.add(AddToCartEvent(item: _item('2', 'Cotton Scarf', 199)));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cart.length, 2);
    });

    test('removeFromCart removes item correctly', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'A', 299)));
      salesBloc.add(AddToCartEvent(item: _item('2', 'B', 199)));
      await Future.delayed(const Duration(milliseconds: 10));
      salesBloc.add(const RemoveFromCartEvent(itemId: '1'));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cart.length, 1);
      expect(salesBloc.state.cart[0].itemId, '2');
    });

    test('updateQuantity changes item quantity', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'A', 299)));
      await Future.delayed(const Duration(milliseconds: 10));
      salesBloc.add(const UpdateCartQuantityEvent(itemId: '1', quantity: 5));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cart[0].quantity, 5);
    });

    test('updateCustomer sets name and phone', () async {
      salesBloc.add(const UpdateCustomerEvent(name: 'John', phone: '12345'));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.customerName, 'John');
      expect(salesBloc.state.customerPhone, '12345');
    });

    test('updatePaymentMethod changes payment', () async {
      salesBloc.add(const UpdatePaymentMethodEvent(method: 'upi'));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.paymentMethod, 'upi');
    });

    test('updateDiscount changes discount', () async {
      salesBloc.add(const UpdateDiscountEvent(discount: 50));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.discount, 50);
    });

    test('cartSubtotal calculates correctly', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'A', 100)));
      salesBloc.add(AddToCartEvent(item: _item('2', 'B', 200)));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cartSubtotal, 300);
    });

    test('cartTotal accounts for discount', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'A', 100)));
      await Future.delayed(const Duration(milliseconds: 10));
      salesBloc.add(const UpdateDiscountEvent(discount: 20));
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cartTotal, 80);
    });

    test('clearCart resets everything', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'A', 299)));
      await Future.delayed(const Duration(milliseconds: 10));
      salesBloc.add(const UpdateDiscountEvent(discount: 50));
      await Future.delayed(const Duration(milliseconds: 10));
      salesBloc.add(ClearCartEvent());
      await Future.delayed(const Duration(milliseconds: 10));
      expect(salesBloc.state.cart, isEmpty);
      expect(salesBloc.state.discount, 0);
      expect(salesBloc.state.paymentMethod, 'cash');
    });

    test('confirmSale sets currentSale', () async {
      salesBloc.add(AddToCartEvent(item: _item('1', 'A', 100)));
      await Future.delayed(const Duration(milliseconds: 10));
      final request = CreateSaleRequest(
        paymentMethod: 'cash',
        items: [
          SaleItemModel(
            id: '',
            stockItemId: '1',
            itemName: 'A',
            quantity: 1,
            unitPrice: 100,
            subtotal: 100,
          ),
        ],
      );
      salesBloc.add(ConfirmSaleEvent(request: request));
      await Future.delayed(const Duration(milliseconds: 50));
      expect(salesBloc.state.currentSale, isNotNull);
      expect(salesBloc.state.currentSale!.invoiceNumber, 'INV-001');
    });

    test('LoadSalesEvent sets loaded state', () {
      expectLater(
        salesBloc.stream,
        emitsInOrder([
          const SalesState(status: SalesStatus.loading),
          predicate<SalesState>((state) => state.status == SalesStatus.loaded),
        ]),
      );
      salesBloc.add(LoadSalesEvent());
    });
  });
}
