# What We Did

## Integrated Features
- **Auth**: Login, Logout, Token Refresh, Forgot Password, Reset Password, Change Password
- **Dashboard**: Summary metrics (today revenue/profit, monthly, stock count)
- **Stock**: Create, Read, Update, Delete, Restock, Low Stock Alerts, SKU lookup
- **Sales**: Create transactions, List with pagination (invoice numbers auto-generated)
- **Suppliers**: Create, List (filtered by country, contact info)
- **Deliveries**: List (track delivery status)
- **Shop Config**: Categories, Origins (seed data populated)

## Backend CORS Fix
- `FRONTEND_URL` was hardcoded to `http://localhost:5173` (React Vite)
- Flutter Web runs on port 3000 by default, causing 400 on OPTIONS preflight
- Fixed by adding `http://localhost:3000,http://127.0.0.1:3000` to `EXTRA_CORS_ORIGINS` default in `backend/app/config.py`

## Mobile Features Added
- **Change Password page**: `/change-password` route, `ChangePasswordEvent`, `_onChangePassword` handler in AuthBloc, menu item in More sheet
- **Stock Delete**: Delete icon button on stock card, confirmation dialog, wired to existing `DeleteStockEvent`
- **CORS diagnostic**: Traced 400 OPTIONS failure to strict origin whitelist in CORSMiddleware

## Test Results

### Unit Tests (47 passing)
- `flutter analyze` — 0 errors, 0 warnings, 4 info-level lints
- auth_bloc_test — 3 tests
- dashboard_bloc_test — 2 tests
- stock_bloc_test — 6 tests
- sales_bloc_test — 13 tests
- widget_test — 2 tests
- auth_models_test — 8 tests (LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest, UserModel, AuthResponse)
- All pass with `flutter test`

### Integration Tests (29 passing)
- **mobile/test/integration/auth_integration_test.dart** — validates all backend endpoints against live running backend
- Auth: login (valid/invalid/missing fields), /me, refresh, logout, forgot-password, health (13 tests)
- Stock: list, create, read, patch, restock, alerts, by-sku lookup, delete (8 tests)
- Sales: list, create sale with items (2 tests)
- Dashboard: summary metrics shape (1 test)
- Suppliers: list, create (2 tests)
- Deliveries: list shape (1 test)
- Shop Config: categories, origins (2 tests)
- Skips gracefully when backend is not running (no crash)

## Key Findings
- **API pagination shape**: `{items: [...], total, page, page_size, pages}` (not `data`/`total_count`)
- **Prices are strings**: All monetary values returned as strings like `"1200.00"` (not numbers)
- **HTTPBearer**: Missing auth header returns 403 (not 401), which is Starlette/FastAPI default for required security scheme
- **Stock create requires**: `origin_country` field
- **Sales create requires**: `items[].stock_item_id` (not `item_id`)
- **Dashboard fields**: `total_stock_count`, `low_stock_count` (not `total_stock`, `low_stock`)
- **Test email** (`mohamedabu.basith@gmail.com`) password doesn't match DB if .env changed after first admin creation — use default `admin@musfishop.com` / `Admin@123` for guaranteed working credentials

## Blocked
- `LogoutEvent` and `CheckAuthEvent` tests cannot be added without mocking `FlutterSecureStorage` (needs `flutter_secure_storage_test` or interface extraction)
- Widget navigation test for login success/failure requires GoRouter test utilities (not yet set up)
