import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/models/dashboard_model.dart';

void main() {
  group('DashboardModel', () {
    test('fromJson creates correct model', () {
      final json = {
        'today_revenue': 15000.0,
        'today_profit': 5000.0,
        'total_stock_count': 1200,
        'pending_deliveries': 8,
        'monthly_revenue': 150000.0,
        'monthly_profit': 45000.0,
      };

      final model = DashboardModel.fromJson(json);
      expect(model.todayRevenue, 15000.0);
      expect(model.todayProfit, 5000.0);
      expect(model.totalStockCount, 1200);
      expect(model.pendingDeliveries, 8);
      expect(model.monthlyRevenue, 150000.0);
      expect(model.monthlyProfit, 45000.0);
    });

    test('fromJson handles zero values', () {
      final json = {
        'today_revenue': 0,
        'today_profit': 0,
        'total_stock_count': 0,
        'pending_deliveries': 0,
        'monthly_revenue': 0,
        'monthly_profit': 0,
      };

      final model = DashboardModel.fromJson(json);
      expect(model.todayRevenue, 0);
      expect(model.todayProfit, 0);
      expect(model.totalStockCount, 0);
      expect(model.pendingDeliveries, 0);
    });
  });
}
