@echo off
echo Uruchamianie aplikacji Twitter Timeline...
echo.

echo [1/2] Uruchamianie backend serwera...
start "Backend Server" cmd /k "cd backend && npm start"

echo [2/2] Oczekiwanie na backend i uruchamianie frontend...
timeout /t 3 /nobreak > nul

echo Uruchamianie frontend aplikacji...
npm start

echo.
echo Aplikacja powinna być dostępna na:
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:4200
echo.
echo Aby zatrzymać aplikację, zamknij oba okna terminala.
pause
