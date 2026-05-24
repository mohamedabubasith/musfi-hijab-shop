import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/sales/data/models/sale_model.dart';

void main() {
  group('SaleItemModel', () {
    test('fromJson and toJson work correctly', () {
      final json = {
        'item_id': 'item-1',
        'item_name': 'Silk Hijab',
        'quantity': 2,
        'unit_price': 299.0,
        'subtotal': 598.0,
      };
      final item = SaleItemModel.fromJson(json);
      expect(item.stockItemId, 'item-1');
      expect(item.itemName, 'Silk Hijab');
      expect(item.quantity, 2);
      expect(item.unitPrice, 299.0);

      final out = item.toJson();
      expect(out['stock_item_id'], 'item-1');
      expect(out['quantity'], 2);
      expect(out['subtotal'], 598.0);
    });
  });

  group('SaleModel', () {
    final mockJson = {
      'id': 'sale-1',
      'invoice_number': 'INV-001',
      'customer_name': 'Fatima',
      'payment_method': 'cash',
      'subtotal': 1000.0,
      'discount': 50.0,
      'total': 950.0,
      'profit': 300.0,
      'items': [
        {
          'item_id': 'item-1',
          'item_name': 'Silk Hijab',
          'quantity': 2,
          'unit_price': 299.0,
          'subtotal': 598.0,
        },
        {
          'item_id': 'item-2',
          'item_name': 'Cotton Scarf',
          'quantity': 1,
          'unit_price': 402.0,
          'subtotal': 402.0,
        },
      ],
      'sale_date': '2025-06-01T10:30:00Z',
    };

    test('fromJson creates correct model', () {
      final sale = SaleModel.fromJson(mockJson);
      expect(sale.id, 'sale-1');
      expect(sale.invoiceNumber, 'INV-001');
      expect(sale.customerName, 'Fatima');
      expect(sale.paymentMethod, 'cash');
      expect(sale.subtotal, 1000.0);
      expect(sale.discount, 50.0);
      expect(sale.total, 950.0);
      expect(sale.profit, 300.0);
      expect(sale.items.length, 2);
      expect(sale.items[0].itemName, 'Silk Hijab');
      expect(sale.items[1].itemName, 'Cotton Scarf');
    });

    test('fromJson handles walk-in sales without customer', () {
      final json = {
        'id': 'sale-2',
        'invoice_number': 'INV-002',
        'payment_method': 'upi',
        'subtotal': 500.0,
        'total': 500.0,
        'profit': 150.0,
        'items': [
          {
            'item_id': 'item-3',
            'item_name': 'Niqab Black',
            'quantity': 1,
            'unit_price': 500.0,
            'subtotal': 500.0,
          },
        ],
        'sale_date': '2025-06-01T11:00:00Z',
      };
      final sale = SaleModel.fromJson(json);
      expect(sale.customerName, null);
      expect(sale.discount, 0.0);
      expect(sale.items.length, 1);
    });
  });

  group('CreateSaleRequest', () {
    test('toJson returns correct map', () {
      final request = CreateSaleRequest(
        customerName: 'Fatima',
        paymentMethod: 'upi',
        discount: 50,
        items: [
          SaleItemModel(
            id: '',
            stockItemId: 'item-1',
            itemName: 'Silk Hijab',
            quantity: 2,
            unitPrice: 299.0,
            subtotal: 598.0,
          ),
        ],
      );
      final json = request.toJson();
      expect(json['customer_name'], 'Fatima');
      expect(json['payment_method'], 'upi');
      expect(json['discount'], 50);
      expect(json['items'].length, 1);
      expect(json['items'][0]['item_name'], 'Silk Hijab');
    });
  });
}
