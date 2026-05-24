import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/auth_requests.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/user_model.dart';
import 'package:musfi_shop_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/pages/login_page.dart';

class _MockAuthRepository implements AuthRepository {
  @override
  Future<AuthResponse> login(LoginRequest request) async {
    if (request.email == 'admin@musfi.com' && request.password == 'admin123') {
      return AuthResponse(
        accessToken: 'at',
        refreshToken: 'rt',
        user: UserModel(id: '1', name: 'A', email: 'a@b.com', role: 'admin'),
      );
    }
    throw Exception('Invalid');
  }

  @override
  Future<AuthResponse> refreshToken(String refreshToken) async {
    throw UnimplementedError();
  }

  @override
  Future<void> logout(String t) async {}

  @override
  Future<UserModel> getCurrentUser() async =>
      UserModel(id: '1', name: 'A', email: 'a@b.com', role: 'admin');

  @override
  Future<void> forgotPassword(String e) async {}

  @override
  Future<void> resetPassword(String t, String p) async {}

  @override
  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {}
}

void main() {
  group('LoginPage Widget', () {
    testWidgets('renders login form elements', (WidgetTester tester) async {
      final authBloc = AuthBloc(repository: _MockAuthRepository());

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<AuthBloc>.value(
            value: authBloc,
            child: const LoginPage(),
          ),
        ),
      );

      expect(find.text('Musfi Hijab Shop'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);

      authBloc.close();
    });

    testWidgets('shows validation errors for empty fields', (
      WidgetTester tester,
    ) async {
      final authBloc = AuthBloc(repository: _MockAuthRepository());

      await tester.pumpWidget(
        MaterialApp(
          home: BlocProvider<AuthBloc>.value(
            value: authBloc,
            child: const LoginPage(),
          ),
        ),
      );

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      expect(find.text('Email is required'), findsOneWidget);
      expect(find.text('Password is required'), findsOneWidget);

      authBloc.close();
    });
  });
}
