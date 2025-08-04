@echo off
echo Building Helicopter Hover Assistant...
npm run build
if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo Opening in Chrome...
    start chrome "dist\helicopter-hover-assistant.html"
) else (
    echo Build failed!
    pause
)
