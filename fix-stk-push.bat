@echo off
echo 🔧 Fixing M-Pesa STK Push Issues...
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo ✅ .env file created
) else (
    echo ✅ .env file exists
)

echo.
echo 📋 Troubleshooting Steps:
echo.
echo 1. ✅ Environment file configured
echo 2. 🔍 Next: Check debug page at /debug-mpesa.html
echo 3. 🧪 Test authentication first
echo 4. 📱 Then test STK push with 254708374149
echo.
echo 🚀 Quick Actions:
echo - Visit: http://localhost:3000/debug-mpesa.html
echo - Check server console for detailed logs
echo - Use test phone: 254708374149
echo - Use test PIN: 1234
echo.
echo 🔧 Common Issues:
echo - Invalid credentials (check consumer key/secret)
echo - Network connectivity to Safaricom API
echo - Incorrect phone number format
echo - Amount outside sandbox limits (1-70000)
echo.
echo Press any key to open debug page...
pause > nul
start http://localhost:3000/debug-mpesa.html
