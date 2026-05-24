import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/stock/data/models/stock_item_model.dart';

void main() {
  group('StockItemModel', () {
    final mockJson = {
      'id': 'item-1',
      'name': 'Silk Hijab',
      'name_tamil': 'சில்க் ஹிஜாப்',
      'category': 'hijab',
      'origin_country': 'Malaysia',
      'sku': 'MUS001',
      'cost_price': 150.0,
      'selling_price': 299.0,
      'quantity': 50,
      'low_stock_threshold': 10,
      'supplier': 'Malaysia Textiles',
      'description': 'Premium silk hijab',
      'image_url': '/uploads/item-1.jpg',
      'is_active': true,
      'created_at': '2025-01-01T00:00:00Z',
    };

    test('fromJson creates correct model', () {
      final item = StockItemModel.fromJson(mockJson);
      expect(item.id, 'item-1');
      expect(item.name, 'Silk Hijab');
      expect(item.nameTamil, 'சில்க் ஹிஜாப்');
      expect(item.category, 'hijab');
      expect(item.originCountry, 'Malaysia');
      expect(item.sku, 'MUS001');
      expect(item.costPrice, 150.0);
      expect(item.sellingPrice, 299.0);
      expect(item.quantity, 50);
      expect(item.lowStockThreshold, 10);
      expect(item.supplier, 'Malaysia Textiles');
      expect(item.imageUrl, '/uploads/item-1.jpg');
      expect(item.isActive, true);
    });

    test('fromJson handles minimal fields', () {
      final json = {
        'id': 'item-2',
        'name': 'Basic Scarf',
        'category': 'scarf',
        'sku': 'MUS002',
        'cost_price': 100,
        'selling_price': 199,
        'quantity': 5,
      };
      final item = StockItemModel.fromJson(json);
      expect(item.name, 'Basic Scarf');
      expect(item.category, 'scarf');
      expect(item.sku, 'MUS002');
      expect(item.costPrice, 100.0);
      expect(item.lowStockThreshold, 10); // default value
      expect(item.isActive, true);
      expect(item.originCountry, null);
    });

    test('toJson returns only create-relevant fields', () {
      final item = StockItemModel.fromJson(mockJson);
      final json = item.toJson();
      expect(json['name'], 'Silk Hijab');
      expect(json['sku'], 'MUS001');
      expect(json['category'], 'hijab');
      expect(json['cost_price'], 150.0);
      expect(json['selling_price'], 299.0);
      expect(json['quantity'], 50);
      // id and image_url should NOT be in toJson
      expect(json.containsKey('id'), false);
      expect(json.containsKey('image_url'), false);
    });

    test('stock status detection works', () {
      final outOfStock = StockItemModel.fromJson({
        'id': '1',
        'name': 'A',
        'category': 'hijab',
        'sku': 'SKU1',
        'cost_price': 10,
        'selling_price': 20,
        'quantity': 0,
      });
      expect(outOfStock.quantity, 0);
      expect(outOfStock.quantity <= outOfStock.lowStockThreshold, true);

      final lowStock = StockItemModel.fromJson({
        'id': '2',
        'name': 'B',
        'category': 'hijab',
        'sku': 'SKU2',
        'cost_price': 10,
        'selling_price': 20,
        'quantity': 5,
      });
      expect(lowStock.quantity, 5);
      expect(lowStock.quantity <= lowStock.lowStockThreshold, true);

      final inStock = StockItemModel.fromJson({
        'id': '3',
        'name': 'C',
        'category': 'hijab',
        'sku': 'SKU3',
        'cost_price': 10,
        'selling_price': 20,
        'quantity': 100,
      });
      expect(inStock.quantity, 100);
      expect(inStock.quantity > inStock.lowStockThreshold, true);
    });
  });

  group('StockMovementModel', () {
    test('fromJson creates correct model', () {
      final json = {
        'id': 'mov-1',
        'item_id': 'item-1',
        'quantity_change': 20,
        'new_quantity': 70,
        'type': 'restock',
        'note': 'Monthly restock',
        'user_id': 'user-1',
        'created_at': '2025-06-01T10:00:00Z',
      };
      final movement = StockMovementModel.fromJson(json);
      expect(movement.id, 'mov-1');
      expect(movement.quantityChange, 20);
      expect(movement.newQuantity, 70);
      expect(movement.type, 'restock');
      expect(movement.note, 'Monthly restock');
    });
  });
}
