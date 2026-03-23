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
echo PAYSTACK_SECRET_KEY="sk_test_ad3ac47205d9d8631f936f4ffb733c987fd824a2"
echo PAYSTACK_PUBLIC_KEY="pk_test_afd9d8007310d8b197061be88fb8db9e0c8c736b"
echo PAYSTACK_CALLBACK_URL="https://chainless-unalgebraical-mistie.ngrok-free.dev"
echo PAYSTACK_WEBHOOK_URL="https://chainless-unalgebraical-mistie.ngrok-free.dev"
echo PAYSTACK_WEBHOOK_SECRET="paystack_webhook_secret"
) >> .env

echo.
echo ✅ Paystack environment variables have been added to .env file
echo.
echo Please restart your Next.js development server for the changes to take effect
echo.
pause
