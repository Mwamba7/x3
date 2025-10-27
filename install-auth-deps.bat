@echo off
echo Installing authentication dependencies...
echo.

echo Installing bcryptjs for password hashing...
npm install bcryptjs

echo Installing jsonwebtoken for JWT tokens...
npm install jsonwebtoken

echo.
echo ✅ Authentication dependencies installed successfully!
echo.
echo You can now start the development server with: npm run dev
pause
