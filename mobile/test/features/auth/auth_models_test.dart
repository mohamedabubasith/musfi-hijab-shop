import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/auth_requests.dart';
import 'package:musfi_shop_mobile/features/auth/data/models/user_model.dart';

void main() {
  group('LoginRequest', () {
    test('toJson returns correct map', () {
      final request = LoginRequest(email: 'test@test.com', password: 'pass123');
      final json = request.toJson();
      expect(json['email'], 'test@test.com');
      expect(json['password'], 'pass123');
    });
  });

  group('ForgotPasswordRequest', () {
    test('toJson returns correct map', () {
      final request = ForgotPasswordRequest(email: 'test@test.com');
      expect(request.toJson()['email'], 'test@test.com');
    });
  });

  group('ResetPasswordRequest', () {
    test('toJson returns correct map', () {
      final request = ResetPasswordRequest(
        token: 'abc',
        newPassword: 'newpass',
      );
      expect(request.toJson()['token'], 'abc');
      expect(request.toJson()['new_password'], 'newpass');
    });
  });

  group('ChangePasswordRequest', () {
    test('toJson returns correct map', () {
      final request = ChangePasswordRequest(
        currentPassword: 'old',
        newPassword: 'new',
      );
      expect(request.toJson()['current_password'], 'old');
      expect(request.toJson()['new_password'], 'new');
    });
  });

  group('UserModel', () {
    final mockJson = {
      'id': '550e8400-e29b-41d4-a716-446655440000',
      'name': 'Test User',
      'email': 'test@musfi.com',
      'role': 'admin',
      'phone': '1234567890',
      'is_active': true,
      'created_at': '2025-01-01T00:00:00Z',
    };

    test('fromJson creates correct model', () {
      final user = UserModel.fromJson(mockJson);
      expect(user.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(user.name, 'Test User');
      expect(user.email, 'test@musfi.com');
      expect(user.role, 'admin');
      expect(user.phone, '1234567890');
      expect(user.isActive, true);
    });

    test('fromJson handles null fields', () {
      final json = {
        'id': '123',
        'name': 'A',
        'email': 'a@b.com',
        'role': 'sales',
      };
      final user = UserModel.fromJson(json);
      expect(user.phone, null);
      expect(user.isActive, true);
    });

    test('toJson returns correct map', () {
      final user = UserModel.fromJson(mockJson);
      final json = user.toJson();
      expect(json['name'], 'Test User');
      expect(json['email'], 'test@musfi.com');
      expect(json['role'], 'admin');
      expect(json['phone'], '1234567890');
    });
  });

  group('AuthResponse', () {
    test('fromJson creates correct response', () {
      final json = {
        'access_token': 'access123',
        'refresh_token': 'refresh123',
        'user': {
          'id': '1',
          'name': 'Admin',
          'email': 'admin@musfi.com',
          'role': 'admin',
        },
      };
      final response = AuthResponse.fromJson(json);
      expect(response.accessToken, 'access123');
      expect(response.refreshToken, 'refresh123');
      expect(response.user.name, 'Admin');
      expect(response.user.role, 'admin');
    });
  });
}
