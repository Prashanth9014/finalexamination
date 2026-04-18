@echo off
echo ========================================
echo Starting Deployment Process...
echo ========================================

echo.
echo [1/5] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo ERROR: Git pull failed!
    exit /b 1
)

echo.
echo [2/5] Installing backend dependencies...
cd server
npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    exit /b 1
)

echo.
echo [3/5] Building TypeScript project...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    exit /b 1
)

echo.
echo [4/5] Restarting PM2 application...
pm2 restart exam-app
if %errorlevel% neq 0 (
    echo WARNING: PM2 restart failed, trying to start...
    pm2 start dist/server.js --name exam-app
    if %errorlevel% neq 0 (
        echo ERROR: PM2 start failed!
        exit /b 1
    )
)

echo.
echo [5/5] Checking application status...
pm2 status exam-app

echo.
echo ========================================
echo ✅ Deployment completed successfully!
echo ========================================
echo Application is running on: http://192.168.29.174:5050
echo.

cd ..