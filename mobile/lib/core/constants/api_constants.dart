class ApiConstants {
  // Use environment-specific base URL
  // On physical device, this should be the local machine's IP
  // On emulator, use 10.0.2.2 to reach host machine
  static String get baseUrl {
    // Uses ADB reverse tunnel when connected via USB
    // Emulator uses 10.0.2.2 to reach host machine
    return const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'http://localhost:8000',
    );
  }

  static const String apiPrefix = '/api/v1';

  // Auth
  static const String login = '$apiPrefix/auth/login';
  static const String refresh = '$apiPrefix/auth/refresh';
  static const String logout = '$apiPrefix/auth/logout';
  static const String me = '$apiPrefix/auth/me';
  static const String forgotPassword = '$apiPrefix/auth/forgot-password';
  static const String resetPassword = '$apiPrefix/auth/reset-password';
  static const String changePassword = '$apiPrefix/auth/me/password';

  // Stock
  static const String stock = '$apiPrefix/stock';
  static const String stockAlerts = '$apiPrefix/stock/alerts/low';
  static const String stockExport = '$apiPrefix/stock/export/csv';

  // Sales
  static const String sales = '$apiPrefix/sales';

  // Dashboard
  static const String dashboardSummary = '$apiPrefix/dashboard/summary';

  // Others
  static const String users = '$apiPrefix/users';
  static const String suppliers = '$apiPrefix/suppliers';
  static const String deliveries = '$apiPrefix/deliveries';
  static const String aiAdvisor = '$apiPrefix/ai-advisor';
  static const String shopConfig = '$apiPrefix/shop-config';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
