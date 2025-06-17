@echo off
echo Installing backend dependencies...
cd backend
npm install

echo.
echo Installing frontend dependencies...
cd ..
npm install

echo.
echo Setup complete! 

echo.
echo To start the application:
echo 1. Start backend server: cd backend && npm start
echo 2. Start frontend app: npm start (in main directory)
echo.
echo Or use the start-dev.bat script to start both automatically.

pause
