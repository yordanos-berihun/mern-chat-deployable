@echo off
echo Testing File Upload System...
echo.

echo 1. Checking backend server...
curl -s http://localhost:4000/health > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Backend not running!
    echo Run: cd backend ^&^& npm start
    pause
    exit /b 1
)
echo [OK] Backend running

echo.
echo 2. Checking uploads directory...
if exist "backend\uploads" (
    echo [OK] Uploads directory exists
) else (
    echo [ERROR] Uploads directory missing
    mkdir backend\uploads
    echo [FIXED] Created uploads directory
)

echo.
echo 3. Testing file access...
curl -s -I http://localhost:4000/uploads/test.jpg | findstr "404\|200" > nul
echo [INFO] Test complete

echo.
echo 4. Checking database messages...
cd backend
node check-files.js

echo.
echo ========================================
echo NEXT STEPS:
echo 1. Open http://localhost:3000
echo 2. Login to chat
echo 3. Click paperclip icon
echo 4. Upload a NEW file
echo 5. File should display immediately
echo ========================================
pause
