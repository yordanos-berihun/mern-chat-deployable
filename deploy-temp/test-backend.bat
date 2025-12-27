@echo off
echo Testing backend connection...
curl http://localhost:4000/health
echo.
echo.
echo If you see "OK" above, backend is running.
echo If not, run: cd backend && npm start
pause
