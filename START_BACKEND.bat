@echo off
echo ========================================
echo Starting MERN Chat Backend Server
echo ========================================
echo.

cd backend

echo Checking if node_modules exists...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server on http://localhost:4000
echo Press Ctrl+C to stop the server
echo.
call npm start

pause
