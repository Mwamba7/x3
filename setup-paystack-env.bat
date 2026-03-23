@echo off
echo Setting up Paystack environment variables...

REM Check if .env exists, if not create it
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
)

REM Add Paystack configuration to .env if not already present
echo.
echo Adding Paystack configuration to .env file...

(
echo.
echo # Paystack Payment Configuration
echo PAYSTACK_SECRET_KEY=""
echo PAYSTACK_PUBLIC_KEY=""
echo PAYSTACK_CALLBACK_URL=""
echo PAYSTACK_WEBHOOK_URL=""
echo PAYSTACK_WEBHOOK_SECRET=""
) >> .env

echo.
echo ✅ Paystack environment variables have been added to .env file
echo.
echo Please restart your Next.js development server for the changes to take effect
echo.
pause
