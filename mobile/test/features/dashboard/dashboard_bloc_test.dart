import 'package:flutter_test/flutter_test.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/models/dashboard_model.dart';
import 'package:musfi_shop_mobile/features/dashboard/data/repositories/dashboard_repository.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/bloc/dashboard_event.dart';
import 'package:musfi_shop_mobile/features/dashboard/presentation/bloc/dashboard_state.dart';

class MockDashboardRepository implements DashboardRepository {
  @override
  Future<DashboardModel> getDashboard() async {
    return DashboardModel(
      todayRevenue: 15000,
      todayProfit: 5000,
      totalStockCount: 1200,
      pendingDeliveries: 8,
      monthlyRevenue: 150000,
      monthlyProfit: 45000,
    );
  }
}

void main() {
  late DashboardBloc dashboardBloc;

  setUp(() {
    dashboardBloc = DashboardBloc(repository: MockDashboardRepository());
  });

  tearDown(() {
    dashboardBloc.close();
  });

  group('DashboardBloc', () {
    test('initial state is initial', () {
      expect(dashboardBloc.state.status, DashboardStatus.initial);
      expect(dashboardBloc.state.dashboard, null);
    });

    test('emits loading then loaded on successful load', () {
      expectLater(
        dashboardBloc.stream,
        emitsInOrder([
          const DashboardState(status: DashboardStatus.loading),
          predicate<DashboardState>(
            (state) =>
                state.status == DashboardStatus.loaded &&
                state.dashboard?.todayRevenue == 15000 &&
                state.dashboard?.todayProfit == 5000,
          ),
        ]),
      );

      dashboardBloc.add(LoadDashboardEvent());
    });
  });
}
