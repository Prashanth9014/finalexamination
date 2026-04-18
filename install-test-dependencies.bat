@echo off
echo Installing Backend Testing Dependencies...
cd server
npm install --save-dev jest supertest @types/jest ts-jest mongodb-memory-server

echo.
echo Installing Frontend Testing Dependencies...
cd ../client
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom babel-jest @babel/preset-env @babel/preset-react identity-obj-proxy

echo.
echo ✅ All testing dependencies installed!
echo.
echo To run tests:
echo Backend: cd server && npm test
echo Frontend: cd client && npm test
echo.
pause