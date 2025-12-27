@echo off
echo ========================================
echo Starting MERN Chat Frontend (React)
echo ========================================
echo.

cd client

echo Checking if node_modules exists...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting React app on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
call npm start

pause
