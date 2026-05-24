import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/auth_requests.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/user_model.dart';
import 'package:musfi_shop_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_state.dart';

class MockAuthRepository implements AuthRepository {
  @override
  Future<AuthResponse> login(LoginRequest request) async {
    if (request.email == 'admin@musfi.com' && request.password == 'admin123') {
      return AuthResponse(
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: UserModel(
          id: '1',
          name: 'Admin',
          email: 'admin@musfi.com',
          role: 'admin',
        ),
      );
    }
    throw Exception('Invalid credentials');
  }

  @override
  Future<AuthResponse> refreshToken(String refreshToken) async {
    throw UnimplementedError();
  }

  @override
  Future<void> logout(String refreshToken) async {}

  @override
  Future<UserModel> getCurrentUser() async {
    return UserModel(
      id: '1',
      name: 'Admin',
      email: 'admin@musfi.com',
      role: 'admin',
    );
  }

  @override
  Future<void> forgotPassword(String email) async {}

  @override
  Future<void> resetPassword(String token, String newPassword) async {}

  @override
  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {}
}

void main() {
  group('AuthBloc', () {
    late AuthBloc authBloc;

    setUp(() {
      authBloc = AuthBloc(repository: MockAuthRepository());
    });

    tearDown(() {
      authBloc.close();
    });

    test('initial state is initial', () {
      expect(authBloc.state.status, AuthStatus.initial);
      expect(authBloc.state.user, null);
    });

    test('forgot password emits loading then initial on success', () {
      expectLater(
        authBloc.stream,
        emitsInOrder([
          const AuthState(status: AuthStatus.loading),
          predicate<AuthState>((s) => s.status == AuthStatus.initial),
        ]),
      );
      authBloc.add(const ForgotPasswordEvent(email: 'test@musfi.com'));
    });

    test('login emits loading then error (storage unavailable in test)', () {
      expectLater(
        authBloc.stream,
        emitsInOrder([
          const AuthState(status: AuthStatus.loading),
          predicate<AuthState>(
            (s) => s.status == AuthStatus.error && s.errorMessage != null,
          ),
        ]),
      );
      authBloc.add(
        const LoginEvent(email: 'admin@musfi.com', password: 'admin123'),
      );
    });

    test('reset password emits loading then initial on success', () {
      expectLater(
        authBloc.stream,
        emitsInOrder([
          const AuthState(status: AuthStatus.loading),
          predicate<AuthState>((s) => s.status == AuthStatus.initial),
        ]),
      );
      authBloc.add(
        const ResetPasswordEvent(token: 'tok', newPassword: 'newpass123'),
      );
    });
  });
}
