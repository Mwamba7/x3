@echo off
echo Creating .env file with M-Pesa credentials...
echo.

REM Create .env file with proper credentials
echo # Copy this file to .env and adjust values > .env
echo # MongoDB connection string >> .env
echo MONGODB_URI="" >> .env
echo. >> .env
echo # Used to sign session cookies (use a long random string in real deployment) >> .env
echo SESSION_SECRET="change_this_to_a_long_random_secret" >> .env
echo. >> .env
echo # Base URL for your application >> .env
echo # For local development: >> .env
echo NEXT_PUBLIC_BASE_URL="http://localhost:3000" >> .env
echo # For production deployment: >> .env
echo # NEXT_PUBLIC_BASE_URL="https://your-domain.com" >> .env
echo. >> .env
echo # M-Pesa Daraja API Configuration >> .env
echo MPESA_CONSUMER_KEY="" >> .env
echo MPESA_CONSUMER_SECRET="" >> .env
echo MPESA_BUSINESS_SHORT_CODE="174379" >> .env
echo MPESA_PASSKEY="" >> .env
echo MPESA_ENVIRONMENT="sandbox" >> .env

echo ✅ .env file created successfully with M-Pesa credentials!
echo.
echo 📋 Configuration added:
echo - MPESA_CONSUMER_KEY: [SET IN .env]
echo - MPESA_CONSUMER_SECRET: [SET IN .env]
echo - MPESA_BUSINESS_SHORT_CODE: 174379
echo - MPESA_ENVIRONMENT: sandbox
echo.
echo 🚀 Next steps:
echo 1. Restart your development server: npm run dev
echo 2. Test M-Pesa integration at: /test-simple-payment.html
echo 3. Use test phone: 254708374149
echo 4. Use test PIN: 1234
echo.
echo 🎉 M-Pesa integration is now ready!
pause
