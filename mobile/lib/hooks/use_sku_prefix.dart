import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:musfi_shop_mobile/core/constants/app_constants.dart';

final FlutterSecureStorage _storage = const FlutterSecureStorage();

Future<String> getSkuPrefix() async {
  return await _storage.read(key: AppConstants.storageKeySkuPrefix) ??
      AppConstants.defaultSkuPrefix;
}
