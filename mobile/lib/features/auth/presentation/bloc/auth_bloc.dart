import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:musfi_shop_mobile/core/constants/app_constants.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/auth_requests.dart';
import 'package:musfi_shop_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:musfi_shop_mobile/features/auth/presentation/bloc/auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repository;
  final FlutterSecureStorage _storage;

  AuthBloc({required AuthRepository repository, FlutterSecureStorage? storage})
    : _repository = repository,
      _storage = storage ?? const FlutterSecureStorage(),
      super(const AuthState()) {
    on<LoginEvent>(_onLogin);
    on<LogoutEvent>(_onLogout);
    on<CheckAuthEvent>(_onCheckAuth);
    on<ForgotPasswordEvent>(_onForgotPassword);
    on<ResetPasswordEvent>(_onResetPassword);
    on<ChangePasswordEvent>(_onChangePassword);
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
    try {
      final response = await _repository.login(
        LoginRequest(email: event.email, password: event.password),
      );
      try {
        await _storage.write(
          key: AppConstants.storageKeyToken,
          value: response.accessToken,
        );
        await _storage.write(
          key: AppConstants.storageKeyRefreshToken,
          value: response.refreshToken,
        );
      } catch (_) {
        // Storage failure — still allow login for this session
      }
      emit(
        state.copyWith(status: AuthStatus.authenticated, user: response.user),
      );
    } catch (e) {
      emit(
        state.copyWith(status: AuthStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onLogout(LogoutEvent event, Emitter<AuthState> emit) async {
    try {
      final refreshToken = await _storage.read(
        key: AppConstants.storageKeyRefreshToken,
      );
      if (refreshToken != null) {
        await _repository.logout(refreshToken);
      }
    } catch (_) {}
    await _storage.deleteAll();
    emit(state.copyWith(status: AuthStatus.unauthenticated, user: null));
  }

  Future<void> _onCheckAuth(
    CheckAuthEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final token = await _storage.read(key: AppConstants.storageKeyToken);
      if (token == null) {
        emit(state.copyWith(status: AuthStatus.unauthenticated));
        return;
      }
      final user = await _repository.getCurrentUser();
      emit(state.copyWith(status: AuthStatus.authenticated, user: user));
    } catch (_) {
      try {
        await _storage.deleteAll();
      } catch (_) {}
      emit(state.copyWith(status: AuthStatus.unauthenticated));
    }
  }

  Future<void> _onForgotPassword(
    ForgotPasswordEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
    try {
      await _repository.forgotPassword(event.email);
      emit(state.copyWith(status: AuthStatus.initial));
    } catch (e) {
      emit(
        state.copyWith(status: AuthStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onResetPassword(
    ResetPasswordEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
    try {
      await _repository.resetPassword(event.token, event.newPassword);
      emit(state.copyWith(status: AuthStatus.initial));
    } catch (e) {
      emit(
        state.copyWith(status: AuthStatus.error, errorMessage: e.toString()),
      );
    }
  }

  Future<void> _onChangePassword(
    ChangePasswordEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
    try {
      await _repository.changePassword(
        event.currentPassword,
        event.newPassword,
      );
      emit(state.copyWith(status: AuthStatus.initial));
    } catch (e) {
      emit(
        state.copyWith(status: AuthStatus.error, errorMessage: e.toString()),
      );
    }
  }
}
