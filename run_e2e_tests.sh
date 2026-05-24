#!/bin/bash

# Musfi Shop Mobile - E2E Test Runner
# Run API tests, E2E UI tests, and manage the testing workflow

set -e

PROJECT_DIR="/Users/abu/Abu/sales-tracker/musfi-shop/mobile"
DEVICE_ID="ugxo5xpzyxoz5lfe"
BACKEND_URL="http://localhost:8000"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║    Musfi Shop Mobile - E2E Test Runner                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Menu
show_menu() {
    echo -e "\n${YELLOW}Select test to run:${NC}"
    echo "1) Run API Integration Tests (Backend)"
    echo "2) Run E2E UI Tests on Device"
    echo "3) Run ALL Tests (API + E2E)"
    echo "4) View Device Logs"
    echo "5) Rebuild and Reinstall APK"
    echo "6) Check Backend Status"
    echo "7) Exit"
    echo -e "\nEnter choice [1-7]: "
}

# Check backend is running
check_backend() {
    echo -e "${BLUE}Checking backend status...${NC}"
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Backend is NOT running${NC}"
        echo -e "${YELLOW}Start backend with: cd /Users/abu/Abu/sales-tracker/musfi-shop/backend && uv run uvicorn app.main:app --reload${NC}"
        return 1
    fi
}

# Check device is connected
check_device() {
    echo -e "${BLUE}Checking device connection...${NC}"
    if adb devices | grep -q "$DEVICE_ID"; then
        echo -e "${GREEN}✓ Device is connected${NC}"
        return 0
    else
        echo -e "${RED}✗ Device is NOT connected${NC}"
        echo -e "${YELLOW}Connect your Android device and enable USB debugging${NC}"
        return 1
    fi
}

# Run API tests
run_api_tests() {
    echo -e "\n${BLUE}Running API Integration Tests...${NC}"
    cd "$PROJECT_DIR"
    
    if ! check_backend; then
        echo -e "${RED}Cannot run tests - backend not available${NC}"
        return 1
    fi
    
    flutter test test/integration/auth_integration_test.dart -v
    echo -e "${GREEN}✓ API tests completed${NC}"
}

# Run E2E UI tests
run_e2e_tests() {
    echo -e "\n${BLUE}Running E2E UI Tests on Device...${NC}"
    cd "$PROJECT_DIR"
    
    if ! check_device; then
        echo -e "${RED}Cannot run tests - device not available${NC}"
        return 1
    fi
    
    if ! check_backend; then
        echo -e "${RED}Cannot run tests - backend not available${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Note: This will take 2-5 minutes on the device${NC}"
    flutter test integration_test/app_e2e_test.dart \
        --dart-define=BACKEND_URL=$BACKEND_URL \
        -d $DEVICE_ID
    echo -e "${GREEN}✓ E2E tests completed${NC}"
}

# Run all tests
run_all_tests() {
    echo -e "\n${BLUE}Running ALL Tests...${NC}"
    
    echo -e "\n${YELLOW}--- Phase 1: API Tests ---${NC}"
    run_api_tests || {
        echo -e "${RED}API tests failed${NC}"
        return 1
    }
    
    sleep 2
    
    echo -e "\n${YELLOW}--- Phase 2: E2E UI Tests ---${NC}"
    run_e2e_tests || {
        echo -e "${RED}E2E tests failed${NC}"
        return 1
    }
    
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ✓ ALL TESTS PASSED SUCCESSFULLY! ✓                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
}

# View device logs
view_logs() {
    echo -e "\n${BLUE}Viewing device logs (Press Ctrl+C to stop)...${NC}"
    adb logcat -d | grep musfi
    echo -e "\n${YELLOW}Watching live logs...${NC}"
    adb logcat -v brief | grep musfi
}

# Rebuild APK
rebuild_apk() {
    echo -e "\n${BLUE}Rebuilding APK...${NC}"
    cd "$PROJECT_DIR"
    
    echo -e "${YELLOW}Cleaning...${NC}"
    flutter clean
    flutter pub get
    
    echo -e "${YELLOW}Building APK...${NC}"
    flutter build apk \
        --dart-define=BACKEND_URL=$BACKEND_URL \
        --release
    
    if check_device; then
        echo -e "\n${YELLOW}Installing on device...${NC}"
        adb install -r build/app/outputs/flutter-apk/app-release.apk
        echo -e "\n${YELLOW}Launching app...${NC}"
        adb shell am start -n com.example.musfi_shop_mobile/.MainActivity
        echo -e "${GREEN}✓ APK rebuilt, installed, and launched${NC}"
    else
        echo -e "${GREEN}✓ APK rebuilt successfully${NC}"
        echo -e "${YELLOW}Install with: adb install -r build/app/outputs/flutter-apk/app-release.apk${NC}"
    fi
}

# Check backend status
check_backend_status() {
    echo -e "\n${BLUE}Backend Status Check${NC}"
    echo -e "${YELLOW}─────────────────────────────${NC}"
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        
        # Check API endpoints
        echo -e "\n${YELLOW}Testing API endpoints:${NC}"
        
        # Health
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ /health${NC}"
        else
            echo -e "${RED}  ✗ /health${NC}"
        fi
        
        # Auth
        if curl -s -X POST http://localhost:8000/api/v1/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@musfishop.com","password":"Admin@123"}' > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ /api/v1/auth/login${NC}"
        else
            echo -e "${RED}  ✗ /api/v1/auth/login${NC}"
        fi
        
        # Stock
        if curl -s http://localhost:8000/api/v1/stock \
            -H "Authorization: Bearer test" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ /api/v1/stock${NC}"
        else
            echo -e "${YELLOW}  ⚠ /api/v1/stock (needs auth)${NC}"
        fi
        
    else
        echo -e "${RED}✗ Backend is NOT running${NC}"
        echo -e "\n${YELLOW}Start backend with:${NC}"
        echo -e "  cd /Users/abu/Abu/sales-tracker/musfi-shop/backend"
        echo -e "  uv run uvicorn app.main:app --reload"
    fi
}

# Main loop
main() {
    print_banner
    
    while true; do
        show_menu
        read choice
        
        case $choice in
            1)
                run_api_tests
                ;;
            2)
                run_e2e_tests
                ;;
            3)
                run_all_tests
                ;;
            4)
                view_logs
                ;;
            5)
                rebuild_apk
                ;;
            6)
                check_backend_status
                ;;
            7)
                echo -e "\n${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                ;;
        esac
    done
}

# Run if executed directly
main
