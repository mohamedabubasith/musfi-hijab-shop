import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:musfi_shop_mobile/features/sales/data/models/sale_model.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_bloc.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_event.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_state.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';
import 'package:musfi_shop_mobile/features/stock/data/repositories/stock_repository.dart';

class NewSalePage extends StatefulWidget {
  const NewSalePage({super.key});

  @override
  State<NewSalePage> createState() => _NewSalePageState();
}

class _NewSalePageState extends State<NewSalePage> {
  final _searchController = TextEditingController();
  final _customerController = TextEditingController();
  final _discountController = TextEditingController();
  List<StockItemModel> _searchResults = [];
  final _paymentMethods = ['cash', 'upi', 'card', 'online'];

  @override
  void dispose() {
    _searchController.dispose();
    _customerController.dispose();
    _discountController.dispose();
    super.dispose();
  }

  void _onSearch(String query) async {
    if (query.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    try {
      final repo = context.read<SalesBloc>() as dynamic;
      // Use StockRepository to search
      final stockRepo = StockRepository(
        (repo as dynamic).repository?._apiClient ?? context.read(),
      );
      final results = await stockRepo.getStock(search: query);
      if (mounted) setState(() => _searchResults = results);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('New Sale')),
      body: BlocConsumer<SalesBloc, SalesState>(
        listener: (context, state) {
          if (state.currentSale != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Sale confirmed! Invoice: #${state.currentSale!.invoiceNumber}',
                ),
                backgroundColor: Colors.green,
              ),
            );
            context.pop();
          }
          if (state.status == SalesStatus.error && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          return Column(
            children: [
              // Search products
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search products by name...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchResults = []);
                            },
                          )
                        : null,
                  ),
                  onChanged: _onSearch,
                ),
              ),

              // Search results
              if (_searchResults.isNotEmpty)
                SizedBox(
                  height: 200,
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: _searchResults
                        .map(
                          (item) => ListTile(
                            leading: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary.withValues(
                                  alpha: 0.1,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.inventory_2, size: 20),
                            ),
                            title: Text(item.name),
                            subtitle: Text(
                              '₹${item.sellingPrice.toStringAsFixed(0)} — ${item.quantity} in stock',
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.add_shopping_cart),
                              onPressed: item.quantity > 0
                                  ? () => context.read<SalesBloc>().add(
                                      AddToCartEvent(item: item),
                                    )
                                  : null,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),

              // Cart
              Expanded(
                child: state.cart.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.shopping_cart_outlined,
                              size: 64,
                              color: theme.colorScheme.primary.withValues(
                                alpha: 0.4,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text('Cart is empty'),
                            const Text('Search and add products above'),
                          ],
                        ),
                      )
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          // Customer info
                          Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: TextField(
                              controller: _customerController,
                              decoration: const InputDecoration(
                                labelText: 'Customer Name (optional)',
                                prefixIcon: Icon(Icons.person),
                              ),
                              onChanged: (v) => context.read<SalesBloc>().add(
                                UpdateCustomerEvent(name: v.isEmpty ? null : v),
                              ),
                            ),
                          ),
                          ...state.cart.map(
                            (item) => Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(8),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.itemName,
                                            style: theme.textTheme.titleSmall
                                                ?.copyWith(
                                                  fontWeight: FontWeight.w600,
                                                ),
                                          ),
                                          Text(
                                            '₹${item.unitPrice.toStringAsFixed(0)} each',
                                          ),
                                        ],
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(
                                            Icons.remove_circle_outline,
                                            size: 20,
                                          ),
                                          onPressed: item.quantity > 1
                                              ? () => context
                                                    .read<SalesBloc>()
                                                    .add(
                                                      UpdateCartQuantityEvent(
                                                        itemId: item.itemId,
                                                        quantity:
                                                            item.quantity - 1,
                                                      ),
                                                    )
                                              : null,
                                        ),
                                        Text(
                                          '${item.quantity}',
                                          style: theme.textTheme.titleMedium,
                                        ),
                                        IconButton(
                                          icon: const Icon(
                                            Icons.add_circle_outline,
                                            size: 20,
                                          ),
                                          onPressed: () =>
                                              context.read<SalesBloc>().add(
                                                UpdateCartQuantityEvent(
                                                  itemId: item.itemId,
                                                  quantity: item.quantity + 1,
                                                ),
                                              ),
                                        ),
                                      ],
                                    ),
                                    SizedBox(
                                      width: 80,
                                      child: Text(
                                        '₹${item.subtotal.toStringAsFixed(0)}',
                                        textAlign: TextAlign.right,
                                        style: theme.textTheme.titleSmall
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(
                                        Icons.delete_outline,
                                        size: 20,
                                        color: Colors.red,
                                      ),
                                      onPressed: () =>
                                          context.read<SalesBloc>().add(
                                            RemoveFromCartEvent(
                                              itemId: item.itemId,
                                            ),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
              ),

              // Bottom checkout bar
              if (state.cart.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Payment method
                      Row(
                        children: [
                          const Text('Payment: '),
                          Expanded(
                            child: DropdownButton<String>(
                              value: state.paymentMethod,
                              isExpanded: true,
                              underline: const SizedBox(),
                              items: _paymentMethods
                                  .map(
                                    (m) => DropdownMenuItem(
                                      value: m,
                                      child: Text(m.toUpperCase()),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (v) => context.read<SalesBloc>().add(
                                UpdatePaymentMethodEvent(method: v!),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Discount
                      Row(
                        children: [
                          const Text('Discount: '),
                          SizedBox(
                            width: 80,
                            child: TextField(
                              controller: _discountController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                isDense: true,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 8,
                                ),
                                hintText: '0',
                              ),
                              onChanged: (v) => context.read<SalesBloc>().add(
                                UpdateDiscountEvent(
                                  discount: double.tryParse(v) ?? 0,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '₹${state.cartTotal.toStringAsFixed(0)}',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: state.status == SalesStatus.loading
                              ? null
                              : () => _confirmSale(context, state),
                          icon: state.status == SalesStatus.loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Icon(Icons.check),
                          label: Text(
                            state.status == SalesStatus.loading
                                ? 'Processing...'
                                : 'Confirm Sale',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _confirmSale(BuildContext context, SalesState state) {
    if (state.cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Add at least one item to cart'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final request = CreateSaleRequest(
      customerName: _customerController.text.trim().isEmpty
          ? null
          : _customerController.text.trim(),
      paymentMethod: state.paymentMethod,
      discount: state.discount,
      items: state.cart
          .map(
            (c) => SaleItemModel(
              id: '',
              stockItemId: c.itemId,
              itemName: c.itemName,
              quantity: c.quantity,
              unitPrice: c.unitPrice,
              subtotal: c.subtotal,
            ),
          )
          .toList(),
    );

    context.read<SalesBloc>().add(ConfirmSaleEvent(request: request));
  }
}
