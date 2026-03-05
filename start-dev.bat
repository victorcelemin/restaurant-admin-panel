@echo off
echo =======================================
echo   RestaurantOS - Inicio de Desarrollo
echo =======================================
echo.

:: Start backend in a new window
echo [1/2] Iniciando backend FastAPI en puerto 8000...
start "RestaurantOS Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend in a new window
echo [2/2] Iniciando frontend Next.js en puerto 3000...
start "RestaurantOS Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo =======================================
echo   App iniciada!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   Docs API: http://localhost:8000/docs
echo.
echo   Usuario admin: admin / admin123
echo =======================================
echo.
pause
