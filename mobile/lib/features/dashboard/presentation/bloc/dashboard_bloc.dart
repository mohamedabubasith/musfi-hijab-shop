import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/repositories/dashboard_repository.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/bloc/dashboard_event.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/bloc/dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final DashboardRepository _repository;

  DashboardBloc({required DashboardRepository repository})
    : _repository = repository,
      super(const DashboardState()) {
    on<LoadDashboardEvent>(_onLoadDashboard);
  }

  Future<void> _onLoadDashboard(
    LoadDashboardEvent event,
    Emitter<DashboardState> emit,
  ) async {
    emit(state.copyWith(status: DashboardStatus.loading));
    try {
      final dashboard = await _repository.getDashboard();
      emit(
        state.copyWith(status: DashboardStatus.loaded, dashboard: dashboard),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: DashboardStatus.error,
          errorMessage: e.toString(),
        ),
      );
    }
  }
}
