import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:musfi_shop_mobile/components/scanner/barcode_scanner.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_bloc.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_event.dart';

class _ConfigOption {
  final String value;
  final String label;
  _ConfigOption({required this.value, required this.label});
}

class StockFormPage extends StatefulWidget {
  final StockItemModel? item;

  const StockFormPage({super.key, this.item});

  @override
  State<StockFormPage> createState() => _StockFormPageState();
}

class _StockFormPageState extends State<StockFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _costPriceController = TextEditingController();
  final _sellingPriceController = TextEditingController();
  final _quantityController = TextEditingController();
  final _thresholdController = TextEditingController();
  final _supplierController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _apiClient = ApiClient();
  List<_ConfigOption> _categories = [];
  List<_ConfigOption> _origins = [];
  String _selectedCategory = '';
  String? _selectedOrigin;
  bool _isLoading = false;
  bool _loadingConfig = true;

  @override
  void initState() {
    super.initState();
    final item = widget.item;
    _nameController.text = item?.name ?? '';
    _skuController.text = item?.sku ?? '';
    _costPriceController.text = item != null ? item.costPrice.toString() : '';
    _sellingPriceController.text = item != null
        ? item.sellingPrice.toString()
        : '';
    _quantityController.text = item != null ? item.quantity.toString() : '';
    _thresholdController.text = item != null
        ? item.lowStockThreshold.toString()
        : '10';
    _supplierController.text = item?.supplier ?? '';
    _descriptionController.text = item?.description ?? '';
    if (item != null) {
      _selectedCategory = item.category;
      _selectedOrigin = item.originCountry;
    }
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    try {
      final catResp = await _apiClient.get(
        '${ApiConstants.shopConfig}/category',
      );
      final catList = catResp.data as List? ?? [];
      final oriResp = await _apiClient.get('${ApiConstants.shopConfig}/origin');
      final oriList = oriResp.data as List? ?? [];

      final cats = catList
          .map(
            (e) => _ConfigOption(
              value: e['value'].toString(),
              label: e['label'].toString(),
            ),
          )
          .toList();

      final oris = oriList
          .map(
            (e) => _ConfigOption(
              value: e['value'].toString(),
              label: e['label'].toString(),
            ),
          )
          .toList();

      if (mounted) {
        setState(() {
          _categories = cats;
          _origins = oris;
          if (_selectedCategory.isEmpty && cats.isNotEmpty) {
            _selectedCategory = cats.first.value;
          }
          _loadingConfig = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loadingConfig = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _costPriceController.dispose();
    _sellingPriceController.dispose();
    _quantityController.dispose();
    _thresholdController.dispose();
    _supplierController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _onSave() {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final newItem = StockItemModel(
      id: widget.item?.id ?? '',
      name: _nameController.text.trim(),
      sku: _skuController.text.trim(),
      category: _selectedCategory,
      originCountry: _selectedOrigin,
      costPrice: double.parse(_costPriceController.text),
      sellingPrice: double.parse(_sellingPriceController.text),
      quantity: int.parse(_quantityController.text),
      lowStockThreshold: int.parse(_thresholdController.text),
      supplier: _supplierController.text.trim().isEmpty
          ? null
          : _supplierController.text.trim(),
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
    );

    if (widget.item != null) {
      context.read<StockBloc>().add(
        UpdateStockEvent(id: widget.item!.id, item: newItem),
      );
    } else {
      context.read<StockBloc>().add(CreateStockEvent(item: newItem));
    }

    setState(() => _isLoading = false);
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.item != null;

    return Scaffold(
      appBar: AppBar(title: Text(isEditing ? 'Edit Item' : 'Add Item')),
      body: _loadingConfig
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Name *'),
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _skuController,
                            decoration: const InputDecoration(
                              labelText: 'SKU *',
                            ),
                            validator: (v) => (v == null || v.isEmpty)
                                ? 'SKU is required'
                                : null,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.qr_code_scanner),
                          tooltip: 'Scan barcode',
                          onPressed: () async {
                            final scanned = await Navigator.push<String>(
                              context,
                              MaterialPageRoute(
                                builder: (_) => BarcodeScanner(
                                  onScanned: (code) =>
                                      Navigator.pop(context, code),
                                ),
                              ),
                            );
                            if (scanned != null) {
                              _skuController.text = scanned;
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      initialValue: _selectedCategory.isNotEmpty
                          ? _selectedCategory
                          : null,
                      decoration: const InputDecoration(
                        labelText: 'Category *',
                      ),
                      items: _categories
                          .map(
                            (c) => DropdownMenuItem(
                              value: c.value,
                              child: Text(c.label),
                            ),
                          )
                          .toList(),
                      onChanged: (v) =>
                          setState(() => _selectedCategory = v ?? ''),
                    ),
                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      initialValue: _selectedOrigin,
                      decoration: const InputDecoration(
                        labelText: 'Origin / Source',
                      ),
                      items: _origins
                          .map(
                            (o) => DropdownMenuItem(
                              value: o.value,
                              child: Text(o.label),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setState(() => _selectedOrigin = v),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _costPriceController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Cost Price *',
                            ),
                            validator: (v) =>
                                (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _sellingPriceController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Selling Price *',
                            ),
                            validator: (v) =>
                                (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _quantityController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Quantity *',
                            ),
                            validator: (v) =>
                                (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _thresholdController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Low Stock Threshold',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _supplierController,
                      decoration: const InputDecoration(labelText: 'Supplier'),
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                      ),
                    ),
                    const SizedBox(height: 32),

                    ElevatedButton(
                      onPressed: _isLoading ? null : _onSave,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(isEditing ? 'Update Item' : 'Create Item'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
