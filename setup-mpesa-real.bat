@echo off
echo Setting up Real M-Pesa Integration...
echo.

REM Copy .env.example to .env
if exist .env (
    echo .env file already exists
    echo.
    choice /M "Do you want to overwrite it"
    if errorlevel 2 goto :skip
)

copy .env.example .env
echo ✅ .env file created with M-Pesa credentials!

:skip
echo.
echo 📋 M-Pesa Configuration:
echo - Consumer Key: VhJ3SaroNiEiFQTTimt7HDn3dDlWTmJjxKfAB4wqwZIZpLte
echo - Environment: Sandbox
echo - Business Short Code: 174379
echo.
echo 🧪 Testing:
echo - Test Phone: 254708374149
echo - Test PIN: 1234
echo - Test Amount: 1-70000 KSH
echo.
echo 🚀 Next Steps:
echo 1. Restart your development server: npm run dev
echo 2. Visit /test-simple-payment.html to test
echo 3. Use test phone 254708374149 with PIN 1234
echo.
echo 🎉 Real M-Pesa integration is now ready!
pause
