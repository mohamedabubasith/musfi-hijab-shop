import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:musfi_shop_mobile/features/sales/data/repositories/sales_repository.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_event.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_state.dart';

class SalesBloc extends Bloc<SalesEvent, SalesState> {
  final SalesRepository _repository;

  SalesBloc({required SalesRepository repository})
    : _repository = repository,
      super(const SalesState()) {
    on<LoadSalesEvent>(_onLoadSales);
    on<AddToCartEvent>(_onAddToCart);
    on<RemoveFromCartEvent>(_onRemoveFromCart);
    on<UpdateCartQuantityEvent>(_onUpdateQuantity);
    on<UpdateCustomerEvent>(_onUpdateCustomer);
    on<UpdatePaymentMethodEvent>(_onUpdatePayment);
    on<UpdateDiscountEvent>(_onUpdateDiscount);
    on<ConfirmSaleEvent>(_onConfirmSale);
    on<ClearCartEvent>(
      (_, emit) => emit(
        state.copyWith(
          cart: [],
          customerName: null,
          customerPhone: null,
          discount: 0,
          paymentMethod: 'cash',
        ),
      ),
    );
  }

  Future<void> _onLoadSales(
    LoadSalesEvent event,
    Emitter<SalesState> emit,
  ) async {
    emit(state.copyWith(status: SalesStatus.loading));
    try {
      final sales = await _repository.getSales();
      emit(state.copyWith(status: SalesStatus.loaded, sales: sales));
    } catch (e) {
      emit(
        state.copyWith(status: SalesStatus.error, errorMessage: e.toString()),
      );
    }
  }

  void _onAddToCart(AddToCartEvent event, Emitter<SalesState> emit) {
    final existingIndex = state.cart.indexWhere(
      (c) => c.itemId == event.item.id,
    );
    if (existingIndex >= 0) {
      final updated = [...state.cart];
      updated[existingIndex] = updated[existingIndex].copyWith(
        quantity: updated[existingIndex].quantity + 1,
      );
      emit(state.copyWith(cart: updated));
    } else {
      emit(
        state.copyWith(
          cart: [
            ...state.cart,
            CartItem(
              itemId: event.item.id,
              itemName: event.item.name,
              unitPrice: event.item.sellingPrice,
            ),
          ],
        ),
      );
    }
  }

  void _onRemoveFromCart(RemoveFromCartEvent event, Emitter<SalesState> emit) {
    emit(
      state.copyWith(
        cart: state.cart.where((c) => c.itemId != event.itemId).toList(),
      ),
    );
  }

  void _onUpdateQuantity(
    UpdateCartQuantityEvent event,
    Emitter<SalesState> emit,
  ) {
    final updated = state.cart.map((c) {
      if (c.itemId == event.itemId) return c.copyWith(quantity: event.quantity);
      return c;
    }).toList();
    emit(state.copyWith(cart: updated));
  }

  void _onUpdateCustomer(UpdateCustomerEvent event, Emitter<SalesState> emit) {
    emit(
      state.copyWith(
        customerName: event.name ?? state.customerName,
        customerPhone: event.phone ?? state.customerPhone,
      ),
    );
  }

  void _onUpdatePayment(
    UpdatePaymentMethodEvent event,
    Emitter<SalesState> emit,
  ) {
    emit(state.copyWith(paymentMethod: event.method));
  }

  void _onUpdateDiscount(UpdateDiscountEvent event, Emitter<SalesState> emit) {
    emit(state.copyWith(discount: event.discount));
  }

  Future<void> _onConfirmSale(
    ConfirmSaleEvent event,
    Emitter<SalesState> emit,
  ) async {
    emit(state.copyWith(status: SalesStatus.loading));
    try {
      final sale = await _repository.createSale(event.request);
      emit(
        state.copyWith(
          status: SalesStatus.loaded,
          currentSale: sale,
          cart: [],
          customerName: null,
          customerPhone: null,
          discount: 0,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(status: SalesStatus.error, errorMessage: e.toString()),
      );
    }
  }
}
