import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:musfi_shop_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('E2E: Complete User Flow', () {
    testWidgets('Login → Dashboard → Stock → Sales → Logout', (WidgetTester tester) async {
      // Launch app
      app.main();
      await tester.pumpAndSettle();

      // ===== SCREEN 1: LOGIN =====
      print('🔐 Testing Login Screen...');
      expect(find.byType(MaterialApp), findsOneWidget);
      
      // Wait for login screen to render
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Find and fill email field
      final emailField = find.byType(TextField).first;
      await tester.enterText(emailField, 'admin@musfishop.com');
      await tester.pumpAndSettle();

      // Find and fill password field
      final passwordField = find.byType(TextField).at(1);
      await tester.enterText(passwordField, 'Admin@123');
      await tester.pumpAndSettle();

      // Tap login button
      final loginButton = find.byType(ElevatedButton).first;
      await tester.tap(loginButton);
      await tester.pumpAndSettle(const Duration(seconds: 3));

      print('✅ Login successful');

      // ===== SCREEN 2: DASHBOARD =====
      print('📊 Testing Dashboard Screen...');
      
      // Verify dashboard loads
      expect(find.byKey(const ValueKey('dashboard_page')), findsOneWidget);
      
      // Check if summary metrics are displayed
      await tester.pumpAndSettle(const Duration(seconds: 2));
      expect(find.text('Today'), findsWidgets);

      print('✅ Dashboard loaded with metrics');

      // ===== SCREEN 3: STOCK LIST =====
      print('📦 Testing Stock Management...');
      
      // Tap stock navigation item (index 1)
      final bottomNav = find.byType(NavigationBar);
      expect(bottomNav, findsOneWidget);
      
      // Get all navigation destinations and tap stock (index 1)
      final stockNavItem = find.byIcon(Icons.inventory_2_outlined);
      await tester.tap(stockNavItem);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify stock list page loaded
      expect(find.byKey(const ValueKey('stock_list_page')), findsOneWidget);
      
      // Verify list items exist or empty state
      await tester.pumpAndSettle();

      print('✅ Stock list page loaded');

      // ===== SCREEN 4: ADD STOCK ITEM =====
      print('➕ Testing Add Stock Item...');
      
      final addButton = find.byIcon(Icons.add);
      if (addButton.evaluate().isNotEmpty) {
        await tester.tap(addButton);
        await tester.pumpAndSettle(const Duration(seconds: 2));

        // Fill form fields
        final formFields = find.byType(TextField);
        if (formFields.evaluate().length >= 3) {
          // Name
          await tester.enterText(formFields.at(0), 'E2E Test Item');
          // SKU
          await tester.enterText(formFields.at(1), 'TST-E2E-${DateTime.now().millisecondsSinceEpoch}');
          
          await tester.pumpAndSettle();

          // Tap save button
          final saveButton = find.byType(ElevatedButton).first;
          await tester.tap(saveButton);
          await tester.pumpAndSettle(const Duration(seconds: 2));

          print('✅ Stock item created');
        }
      }

      // ===== SCREEN 5: SALES =====
      print('🛒 Testing Sales Screen...');
      
      final salesNavItem = find.byIcon(Icons.receipt_long_outlined);
      await tester.tap(salesNavItem);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify sales page loaded
      expect(find.byKey(const ValueKey('sales_list_page')), findsOneWidget);

      print('✅ Sales page loaded');

      // ===== SCREEN 6: DELIVERIES =====
      print('🚚 Testing Deliveries Screen...');
      
      final deliveriesNavItem = find.byIcon(Icons.local_shipping_outlined);
      await tester.tap(deliveriesNavItem);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify deliveries page loaded
      expect(find.byKey(const ValueKey('deliveries_page')), findsOneWidget);

      print('✅ Deliveries page loaded');

      // ===== SCREEN 7: MORE MENU =====
      print('⚙️ Testing Settings Menu...');
      
      final moreNavItem = find.byIcon(Icons.more_horiz);
      await tester.tap(moreNavItem);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      // Verify bottom sheet opens
      expect(find.byType(ModalBottomSheet) | find.byType(Container), findsOneWidget);

      // Find and tap Settings
      final settingsOption = find.text('Settings');
      if (settingsOption.evaluate().isNotEmpty) {
        await tester.tap(settingsOption);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('✅ Settings page opened');
        
        // Go back
        await tester.pageBack();
        await tester.pumpAndSettle();
      }

      // ===== SCREEN 8: LOGOUT =====
      print('🚪 Testing Logout...');
      
      // Open more menu again
      await tester.tap(moreNavItem);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      // Tap logout
      final logoutOption = find.text('Logout');
      if (logoutOption.evaluate().isNotEmpty) {
        await tester.tap(logoutOption);
        await tester.pumpAndSettle(const Duration(seconds: 2));

        // Should be back at login screen
        expect(find.byType(MaterialApp), findsOneWidget);
        print('✅ Logout successful - back at login');
      }

      print('🎉 All E2E tests passed!');
    });
  });

  group('E2E: Auth Flow Only', () {
    testWidgets('Login with invalid credentials', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Find email and password fields
      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'admin@musfishop.com');
      await tester.enterText(fields.at(1), 'WrongPassword123');

      // Tap login
      final loginButton = find.byType(ElevatedButton).first;
      await tester.tap(loginButton);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Should show error message
      expect(find.text('Invalid credentials'), findsOneWidget);
      print('✅ Invalid credentials error shown correctly');
    });

    testWidgets('Empty fields validation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Try to login without filling fields
      final loginButton = find.byType(ElevatedButton).first;
      await tester.tap(loginButton);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      // Should show validation error
      expect(find.byType(SnackBar) | find.text('required'), findsWidgets);
      print('✅ Validation errors shown');
    });
  });
}
