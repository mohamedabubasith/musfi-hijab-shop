import 'package:equatable/equatable.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/models/dashboard_model.dart';

enum DashboardStatus { initial, loading, loaded, error }

class DashboardState extends Equatable {
  final DashboardStatus status;
  final DashboardModel? dashboard;
  final String? errorMessage;

  const DashboardState({
    this.status = DashboardStatus.initial,
    this.dashboard,
    this.errorMessage,
  });

  DashboardState copyWith({
    DashboardStatus? status,
    DashboardModel? dashboard,
    String? errorMessage,
  }) {
    return DashboardState(
      status: status ?? this.status,
      dashboard: dashboard ?? this.dashboard,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, dashboard, errorMessage];
}
