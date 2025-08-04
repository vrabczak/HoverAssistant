@echo off
echo ========================================
echo Helicopter Hover Assistant Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo Step 2: Building the application...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo Step 3: Opening the application...
if exist "dist\helicopter-hover-assistant.html" (
    echo Opening Helicopter Hover Assistant in Chrome...
    start chrome "dist\helicopter-hover-assistant.html"
    echo.
    echo Setup complete! The app should now be open in Chrome.
    echo You can also find the built file at: dist\helicopter-hover-assistant.html
) else (
    echo ERROR: Built file not found!
    echo Please check the build output above for errors.
)
echo.
pause
