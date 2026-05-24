import 'package:flutter/material.dart';
import 'package:musfi_shop_mobile/core/constants/app_constants.dart';
import 'package:musfi_shop_mobile/core/constants/api_constants.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class _ShopConfigItem {
  final String id;
  String value;
  String label;
  _ShopConfigItem({required this.id, required this.value, required this.label});
}

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _apiClient = ApiClient();
  final _storage = const FlutterSecureStorage();
  final _skuPrefixController = TextEditingController();
  List<_ShopConfigItem> _categories = [];
  List<_ShopConfigItem> _origins = [];
  bool _loading = true;
  bool _savingPrefix = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _skuPrefixController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    setState(() => _loading = true);
    try {
      final prefix =
          await _storage.read(key: AppConstants.storageKeySkuPrefix) ??
          AppConstants.defaultSkuPrefix;
      _skuPrefixController.text = prefix;

      final catResp = await _apiClient.get(
        '${ApiConstants.shopConfig}/category',
      );
      final catList = catResp.data as List? ?? [];
      final oriResp = await _apiClient.get('${ApiConstants.shopConfig}/origin');
      final oriList = oriResp.data as List? ?? [];

      if (mounted) {
        setState(() {
          _categories = catList
              .map(
                (e) => _ShopConfigItem(
                  id: e['id'].toString(),
                  value: e['value'].toString(),
                  label: e['label'].toString(),
                ),
              )
              .toList();
          _origins = oriList
              .map(
                (e) => _ShopConfigItem(
                  id: e['id'].toString(),
                  value: e['value'].toString(),
                  label: e['label'].toString(),
                ),
              )
              .toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveSkuPrefix() async {
    setState(() => _savingPrefix = true);
    await _storage.write(
      key: AppConstants.storageKeySkuPrefix,
      value: _skuPrefixController.text,
    );
    if (mounted) {
      setState(() => _savingPrefix = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('SKU prefix saved'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _addItem(String type) async {
    final valueCtrl = TextEditingController();
    final labelCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Add ${type == 'category' ? 'Category' : 'Origin'}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: valueCtrl,
              decoration: const InputDecoration(
                labelText: 'Value',
                hintText: 'e.g. hijab',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: labelCtrl,
              decoration: const InputDecoration(
                labelText: 'Label',
                hintText: 'e.g. Hijab',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Add'),
          ),
        ],
      ),
    );
    if (result != true) return;
    if (valueCtrl.text.isEmpty || labelCtrl.text.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Both value and label are required'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }
    try {
      await _apiClient.post(
        ApiConstants.shopConfig,
        data: {
          'type': type,
          'value': valueCtrl.text.trim(),
          'label': labelCtrl.text.trim(),
        },
      );
      _loadSettings();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Added successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteItem(String id, String type) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete'),
        content: Text('Delete this $type?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _apiClient.delete('${ApiConstants.shopConfig}/$id');
      _loadSettings();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Deleted'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SKU Prefix',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'All product barcodes must start with this prefix',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withValues(
                              alpha: 0.6,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _skuPrefixController,
                                decoration: const InputDecoration(
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: _savingPrefix ? null : _saveSkuPrefix,
                              child: _savingPrefix
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text('Save'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Categories
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Product Categories',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              tooltip: 'Add category',
                              onPressed: () => _addItem('category'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_categories.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No categories configured',
                              style: TextStyle(color: Colors.grey),
                            ),
                          )
                        else
                          ..._categories.map(
                            (c) => ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              leading: Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              title: Text(c.label),
                              subtitle: Text(
                                c.value,
                                style: theme.textTheme.bodySmall,
                              ),
                              trailing: IconButton(
                                icon: const Icon(
                                  Icons.delete_outline,
                                  size: 18,
                                ),
                                onPressed: () => _deleteItem(c.id, 'category'),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Origins
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Origin Countries',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              tooltip: 'Add origin',
                              onPressed: () => _addItem('origin'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_origins.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'No origins configured',
                              style: TextStyle(color: Colors.grey),
                            ),
                          )
                        else
                          ..._origins.map(
                            (o) => ListTile(
                              dense: true,
                              contentPadding: EdgeInsets.zero,
                              leading: const Icon(Icons.public, size: 16),
                              title: Text(o.label),
                              subtitle: Text(
                                o.value,
                                style: theme.textTheme.bodySmall,
                              ),
                              trailing: IconButton(
                                icon: const Icon(
                                  Icons.delete_outline,
                                  size: 18,
                                ),
                                onPressed: () => _deleteItem(o.id, 'origin'),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
