@echo off
echo Checking Integration...
echo.

echo Checking components...
if exist "client\src\components" (
    echo   [OK] Components directory exists
) else (
    echo   [ERROR] Components directory missing
    exit /b 1
)

echo Checking hooks...
if exist "client\src\hooks" (
    echo   [OK] Hooks directory exists
) else (
    echo   [ERROR] Hooks directory missing
    exit /b 1
)

echo Checking backend handlers...
if exist "backend\handlers" (
    echo   [OK] Handlers directory exists
) else (
    echo   [ERROR] Handlers directory missing
    exit /b 1
)

echo.
echo [SUCCESS] All checks passed!
echo.
echo Next steps:
echo 1. cd client ^&^& npm start
echo 2. cd backend ^&^& npm start
echo 3. Test the application
pause
