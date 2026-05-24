import 'package:flutter/material.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/features/deliveries/data/delivery_model.dart';
import 'package:musfi_shop_mobile/features/deliveries/data/delivery_repository.dart';
import 'package:intl/intl.dart';

class DeliveriesPage extends StatefulWidget {
  const DeliveriesPage({super.key});

  @override
  State<DeliveriesPage> createState() => _DeliveriesPageState();
}

class _DeliveriesPageState extends State<DeliveriesPage> {
  late final DeliveryRepository _repository;
  List<DeliveryModel> _deliveries = [];
  String _selectedStatus = 'all';
  bool _loading = true;

  final _statuses = [
    'all',
    'pending',
    'packed',
    'in_transit',
    'delivered',
    'returned',
  ];

  @override
  void initState() {
    super.initState();
    _repository = DeliveryRepository(ApiClient());
    _loadDeliveries();
  }

  Future<void> _loadDeliveries() async {
    setState(() => _loading = true);
    try {
      final deliveries = _selectedStatus == 'all'
          ? await _repository.getDeliveries()
          : await _repository.getDeliveries(status: _selectedStatus);
      if (mounted) {
        setState(() {
          _deliveries = deliveries;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'packed':
        return Colors.blue;
      case 'in_transit':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      case 'returned':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Deliveries')),
      body: Column(
        children: [
          // Status filter
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: _statuses
                  .map(
                    (s) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(
                          s == 'all'
                              ? 'All'
                              : s.replaceAll('_', ' ').capitalize(),
                        ),
                        selected: _selectedStatus == s,
                        onSelected: (v) {
                          setState(() => _selectedStatus = s);
                          _loadDeliveries();
                        },
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _deliveries.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.local_shipping_outlined,
                          size: 64,
                          color: theme.colorScheme.primary.withValues(
                            alpha: 0.4,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text('No deliveries found'),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadDeliveries,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _deliveries.length,
                      itemBuilder: (context, index) {
                        final d = _deliveries[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: _statusColor(
                                  d.status,
                                ).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.local_shipping,
                                color: _statusColor(d.status),
                                size: 20,
                              ),
                            ),
                            title: Text(
                              d.customerName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  d.address,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Expected: ${DateFormat('dd MMM yyyy').format(d.expectedDate)}',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _statusColor(
                                  d.status,
                                ).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                d.status.replaceAll('_', ' ').toUpperCase(),
                                style: TextStyle(
                                  color: _statusColor(d.status),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

extension _StringExt on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}
