@echo off
echo Clearing React cache and restarting...
cd client
rmdir /s /q node_modules\.cache 2>nul
del /q package-lock.json 2>nul
npm install
echo.
echo Cache cleared! Now run: npm start
pause
