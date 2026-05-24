import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemChrome, DeviceOrientation;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:musfi_shop_mobile/core/network/api_client.dart';
import 'package:musfi_shop_mobile/core/theme/app_theme.dart';
import 'package:musfi_shop_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/pages/forgot_password_page.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/pages/login_page.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/pages/reset_password_page.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/pages/change_password_page.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/repositories/dashboard_repository.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:musfi_shop_mobile/features/stock/data/repositories/stock_repository.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/bloc/stock_bloc.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/pages/stock_list_page.dart';
import 'package:musfi_shop_mobile/features/stock/presentation/pages/stock_form_page.dart';
import 'package:musfi_shop_mobile/features/sales/data/repositories/sales_repository.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/bloc/sales_bloc.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/pages/sales_list_page.dart';
import 'package:musfi_shop_mobile/features/sales/presentation/pages/new_sale_page.dart';
import 'package:musfi_shop_mobile/features/deliveries/presentation/deliveries_page.dart';
import 'package:musfi_shop_mobile/features/reports/presentation/reports_page.dart';
import 'package:musfi_shop_mobile/features/settings/presentation/pages/settings_page.dart';
import 'package:musfi_shop_mobile/features/suppliers/presentation/suppliers_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const MusfiShopApp());
}

class MusfiShopApp extends StatefulWidget {
  final ApiClient? apiClient;
  final FlutterSecureStorage? storage;
  final AuthBloc? authBloc;
  final DashboardBloc? dashboardBloc;
  final StockBloc? stockBloc;
  final SalesBloc? salesBloc;

  const MusfiShopApp({
    super.key,
    this.apiClient,
    this.storage,
    this.authBloc,
    this.dashboardBloc,
    this.stockBloc,
    this.salesBloc,
  });

  @override
  State<MusfiShopApp> createState() => _MusfiShopAppState();
}

class _MusfiShopAppState extends State<MusfiShopApp> {
  late final AuthRepository _authRepository;
  late final DashboardRepository _dashboardRepository;
  late final StockRepository _stockRepository;
  late final SalesRepository _salesRepository;
  late final AuthBloc _authBloc;
  late final DashboardBloc _dashboardBloc;
  late final StockBloc _stockBloc;
  late final SalesBloc _salesBloc;
  late final GoRouter _router;
  StreamSubscription? _authSubscription;

  @override
  void initState() {
    super.initState();
    final apiClient = widget.apiClient ?? ApiClient();
    final storage = widget.storage ?? const FlutterSecureStorage();
    _authRepository = AuthRepository(apiClient);
    _dashboardRepository = DashboardRepository(apiClient);
    _stockRepository = StockRepository(apiClient);
    _salesRepository = SalesRepository(apiClient);
    _authBloc =
        widget.authBloc ??
        AuthBloc(repository: _authRepository, storage: storage);
    _dashboardBloc =
        widget.dashboardBloc ?? DashboardBloc(repository: _dashboardRepository);
    _stockBloc = widget.stockBloc ?? StockBloc(repository: _stockRepository);
    _salesBloc = widget.salesBloc ?? SalesBloc(repository: _salesRepository);
    _router = _createRouter();
    _authBloc.add(CheckAuthEvent());
    _authSubscription = _authBloc.stream.listen((state) {
      if (state.status == AuthStatus.unauthenticated) {
        _router.go('/login');
      } else if (state.status == AuthStatus.authenticated) {
        _router.go('/dashboard');
      }
    });
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _authBloc.close();
    _dashboardBloc.close();
    _stockBloc.close();
    _salesBloc.close();
    super.dispose();
  }

