@echo off
echo Fixing M-Pesa CallBack URL issue...
echo.

echo 🔧 The issue: M-Pesa requires a public HTTPS URL for callbacks
echo 💡 Current fix: Using postman-echo.com as temporary callback
echo.

echo ✅ IMMEDIATE FIX APPLIED:
echo - CallBack URL changed to: https://postman-echo.com/post
echo - This is a public endpoint that accepts POST requests
echo - STK Push should now work for testing
echo.

echo 🧪 TEST NOW:
echo 1. Your server should be running
echo 2. Visit: /test-simple-payment.html
echo 3. Use phone: 254708374149
echo 4. Use PIN: 1234
echo 5. STK Push should work!
echo.

echo 📱 What happens:
echo - STK Push will be sent to test phone
echo - You can complete payment with PIN 1234
echo - Callback will go to postman-echo.com (not your server)
echo - Payment will appear successful in your app
echo.

echo 🔄 For production, you need:
echo 1. A public domain with HTTPS
echo 2. Or use ngrok for local development
echo 3. Update CallBackURL to your public endpoint
echo.

echo Press any key to open test page...
pause > nul
start http://localhost:3000/test-simple-payment.html
