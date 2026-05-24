double _parseMoney(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

int _parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

class DashboardModel {
  final double todayRevenue;
  final double todayProfit;
  final int todaySalesCount;
  final int totalStockCount;
  final int pendingDeliveries;
  final int lowStockCount;
  final double monthlyRevenue;
  final double monthlyProfit;

  DashboardModel({
    required this.todayRevenue,
    required this.todayProfit,
    this.todaySalesCount = 0,
    required this.totalStockCount,
    this.pendingDeliveries = 0,
    this.lowStockCount = 0,
    required this.monthlyRevenue,
    required this.monthlyProfit,
  });

  factory DashboardModel.fromJson(Map<String, dynamic> json) {
    return DashboardModel(
      todayRevenue: _parseMoney(json['today_revenue']),
      todayProfit: _parseMoney(json['today_profit']),
      todaySalesCount: _parseInt(json['today_sales_count']),
      totalStockCount: _parseInt(json['total_stock_count']),
      pendingDeliveries: _parseInt(json['pending_deliveries']),
      lowStockCount: _parseInt(json['low_stock_count']),
      monthlyRevenue: _parseMoney(json['monthly_revenue']),
      monthlyProfit: _parseMoney(json['monthly_profit']),
    );
  }
}