  GoRouter _createRouter() {
    return GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(
          path: '/login',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: LoginPage()),
        ),
        GoRoute(
          path: '/forgot-password',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: ForgotPasswordPage()),
        ),
        GoRoute(
          path: '/reset-password',
          pageBuilder: (context, state) {
            final token = state.uri.queryParameters['token'] ?? '';
            return NoTransitionPage(child: ResetPasswordPage(token: token));
          },
        ),
        GoRoute(
          path: '/change-password',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: ChangePasswordPage()),
        ),

        // App shell with bottom nav
        ShellRoute(
          builder: (context, state, child) => _AppShell(child: child),
          routes: [
            GoRoute(
              path: '/dashboard',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: DashboardPage()),
            ),
            GoRoute(
              path: '/stock',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: StockListPage()),
              routes: [
                GoRoute(
                  path: 'add',
                  pageBuilder: (context, state) =>
                      const NoTransitionPage(child: StockFormPage()),
                ),
                GoRoute(
                  path: 'edit/:id',
                  builder: (context, state) =>
                      StockFormPage(item: state.extra as dynamic),
                ),
              ],
            ),
            GoRoute(
              path: '/sales',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: SalesListPage()),
              routes: [
                GoRoute(
                  path: 'new',
                  pageBuilder: (context, state) =>
                      const NoTransitionPage(child: NewSalePage()),
                ),
              ],
            ),
            GoRoute(
              path: '/deliveries',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: DeliveriesPage()),
            ),
            GoRoute(
              path: '/reports',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: ReportsPage()),
            ),
            GoRoute(
              path: '/settings',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: SettingsPage()),
            ),
            GoRoute(
              path: '/suppliers',
              pageBuilder: (context, state) =>
                  const NoTransitionPage(child: SuppliersPage()),
            ),
          ],
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64),
              const SizedBox(height: 16),
              Text('Page not found: ${state.uri}'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/dashboard'),
                child: const Text('Go to Dashboard'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: _dashboardBloc),
        BlocProvider.value(value: _stockBloc),
        BlocProvider.value(value: _salesBloc),
      ],
      child: MaterialApp.router(
        title: 'Musfi Hijab Shop',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: _router,
      ),
    );
  }
}

class _AppShell extends StatelessWidget {
  final Widget child;
  const _AppShell({required this.child});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        return Scaffold(
          body: child,
          bottomNavigationBar: authState.status == AuthStatus.authenticated
              ? NavigationBar(
                  selectedIndex: _selectedIndex(context),
                  onDestinationSelected: (index) => _onTap(context, index),
                  destinations: const [
                    NavigationDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard),
                      label: 'Dashboard',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.inventory_2_outlined),
                      selectedIcon: Icon(Icons.inventory_2),
                      label: 'Stock',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.receipt_long_outlined),
                      selectedIcon: Icon(Icons.receipt_long),
                      label: 'Sales',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.local_shipping_outlined),
                      selectedIcon: Icon(Icons.local_shipping),
                      label: 'Deliveries',
                    ),
                    NavigationDestination(
                      icon: Icon(Icons.more_horiz),
                      label: 'More',
                    ),
                  ],
                )
              : null,
        );
      },
    );
  }

  int _selectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/stock')) return 1;
    if (location.startsWith('/sales')) return 2;
    if (location.startsWith('/deliveries')) return 3;
    return 0; // Dashboard
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
      case 1:
        context.go('/stock');
      case 2:
        context.go('/sales');
      case 3:
        context.go('/deliveries');
      case 4:
        _showMoreMenu(context);
    }
  }

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.bar_chart),
              title: const Text('Reports'),
              onTap: () {
                Navigator.pop(ctx);
                context.go('/reports');
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(ctx);
                context.go('/settings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.business),
              title: const Text('Suppliers'),
              onTap: () {
                Navigator.pop(ctx);
                context.go('/suppliers');
              },
            ),
            ListTile(
              leading: const Icon(Icons.password_rounded),
              title: const Text('Change Password'),
              onTap: () {
                Navigator.pop(ctx);
                context.go('/change-password');
              },
            ),
            const Divider(),
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                if (state.user != null) {
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: 0.1),
                      child: Text(
                        state.user!.name[0].toUpperCase(),
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ),
                    title: Text(state.user!.name),
                    subtitle: Text(state.user!.email),
                  );
                }
                return const SizedBox();
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(ctx);
                context.read<AuthBloc>().add(LogoutEvent());
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
