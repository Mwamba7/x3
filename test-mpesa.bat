@echo off
echo ========================================
echo M-Pesa Integration Test Script
echo ========================================
echo.

echo Testing M-Pesa Configuration...
curl -s "https://kimberley-dextrocardial-coolly.ngrok-free.dev/api/test-mpesa" | jq .
echo.

echo Testing M-Pesa Authentication...
curl -s "https://kimberley-dextrocardial-coolly.ngrok-free.dev/api/mpesa/auth" | jq .
echo.

echo Testing STK Push (with test phone number)...
curl -s -X POST "https://kimberley-dextrocardial-coolly.ngrok-free.dev/api/mpesa/stk-push" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"254712345678\",\"amount\":1,\"reference\":\"TEST_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%\"}" | jq .
echo.

echo ========================================
echo Test completed!
echo.
echo Next steps:
echo 1. Check your phone for M-Pesa prompt
echo 2. Complete the payment
echo 3. Check payment status using the CheckoutRequestID
echo 4. Open test-mpesa-flow.html in your browser for interactive testing
echo ========================================
pause
