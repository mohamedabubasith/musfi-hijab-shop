import 'package:flutter/material.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';

String _parseReportValue(dynamic value) {
  if (value == null) return '0';
  if (value is num) return value.toStringAsFixed(0);
  if (value is String) {
    final parsed = double.tryParse(value);
    return parsed?.toStringAsFixed(0) ?? value;
  }
  return value.toString();
}

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  final _apiClient = ApiClient();
  DateTimeRange? _dateRange;
  Map<String, dynamic>? _reportData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _dateRange = DateTimeRange(
      start: DateTime.now().subtract(const Duration(days: 30)),
      end: DateTime.now(),
    );
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() => _loading = true);
    try {
      final response = await _apiClient.get(ApiConstants.dashboardSummary);
      if (mounted) {
        setState(() {
          _reportData = response.data;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      initialDateRange: _dateRange,
    );
    if (picked != null) {
      setState(() => _dateRange = picked);
      _loadReport();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports'),
        actions: [
          TextButton.icon(
            onPressed: _pickDateRange,
            icon: const Icon(Icons.date_range, size: 18),
            label: Text(
              _dateRange != null
                  ? '${DateFormat('dd/MM').format(_dateRange!.start)} - ${DateFormat('dd/MM').format(_dateRange!.end)}'
                  : 'Select dates',
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadReport,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _ReportRow(
                            label: 'Monthly Revenue',
                            value:
                                '₹${_parseReportValue(_reportData?['monthly_revenue'])}',
                            icon: Icons.trending_up,
                            color: Colors.green,
                          ),
                          const Divider(),
                          _ReportRow(
                            label: 'Monthly Profit',
                            value:
                                '₹${_parseReportValue(_reportData?['monthly_profit'])}',
                            icon: Icons.account_balance_wallet,
                            color: Colors.blue,
                          ),
                          const Divider(),
                          _ReportRow(
                            label: 'Today\'s Sales',
                            value: _parseReportValue(
                              _reportData?['today_sales_count'],
                            ),
                            icon: Icons.receipt,
                            color: Colors.purple,
                          ),
                          const Divider(),
                          _ReportRow(
                            label: 'Total Stock',
                            value: _parseReportValue(
                              _reportData?['total_stock_count'],
                            ),
                            icon: Icons.inventory_2,
                            color: Colors.orange,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _ReportRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _ReportRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: theme.textTheme.bodyLarge)),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
