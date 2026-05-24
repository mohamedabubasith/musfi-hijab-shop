import 'package:flutter/material.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';

class SuppliersPage extends StatefulWidget {
  const SuppliersPage({super.key});

  @override
  State<SuppliersPage> createState() => _SuppliersPageState();
}

class _SuppliersPageState extends State<SuppliersPage> {
  final _apiClient = ApiClient();
  List<Map<String, dynamic>> _suppliers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    setState(() => _loading = true);
    try {
      final response = await _apiClient.get(ApiConstants.suppliers);
      final data = response.data is List
          ? response.data as List
          : (response.data['items'] as List? ?? []);
      if (mounted) {
        setState(() {
          _suppliers = data.map((e) => e as Map<String, dynamic>).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Suppliers')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _suppliers.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.business_outlined,
                    size: 64,
                    color: theme.colorScheme.primary.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 16),
                  const Text('No suppliers found'),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadSuppliers,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _suppliers.length,
                itemBuilder: (context, index) {
                  final s = _suppliers[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: theme.colorScheme.primary.withValues(
                          alpha: 0.1,
                        ),
                        child: Text(
                          (s['name'] as String? ?? '?')[0].toUpperCase(),
                          style: TextStyle(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(s['name'] as String? ?? ''),
                      subtitle: Text(
                        '${s['country'] ?? ''}  |  ${s['contact'] ?? ''}',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (s['phone'] != null)
                            IconButton(
                              icon: const Icon(Icons.phone, size: 20),
                              onPressed: () {},
                            ),
                          if (s['email'] != null)
                            IconButton(
                              icon: const Icon(Icons.email, size: 20),
                              onPressed: () {},
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
