@echo off
echo Setting up ngrok for M-Pesa callbacks...
echo.

echo 📋 Instructions to fix CallBack URL issue:
echo.
echo OPTION 1 - Use ngrok (Recommended):
echo 1. Download ngrok from: https://ngrok.com/download
echo 2. Extract ngrok.exe to this folder
echo 3. Run: ngrok http 3000
echo 4. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
echo 5. Update NEXT_PUBLIC_BASE_URL in .env file
echo 6. Restart your server
echo.
echo OPTION 2 - Use temporary callback (Testing only):
echo 1. The callback URL is now set to postman-echo.com
echo 2. STK Push should work for testing
echo 3. You won't receive callback notifications
echo 4. Payment status will need manual checking
echo.
echo OPTION 3 - Use webhook.site (Testing):
echo 1. Visit: https://webhook.site/
echo 2. Copy your unique URL
echo 3. Update the CallBackURL in app/api/pay/route.js
echo 4. You can see callbacks in real-time
echo.
echo 🚀 Quick Test (Current Setup):
echo - The callback URL is now set to a public endpoint
echo - STK Push should work immediately
echo - Test with phone: 254708374149
echo - Test PIN: 1234
echo.
echo Press any key to continue...
pause > nul
